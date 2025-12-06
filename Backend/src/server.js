// path: src/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
// import permissionRoutes from './routes/permissionRoutes.js';
// import commentRoutes from './routes/commentRoutes.js';
// import highlightRoutes from './routes/highlightRoutes.js';
// import bookmarkRoutes from './routes/bookmarkRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();
const app = express();
app.use(express.json());

const origins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'];
app.use(cors({ origin: origins }));

// Connect DB
connectDB();

// Ensure uploads dir exists when using local storage
if (process.env.FILE_UPLOAD_PROVIDER === 'local') {
  const uploadsDir = process.env.UPLOADS_DIR || './src/uploads';
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  // serve static files
  app.use('/uploads', express.static(path.resolve(uploadsDir)));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/documents', documentRoutes);
// app.use('/api/permissions', permissionRoutes);
// app.use('/api/comments', commentRoutes);
// app.use('/api/highlights', highlightRoutes);
// app.use('/api/bookmarks', bookmarkRoutes);
// app.use('/api/notifications', notificationRoutes);

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
