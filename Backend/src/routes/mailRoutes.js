import express from 'express';
import { authViaGoogle, googleCallback, fetchMailAttachments, listMailFiles, downloadMailFile } from '../controllers/mailController.js';

const router = express.Router();

router.get('/google', authViaGoogle);  
router.get('/google/callback', googleCallback);
router.post('/fetch', fetchMailAttachments);
router.get('/files', listMailFiles);
router.get('/files/:id/download', downloadMailFile);

export default router;
