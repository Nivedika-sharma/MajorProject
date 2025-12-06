import Note from '../models/Note.js';
import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';

export const createNote = async (req, res) => {
  try {
    const { document_id, content, position } = req.body;
    const doc = await Document.findById(document_id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    const has = await DocumentPermission.findOne({ document_id, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!has) return res.status(403).json({ message: 'No access' });

    const n = await Note.create({ document_id, user_id: req.userId, content, position });
    res.json(n);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listNotes = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    const has = await DocumentPermission.findOne({ document_id: documentId, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!has) return res.status(403).json({ message: 'No access' });

    const items = await Note.find({ document_id: documentId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
