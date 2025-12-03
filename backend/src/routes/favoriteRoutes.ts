import express, { Router } from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  isFavorite,
} from '../controllers/favoriteController';
import { protect } from '../middleware/auth';

const router: Router = express.Router();

router.post('/:propertyId', protect, addToFavorites);

router.delete('/:propertyId', protect, removeFromFavorites);

router.get('/', protect, getFavorites);

router.get('/:propertyId', protect, isFavorite);

export default router;
