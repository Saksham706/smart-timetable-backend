import express from 'express';
import { register, login, getMe, getTeachers} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
const router = express.Router();


router.get('/teachers', protect, getTeachers);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
