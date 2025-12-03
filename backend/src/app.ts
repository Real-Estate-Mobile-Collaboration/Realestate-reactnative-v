import express, { Express } from 'express';
import cors from 'cors';
import { setupCloudinary } from './config/cloudinary';
import authRoutes from './routes/authRoutes';
import propertyRoutes from './routes/propertyRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import messageRoutes from './routes/messageRoutes';

export const createApp = (): Express => {
  const app = express();

  // Setup Cloudinary
  setupCloudinary();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/messages', messageRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  return app;
};
