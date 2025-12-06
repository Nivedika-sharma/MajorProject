import Notification from '../models/Notification.js';

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
