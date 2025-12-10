import Notification from '../models/Notification.js';
import User from "../models/User.js";
import { io } from "../server.js";
export const listNotifications = async (req, res) => {
  try {
    const items = await Notification.find({ user_id: req.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, related_id } = req.body;
    const n = await Notification.create({ user_id, title, message, type, related_id });
    res.json(n);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const notifyAllUsers = async (uploaderId, documentId, fileName) => {
  const users = await User.find({ _id: { $ne: uploaderId } });

  for (const user of users) {
    const note = await Notification.create({
      user_id: user._id,
      message: `New document uploaded: ${fileName}`,
      document_id: documentId,
      is_read: false
    });

    io.emit("new-notification", note);
  }
};