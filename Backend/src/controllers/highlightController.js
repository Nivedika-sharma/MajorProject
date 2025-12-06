import Highlight from '../models/Highlight.js';
import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';

export const createHighlight = async (req, res) => {
  try {
    const { document_id, text, position, color } = req.body;
    const doc = await Document.findById(document_id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    const has = await DocumentPermission.findOne({ document_id, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!has) return res.status(403).json({ message: 'No access' });

    const h = await Highlight.create({ document_id, user_id: req.userId, text, position, color });
    res.json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listHighlights = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    const has = await DocumentPermission.findOne({ document_id: documentId, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!has) return res.status(403).json({ message: 'No access' });

    const items = await Highlight.find({ document_id: documentId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
