import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';
import DocumentVersion from '../models/DocumentVersion.js';
import { uploadProvider, uploadToS3 } from '../utils/upload.js';
import dotenv from 'dotenv';
dotenv.config();

export const createDocument = async (req, res) => {
  try {
    const payload = req.body;
    payload.uploaded_by = req.userId;

    // file handling: if multer saved file in req.file (either local or memory for s3)
    if (req.file) {
      if (uploadProvider === 's3') {
        const key = `${Date.now()}_${req.file.originalname}`;
        const s3resp = await uploadToS3(req.file.buffer, key, req.file.mimetype);
        payload.file_url = s3resp.Location || `${process.env.S3_BASE_URL}/${key}`;
      } else {
        const base = process.env.UPLOADS_DIR || './src/uploads';
        const name = req.file.filename;
        payload.file_url = `/uploads/${name}`;
      }
    }

    const doc = new Document(payload);
    await doc.save();

    await DocumentPermission.create({ document_id: doc._id, user_id: req.userId, permission_level: 'admin', granted_by: req.userId });

    await DocumentVersion.create({ document_id: doc._id, version_number: 1, content: doc.content, changed_by: req.userId, change_summary: 'Initial version' });

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id).populate('uploaded_by', 'email full_name');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const perm = await DocumentPermission.findOne({ document_id: id, user_id: req.userId });
    if (!perm && doc.uploaded_by._id.toString() !== req.userId) return res.status(403).json({ message: 'Access denied' });

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const perms = await DocumentPermission.find({ user_id: req.userId }).distinct('document_id');
    const docs = await Document.find({ $or: [{ _id: { $in: perms } }, { uploaded_by: req.userId }] }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    const perm = await DocumentPermission.findOne({ document_id: id, user_id: req.userId });
    if (!perm && doc.uploaded_by.toString() !== req.userId) return res.status(403).json({ message: 'Not allowed' });

    // handle file replace if present
    if (req.file) {
      if (uploadProvider === 's3') {
        const key = `${Date.now()}_${req.file.originalname}`;
        const s3resp = await uploadToS3(req.file.buffer, key, req.file.mimetype);
        req.body.file_url = s3resp.Location || `${process.env.S3_BASE_URL}/${key}`;
      } else {
        req.body.file_url = `/uploads/${req.file.filename}`;
      }
    }

    const updated = await Document.findByIdAndUpdate(id, req.body, { new: true });

    if (req.body.content && req.body.content !== doc.content) {
      const latest = await DocumentVersion.find({ document_id: id }).sort({ version_number: -1 }).limit(1);
      const nextVersion = (latest[0]?.version_number || 1) + 1;
      await DocumentVersion.create({ document_id: id, version_number: nextVersion, content: req.body.content, changed_by: req.userId, change_summary: req.body.change_summary || 'Updated content' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.uploaded_by.toString() !== req.userId) return res.status(403).json({ message: 'Not allowed' });

    await Document.deleteOne({ _id: id });
    await DocumentPermission.deleteMany({ document_id: id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
