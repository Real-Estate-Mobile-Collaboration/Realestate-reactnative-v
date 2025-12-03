import { Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export const addToFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $addToSet: { favorites: propertyId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Added to favorites',
      favorites: user.favorites,
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const removeFromFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $pull: { favorites: propertyId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Removed from favorites',
      favorites: user.favorites,
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).populate('favorites');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      favorites: user.favorites,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const isFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFav = user.favorites.includes(new Types.ObjectId(propertyId));

    res.status(200).json({
      success: true,
      isFavorite: isFav,
    });
  } catch (error) {
    console.error('Is favorite error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
