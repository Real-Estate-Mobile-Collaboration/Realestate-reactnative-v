import api from './api';
import { Property } from '../types';

export const favoriteService = {
  // Add property to favorites
  addToFavorites: async (propertyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/favorites/${propertyId}`);
    return response.data;
  },

  // Remove property from favorites
  removeFromFavorites: async (propertyId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/favorites/${propertyId}`);
    return response.data;
  },

  // Get all favorites
  getFavorites: async (): Promise<{ success: boolean; favorites: Property[] }> => {
    const response = await api.get('/favorites');
    return response.data;
  },

  // Check if property is in favorites
  isFavorite: async (propertyId: string): Promise<{ success: boolean; isFavorite: boolean }> => {
    const response = await api.get(`/favorites/${propertyId}`);
    return response.data;
  },
};

export default favoriteService;
