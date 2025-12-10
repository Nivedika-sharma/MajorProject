import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Readable } from 'stream';
import GmailToken from '../models/GmailToken.js';

// GRIDFS
let gfs;
mongoose.connection.on("connected", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'mailUploads'
  });
});

// GOOGLE OAUTH
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// AUTO SAVE NEW TOKENS
oauth2Client.on("tokens", async (tokens) => {
  if (tokens.refresh_token) {
    await GmailToken.deleteMany();
    await GmailToken.create(tokens);
  }
});

// -------------------------------
// STEP 1: GENERATE AUTH URL
// -------------------------------
export const authViaGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
    prompt: 'consent'
  });
  res.json({ authUrl: url });
};

// -------------------------------
// STEP 2: CALLBACK — SAVE TOKENS + REDIRECT
// -------------------------------
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);

    // save tokens in DB
    await GmailToken.deleteMany();
    await GmailToken.create(tokens);

    oauth2Client.setCredentials(tokens);

    // send token + profile info to frontend via redirect query
    const profile = {
      full_name: "Google User",
      email: "user@gmail.com", // optional: fetch real email from Google API
    };
    const frontendUrl = `http://localhost:5173/login?googleToken=${tokens.access_token}&profile=${encodeURIComponent(
      JSON.stringify(profile)
    )}`;

    res.redirect(frontendUrl);

  } catch (err) {
    console.error(err);
    res.status(500).send("Google OAuth failed");
  }
};

// -------------------------------
// UTIL: LOAD TOKEN BEFORE API CALLS
// -------------------------------
export async function loadToken() {
  const savedToken = await GmailToken.findOne();
  if (!savedToken) return null;
  oauth2Client.setCredentials(savedToken);
  return oauth2Client;
}

// -------------------------------
// STEP 3: FETCH MAIL ATTACHMENTS
// -------------------------------
export const fetchMailAttachments = async (req, res) => {
  try {
    const client = await loadToken();
    if (!client) return res.status(401).json({ error: "Not authenticated" });

    const gmail = google.gmail({ version: "v1", auth: client });
    const response = await gmail.users.messages.list({ userId: "me", q: "is:unread has:attachment" });
    const messages = response.data.messages || [];
    const saved = [];

    for (const mail of messages) {
      const msg = await gmail.users.messages.get({ userId: "me", id: mail.id, format: "full" });
      const parts = msg.data.payload.parts || [];

      for (const part of parts) {
        if (part.filename && part.body.attachmentId) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: mail.id,
            id: part.body.attachmentId
          });

          const fileBuffer = Buffer.from(attachment.data.data, "base64");
          const uploadStream = gfs.openUploadStream(part.filename, {
            metadata: { from: msg.data.payload.headers.find(h => h.name === "From")?.value }
          });

          const readable = new Readable();
          readable.push(fileBuffer);
          readable.push(null);
          readable.pipe(uploadStream);

          saved.push({ filename: part.filename });
        }
      }

      // mark mail as read
      await gmail.users.messages.modify({
        userId: "me",
        id: mail.id,
        resource: { removeLabelIds: ["UNREAD"] }
      });
    }

    res.json({ message: `Saved ${saved.length} attachments`, saved });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch mail" });
  }
};

// -------------------------------
// STEP 4: LIST FILES
// -------------------------------
export const listMailFiles = async (req, res) => {
  try {
    gfs.find().toArray((err, files) => {
      if (err) return res.status(500).json({ error: "Failed to list files" });
      res.json(files);
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list files" });
  }
};

// -------------------------------
// STEP 5: DOWNLOAD FILE
// -------------------------------
export const downloadMailFile = (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    gfs.openDownloadStream(id).pipe(res);
  } catch {
    res.status(404).json({ error: "File not found" });
  }
};
