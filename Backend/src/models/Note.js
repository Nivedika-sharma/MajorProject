import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  position: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.model('Note', NoteSchema);
