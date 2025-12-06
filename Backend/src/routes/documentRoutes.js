import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument
} from '../controllers/documentController.js';
import { upload, uploadProvider } from '../utils/upload.js';

const router = express.Router();

const uploadField = upload.single('file');

router.post('/', authenticate, uploadField, createDocument);
router.get('/', authenticate, listDocuments);
router.get('/:id', authenticate, getDocument);
router.put('/:id', authenticate, uploadField, updateDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;
