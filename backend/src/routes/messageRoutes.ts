import express, { Router } from 'express';
import { body } from 'express-validator';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  markConversationAsRead,
  deleteMessage,
  deleteConversation,
} from '../controllers/messageController';
import { protect } from '../middleware/auth';

const router: Router = express.Router();

router.post(
  '/',
  protect,
  [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  sendMessage
);

router.get('/conversations', protect, getConversations);

router.get('/:userId', protect, getConversation);

router.put('/:messageId/read', protect, markAsRead);

router.put('/conversation/:userId/read', protect, markConversationAsRead);

// Delete a single message
router.delete('/message/:messageId', protect, deleteMessage);

// Delete entire conversation with a user
router.delete('/conversation/:userId', protect, deleteConversation);

export default router;
