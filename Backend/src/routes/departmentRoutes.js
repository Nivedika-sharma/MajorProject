import express from 'express';
import { listDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();

router.get('/', authenticate, listDepartments);
router.post('/', authenticate, createDepartment);

export default router;
