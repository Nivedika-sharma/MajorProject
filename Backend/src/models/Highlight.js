import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  position: { type: Object, default: {} },
  color: { type: String, default: '#FCD34D' }
}, { timestamps: true });

export default mongoose.model('Highlight', HighlightSchema);
