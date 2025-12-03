import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property } from '../types';
import { favoriteService } from '../services';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: Property[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  addFavorite: (propertyId: string) => Promise<boolean>;
  removeFavorite: (propertyId: string) => Promise<boolean>;
  isFavorite: (propertyId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    } else {
      setFavorites([]);
      setFavoriteIds(new Set());
    }
  }, [isAuthenticated]);

  const refreshFavorites = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await favoriteService.getFavorites();
      if (response.success) {
        setFavorites(response.favorites);
        setFavoriteIds(new Set(response.favorites.map((p) => p._id)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (propertyId: string): Promise<boolean> => {
    try {
      const response = await favoriteService.addToFavorites(propertyId);
      if (response.success) {
        setFavoriteIds((prev) => new Set([...prev, propertyId]));
        await refreshFavorites();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  };

  const removeFavorite = async (propertyId: string): Promise<boolean> => {
    try {
      const response = await favoriteService.removeFromFavorites(propertyId);
      if (response.success) {
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        setFavorites((prev) => prev.filter((p) => p._id !== propertyId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  const isFavorite = (propertyId: string): boolean => {
    return favoriteIds.has(propertyId);
  };

  const value: FavoritesContextType = {
    favorites,
    favoriteIds,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
