// path: src/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser"
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// NEW for real-time
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

// -----------------------------
// EXPRESS + SOCKET SERVER
// -----------------------------
const app = express();
const server = http.createServer(app);

// -----------------------------
// SOCKET.IO INIT
// -----------------------------
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ["GET", "POST"]
  }
});

// Socket.io events
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(express.json());
app.use(cookieParser());


const origins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({ origin: origins, credentials: true }));

// -----------------------------
// CONNECT DB
// -----------------------------
connectDB();

// -----------------------------
// UPLOAD DIRECTORY
// -----------------------------
if (process.env.FILE_UPLOAD_PROVIDER === 'local') {
  const uploadsDir = process.env.UPLOADS_DIR || './src/uploads';
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  app.use('/uploads', express.static('src/uploads'));
}

// -----------------------------
// ROUTES
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/notifications', notificationRoutes);

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get('/api/health', (req, res) => res.json({ ok: true }));
// app.get("/api/mail/files", async (req, res) => {
//   try {
//     const gfs = getGFS();
//     const files = await gfs.find().toArray();
//     res.json(files);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// -----------------------------
// SERVER LISTEN
// -----------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
