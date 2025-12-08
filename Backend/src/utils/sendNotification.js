import Notification from "../models/Notification.js";

export const sendNotification = async (userId, message, type = "info") => {
  try {
    await Notification.create({
      user: userId,
      message,
      type,
    });

  } catch (err) {
    console.error("Notification Error:", err);
  }
};
