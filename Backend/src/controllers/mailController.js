import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Readable } from 'stream';

let gfs;

// Initialize GridFS bucket
mongoose.connection.on("connected", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'mailUploads'
  });
});

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const authViaGoogle = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
    prompt: 'consent'
  });
  res.json({ authUrl: url });
};

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("Google Auth Successful");

    res.redirect("http://localhost:3000/mail?auth_success=true");
  } catch (err) {
    res.status(500).send("Google OAuth failed");
  }
};

export const fetchMailAttachments = async (req, res) => {
  if (!oauth2Client.credentials.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread has:attachment"
    });

    const messages = response.data.messages || [];
    const saved = [];

    for (const mail of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: mail.id,
        format: "full",
      });

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
            metadata: {
              from: msg.data.payload.headers.find(h => h.name === "From")?.value,
              emailReceived: true
            }
          });

          const readable = new Readable();
          readable.push(fileBuffer);
          readable.push(null);
          readable.pipe(uploadStream);

          saved.push({ filename: part.filename });
        }
      }

      await gmail.users.messages.modify({
        userId: "me",
        id: mail.id,
        resource: { removeLabelIds: ["UNREAD"] }
      });
    }

    res.json({ message: `Saved ${saved.length} attachments`, saved });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch mail" });
  }
};

export const listMailFiles = async (req, res) => {
  try {
    gfs.find().toArray((err, files) => {
      res.json(files);
    });
  } catch {
    res.status(500).json({ error: "Failed to list files" });
  }
};

export const downloadMailFile = (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    gfs.openDownloadStream(id).pipe(res);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
};
