import mongoose from 'mongoose';

const DocumentPermissionSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permission_level: { type: String, enum: ['view','edit','admin'], default: 'view' },
  granted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

DocumentPermissionSchema.index({ document_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('DocumentPermission', DocumentPermissionSchema);
