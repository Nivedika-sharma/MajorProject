import express from "express";
import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";

const router = express.Router();

// 🔐 Middleware to decode JWT
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Fetch my notifications
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Mark all as read
router.put("/mark-read", authMiddleware, async (req, res) => {
  await Notification.updateMany({ user: req.userId }, { isRead: true });
  res.json({ success: true });
});

export default router;
