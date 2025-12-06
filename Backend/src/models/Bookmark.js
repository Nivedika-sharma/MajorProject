import mongoose from 'mongoose';

const BookmarkSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true }
}, { timestamps: true });

BookmarkSchema.index({ user_id: 1, document_id: 1 }, { unique: true });

export default mongoose.model('Bookmark', BookmarkSchema);
