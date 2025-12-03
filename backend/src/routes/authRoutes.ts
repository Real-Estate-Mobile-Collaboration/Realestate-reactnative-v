import express, { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { upload } from '../utils/multer';

const router: Router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Please provide a password'),
  ],
  login
);

router.get('/me', protect, getMe);

router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/),
  ],
  updateProfile
);

export default router;
