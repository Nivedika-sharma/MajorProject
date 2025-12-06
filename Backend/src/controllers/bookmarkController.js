import Bookmark from '../models/Bookmark.js';
import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';

export const toggleBookmark = async (req, res) => {
  try {
    const { document_id } = req.body;
    const doc = await Document.findById(document_id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    const hasAccess = await DocumentPermission.findOne({ document_id, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!hasAccess) return res.status(403).json({ message: 'No access' });

    const existing = await Bookmark.findOne({ document_id, user_id: req.userId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ message: 'Removed' });
    } else {
      const b = await Bookmark.create({ document_id, user_id: req.userId });
      return res.json(b);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listBookmarks = async (req, res) => {
  try {
    const items = await Bookmark.find({ user_id: req.userId }).populate('document_id').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
