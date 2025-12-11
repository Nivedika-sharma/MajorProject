// src/routes/mailRoutes.js
import express from "express";
import  auth  from '../middleware/auth.js'; // ✅ Add this import
import {
  authViaGoogle,
  googleCallback,
  fetchMailAttachments,
  listMailFiles,
  downloadMailFile,
} from "../controllers/mailController.js";

const router = express.Router();

// Public routes (no authentication needed)
router.get("/google", authViaGoogle);
router.get("/google/callback", googleCallback);

// Protected routes (authentication required)
router.post("/fetch", auth, fetchMailAttachments); // ✅ Add middleware
router.get("/files", auth, listMailFiles); // ✅ Add middleware
router.get("/files/:filename/download", auth, downloadMailFile); // ✅ Add middleware

export default router;