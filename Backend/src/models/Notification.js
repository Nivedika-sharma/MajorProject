import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, default: 'general' },
  related_id: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
