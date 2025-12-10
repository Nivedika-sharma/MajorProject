import mongoose from "mongoose";
import { google } from "googleapis";
import { Readable } from "stream";
import GmailToken from "../models/GmailToken.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// -------------------------------
// GRIDFS INIT
// -------------------------------
let gfs;

mongoose.connection.on("connected", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "mailUploads",
  });
});

// -------------------------------
// GOOGLE OAUTH INIT
// -------------------------------
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Save new refresh tokens when issued
oauth2Client.on("tokens", async (tokens) => {
  if (tokens.refresh_token) {
    await GmailToken.deleteMany();
    await GmailToken.create(tokens);
    console.log("🔄 Saved new Gmail refresh token");
  }
});

// -------------------------------
// STEP 1: GENERATE GOOGLE LOGIN URL
// -------------------------------
export const authViaGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      // Identity scopes (REQUIRED)
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",

      // Gmail access
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
  });

  res.json({ authUrl: url });
};

// -------------------------------
// STEP 2: GOOGLE CALLBACK
// -------------------------------
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("🔐 TOKENS:", tokens);

    // Save refresh token for Gmail usage
    if (tokens.refresh_token) {
      await GmailToken.deleteMany();
      await GmailToken.create(tokens);
    }

    // Fetch User Info (IMPORTANT)
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userinfo } = await oauth2.userinfo.get();

    const email = userinfo.email;
    const full_name = userinfo.name || "Google User";

    // Find or create backend user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        full_name,
        email,
        password: "google-oauth",
      });
    }

    // Create your own JWT
    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Redirect front-end
    const redirectUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/login?googleToken=${appToken}&profile=${encodeURIComponent(
      JSON.stringify({ full_name, email })
    )}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ googleCallback error:", err);
    return res.status(500).send("Google OAuth failed");
  }
};

// -------------------------------
// STEP 3: LOAD TOKEN FOR GMAIL API
// -------------------------------
export async function loadToken() {
  const savedToken = await GmailToken.findOne();
  if (!savedToken) return null;

  oauth2Client.setCredentials(savedToken);
  return oauth2Client;
}

// -------------------------------
// STEP 4: FETCH GMAIL ATTACHMENTS
// -------------------------------
export const fetchMailAttachments = async (req, res) => {
  try {
    const client = await loadToken();
    if (!client)
      return res.status(401).json({ error: "Not authenticated with Gmail" });

    const gmail = google.gmail({ version: "v1", auth: client });

    // Fetch unread mails with attachments
    const { data } = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread has:attachment",
    });

    const messages = data.messages || [];
    const savedFiles = [];

    for (const mail of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: mail.id,
        format: "full",
      });

      const parts = msg?.data?.payload?.parts || [];

      for (const part of parts) {
        if (!part.filename || !part.body.attachmentId) continue;

        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: mail.id,
          id: part.body.attachmentId,
        });

        const fileBuffer = Buffer.from(attachment.data.data, "base64");

        const uploadStream = gfs.openUploadStream(part.filename, {
          metadata: {
            from: msg.data.payload.headers.find((h) => h.name === "From")
              ?.value,
            threadId: msg.data.threadId,
          },
        });

        const readable = new Readable();
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);

        savedFiles.push({ filename: part.filename });
      }

      // Mark as read
      await gmail.users.messages.modify({
        userId: "me",
        id: mail.id,
        resource: { removeLabelIds: ["UNREAD"] },
      });
    }

    res.json({
      message: `Saved ${savedFiles.length} attachments`,
      saved: savedFiles,
    });
  } catch (err) {
    console.error("❌ fetchMailAttachments error:", err);
    res.status(500).json({ error: "Failed to fetch mail" });
  }
};

// -------------------------------
// STEP 5: LIST UPLOADED MAIL FILES
// -------------------------------
export const listMailFiles = async (req, res) => {
  try {
    gfs.find().toArray((err, files) => {
      if (err || !files) return res.status(500).json({ error: "Failed to list files" });

      const mapped = files.map((f) => ({
        id: f._id.toString(),
        filename: f.filename,
        size: f.length,
        mimeType: f.contentType || "application/octet-stream",
        url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/mail/files/${f._id}/download`,
        threadId: f.metadata?.threadId || "",
        from: f.metadata?.from || "",
        uploadedAt: f.uploadDate,
      }));

      res.json(mapped);
    });
  } catch (err) {
    console.error("❌ listMailFiles error:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
};

// -------------------------------
// STEP 6: DOWNLOAD FILE
// -------------------------------
export const downloadMailFile = (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    gfs.openDownloadStream(id).pipe(res);
  } catch (err) {
    return res.status(404).json({ error: "File not found" });
  }
};
