import DocumentVersion from '../models/DocumentVersion.js';
import Document from '../models/Document.js';
import DocumentPermission from '../models/DocumentPermission.js';

export const listVersions = async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });
    const has = await DocumentPermission.findOne({ document_id: documentId, user_id: req.userId }) || doc.uploaded_by.toString() === req.userId;
    if (!has) return res.status(403).json({ message: 'No access' });

    const versions = await DocumentVersion.find({ document_id: documentId }).sort({ version_number: -1 });
    res.json(versions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
