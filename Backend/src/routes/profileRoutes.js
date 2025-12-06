import express from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);

export default router;
