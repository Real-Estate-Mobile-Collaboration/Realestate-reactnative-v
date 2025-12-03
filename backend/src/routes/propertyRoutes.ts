import express, { Router } from 'express';
import { body } from 'express-validator';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getUserProperties,
} from '../controllers/propertyController';
import { protect } from '../middleware/auth';
import { upload } from '../utils/multer';

const router: Router = express.Router();

router.post(
  '/',
  protect,
  upload.array('images', 10),
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('type').isIn(['sale', 'rent']).withMessage('Type must be sale or rent'),
    body('category').isIn(['apartment', 'house', 'land', 'studio']).withMessage('Invalid category'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('latitude').isFloat().withMessage('Invalid latitude'),
    body('longitude').isFloat().withMessage('Invalid longitude'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
  ],
  createProperty
);

router.get('/', getProperties);

router.get('/:id', getPropertyById);

router.put(
  '/:id',
  protect,
  upload.array('images', 10),
  [
    body('title').optional().trim().isLength({ min: 5 }),
    body('price').optional().isFloat({ min: 0 }),
    body('type').optional().isIn(['sale', 'rent']),
    body('category').optional().isIn(['apartment', 'house', 'land', 'studio']),
    body('description').optional().trim().isLength({ min: 10 }),
  ],
  updateProperty
);

router.delete('/:id', protect, deleteProperty);

router.get('/user/my-properties', protect, getUserProperties);

export default router;
