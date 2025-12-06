import Comment from '../models/Comment.js';
import DocumentPermission from '../models/DocumentPermission.js';
import Document from '../models/Document.js';

export const addComment = async (req, res) => {
  try {
    const { document_id, content } = req.body;
    const doc = await Document.findById(document_id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    const hasAccess = await DocumentPermission.findOne({ document_id, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!hasAccess) return res.status(403).json({ message: 'No access' });

    const comment = await Comment.create({ document_id, user_id: req.userId, content });
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listComments = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    const hasAccess = await DocumentPermission.findOne({ document_id: documentId, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!hasAccess) return res.status(403).json({ message: 'No access' });

    const comments = await Comment.find({ document_id: documentId }).populate('user_id', 'email full_name').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
