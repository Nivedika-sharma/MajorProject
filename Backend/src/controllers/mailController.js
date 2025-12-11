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

// Google login URL
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

    const appToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const redirectUrl = `${process.env.FRONTEND_URL}/login?googleToken=${appToken}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ googleCallback error:", err);
    res.status(500).send("Google OAuth failed");
  }
};

// Load token
export const loadToken = async () => {
  const savedToken = await GmailToken.findOne();
  if (!savedToken) return null;
  oauth2Client.setCredentials(savedToken);
  return oauth2Client;
};

// ⭐ FIXED — FETCH MAIL ATTACHMENTS PER USER
export const fetchMailAttachments = async (req, res) => {
  try {
    const client = await loadToken();
    if (!client)
      return res.status(401).json({ error: "Not authenticated with Gmail" });

    const gmail = google.gmail({ version: "v1", auth: client });
    let savedFiles = [];
    let pageToken = null;

    const gfs = getGFS();

    // ⭐ FETCH ALL MAILS WITH PAGINATION
    while (true) {
      const response = await gmail.users.messages.list({
        userId: "me",
        q: "has:attachment",
        maxResults: 100,
        pageToken,
      });

      const messages = response.data.messages || [];

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

          const buffer = Buffer.from(attachment.data.data, "base64");
          const readable = new Readable();
          readable.push(buffer);
          readable.push(null);

          // ⭐ KEY FIX — SAVE FILE FOR SPECIFIC USER ONLY
          const uploadStream = gfs.openUploadStream(part.filename, {
            metadata: {
              userId: req.userId,
              from: msg.data.payload.headers.find((h) => h.name === "From")
                ?.value,
              threadId: msg.data.threadId,
            },
          });

          readable.pipe(uploadStream);
          savedFiles.push({ filename: part.filename });
        }
      }

      if (!response.data.nextPageToken) break;
      pageToken = response.data.nextPageToken;
    }

    res.json({
      message: `Saved ${savedFiles.length} attachments`,
      saved: savedFiles,
    });
  } catch (err) {
    console.error("❌ fetchMailAttachments error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ⭐ LIST FILES FOR LOGGED-IN USER ONLY
export const listMailFiles = async (req, res) => {
  try {
    const gfs = getGFS();

    const files = await mongoose.connection.db
      .collection("mailUploads.files")
      .find({ "metadata.userId": req.userId })
      .toArray();

    if (!files.length)
      return res.status(404).json({ message: "No files found for user" });

    res.json(files);
  } catch (err) {
    console.error("❌ listMailFiles error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ⭐ DOWNLOAD FILE BELONGING TO CURRENT USER ONLY
export const downloadMailFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const file = await mongoose.connection.db
      .collection("mailUploads.files")
      .findOne({ filename, "metadata.userId": req.userId });

    if (!file)
      return res.status(404).json({ message: "File not found for this user" });

    const gfs = getGFS();
    const stream = gfs.openDownloadStream(file._id);

    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);

    stream.pipe(res);
  } catch (err) {
    console.error("❌ downloadMailFile error:", err);
    res.status(500).json({ error: err.message });
  }
};
