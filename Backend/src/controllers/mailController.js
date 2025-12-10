// src/controllers/mailController.js
import { google } from "googleapis";
import GmailToken from "../models/GmailToken.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Readable } from "stream";
import { getGFS } from "../utils/gridfs.js";
import mongoose from "mongoose";  

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Save refresh token
oauth2Client.on("tokens", async (tokens) => {
  if (tokens.refresh_token) {
    await GmailToken.deleteMany();
    await GmailToken.create(tokens);
    console.log("🔄 Saved new Gmail refresh token");
  }
});

// Generate Google Auth URL
export const authViaGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
  });
  res.json({ authUrl: url });
};

// Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (tokens.refresh_token) {
      await GmailToken.deleteMany();
      await GmailToken.create(tokens);
    }

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userinfo } = await oauth2.userinfo.get();

    let user = await User.findOne({ email: userinfo.email });
    if (!user) {
      user = await User.create({
        full_name: userinfo.name || "Google User",
        email: userinfo.email,
        password: "google-oauth",
      });
    }

    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const redirectUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/login?googleToken=${appToken}&profile=${encodeURIComponent(
      JSON.stringify({ full_name: user.full_name, email: user.email })
    )}`;

    res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ googleCallback error:", err);
    res.status(500).send("Google OAuth failed");
  }
};

// Load saved Gmail token
export const loadToken = async () => {
  const savedToken = await GmailToken.findOne();
  if (!savedToken) return null;

  oauth2Client.setCredentials(savedToken);
  return oauth2Client;
};
export const fetchMailAttachments = async (req, res) => {
  try {
    const client = await loadToken();
    if (!client) return res.status(401).json({ error: "Not authenticated with Gmail" });

    const gmail = google.gmail({ version: "v1", auth: client });
    const { data } = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread has:attachment",
    });

    const messages = data.messages || [];
    const savedFiles = [];

    const gfs = getGFS(); // safe GridFS access

    for (const mail of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: mail.id,
        format: "full",
      });

      const parts = msg.data.payload.parts || [];
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
            from: msg.data.payload.headers.find((h) => h.name === "From")?.value || "",
            threadId: msg.data.threadId,
          },
        });

        const readable = new Readable();
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);

        savedFiles.push({ filename: part.filename });
      }

      // mark mail as read
      await gmail.users.messages.modify({
        userId: "me",
        id: mail.id,
        resource: { removeLabelIds: ["UNREAD"] },
      });
    }

    res.json({ message: `Saved ${savedFiles.length} attachments`, saved: savedFiles });
  } catch (err) {
    console.error("❌ fetchMailAttachments error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch mail" });
  }
};


export const listMailFiles = async (req, res) => {
  try {
    await getGFS(); // ensure GridFS is ready

    const files = await mongoose.connection.db
      .collection("mailUploads.files")
      .find()
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files found" });
    }

    res.json(files);
  } catch (err) {
    console.error("❌ listMailFiles error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Download a file by filename
 */
export const downloadMailFile = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) return res.status(400).json({ message: "Filename required" });

    const gfs = await getGFS();

    // Find file first
    const file = await mongoose.connection.db
      .collection("mailUploads.files")
      .findOne({ filename });

    if (!file) return res.status(404).json({ message: "File not found" });

    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);

    const downloadStream = gfs.openDownloadStream(file._id);
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("❌ downloadMailFile error:", err);
      res.status(500).json({ error: "Error downloading file" });
    });
  } catch (err) {
    console.error("❌ downloadMailFile error:", err);
    res.status(500).json({ error: err.message });
  }
};

