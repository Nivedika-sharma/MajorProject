import mongoose from 'mongoose';

const DocumentVersionSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  version_number: { type: Number, required: true },
  content: { type: String, default: '' },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  change_summary: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('DocumentVersion', DocumentVersionSchema);
