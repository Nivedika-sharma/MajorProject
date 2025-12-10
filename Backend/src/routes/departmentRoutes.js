import express from 'express';
import { listDepartments, createDepartment } from '../controllers/departmentController.js';
import  auth  from '../middleware/auth.js';
const router = express.Router();

router.get('/', auth, listDepartments);
router.post('/', auth, createDepartment);

export default router;
