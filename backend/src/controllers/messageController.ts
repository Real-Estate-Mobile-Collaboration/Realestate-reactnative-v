import { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message';
import { getSocketService } from '../services/socketService';
import { AuthenticatedRequest } from '../middleware/auth';

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { receiverId, propertyId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Please provide receiver and message' });
    }

    // Convert string IDs to ObjectIds
    const senderObjectId = new mongoose.Types.ObjectId(req.user?.id);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
    const propertyObjectId = propertyId ? new mongoose.Types.ObjectId(propertyId) : undefined;

    const newMessage = new Message({
      senderId: senderObjectId,
      receiverId: receiverObjectId,
      propertyId: propertyObjectId,
      message,
    });

    await newMessage.save();
    await newMessage.populate('senderId', 'name avatar');
    await newMessage.populate('receiverId', 'name avatar');

      // If SocketService is available, emit the message to the receiver if they're online
      try {
        const socketService = getSocketService();
        const receiverSocketId = socketService?.getConnectedUsers()[receiverId];
        if (socketService && receiverSocketId) {
          socketService.getIO().to(receiverSocketId).emit('receive-message', {
            _id: newMessage._id,
            senderId: newMessage.senderId,
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            propertyId: newMessage.propertyId,
          });
        }
      } catch (e) {
        console.error('Socket emit error (post-save):', e);
      }

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const skip = (page - 1) * limit;

    const currentUserId = new mongoose.Types.ObjectId(req.user?.id);
    const otherUserId = new mongoose.Types.ObjectId(userId);

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    const total = await Message.countDocuments({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    });

    res.status(200).json({
      success: true,
      messages,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log('Fetching conversations for user:', userId);
    console.log('User ObjectId:', userObjectId);

    // First, let's check if there are any messages for this user (with ObjectId)
    const messageCountWithObjectId = await Message.countDocuments({
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId },
      ],
    });
    console.log('Messages with ObjectId match:', messageCountWithObjectId);

    // Also check with string comparison
    const allMessages = await Message.find({}).limit(5);
    console.log('Sample messages in DB:', allMessages.map(m => ({
      senderId: m.senderId,
      senderIdType: typeof m.senderId,
      receiverId: m.receiverId,
      receiverIdType: typeof m.receiverId,
    })));

    // Get unique conversations with the other user's info
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userObjectId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userObjectId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          user: {
            id: { $toString: '$userInfo._id' },
            _id: { $toString: '$userInfo._id' },
            name: '$userInfo.name',
            email: '$userInfo.email',
            avatar: '$userInfo.avatar',
          },
          lastMessage: {
            _id: { $toString: '$lastMessage._id' },
            message: '$lastMessage.message',
            timestamp: '$lastMessage.timestamp',
            read: '$lastMessage.read',
            senderId: { $toString: '$lastMessage.senderId' },
            receiverId: { $toString: '$lastMessage.receiverId' },
          },
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.timestamp': -1 },
      },
    ]);

    console.log('Conversations found:', conversations.length);

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching conversations' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    // Notify sender that their message was read
    try {
      const socketService = getSocketService();
      const senderSocketId = socketService?.getConnectedUsers()[message?.senderId.toString() || ''];
      if (socketService && senderSocketId) {
        socketService.getIO().to(senderSocketId).emit('message-read', {
          messageId: message?._id,
        });
      }
    } catch (e) {
      console.error('Socket emit error (mark-read):', e);
    }

    res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markConversationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.user?.id);
    const senderUserId = new mongoose.Types.ObjectId(userId);

    // Mark all messages from userId to current user as read
    await Message.updateMany(
      {
        senderId: senderUserId,
        receiverId: currentUserId,
        read: false,
      },
      { read: true }
    );

    // Notify sender
    try {
      const socketService = getSocketService();
      const senderSocketId = socketService?.getConnectedUsers()[userId];
      if (socketService && senderSocketId) {
        socketService.getIO().to(senderSocketId).emit('messages-read', {
          readByUserId: req.user?.id,
        });
      }
    } catch (e) {
      console.error('Socket emit error (mark-conversation-read):', e);
    }

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a single message
export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.user?.id);

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only allow sender or receiver to delete the message
    if (!message.senderId.equals(currentUserId) && !message.receiverId.equals(currentUserId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify the other user via socket
    try {
      const socketService = getSocketService();
      const otherUserId = message.senderId.equals(currentUserId) 
        ? message.receiverId.toString() 
        : message.senderId.toString();
      const otherSocketId = socketService?.getConnectedUsers()[otherUserId];
      if (socketService && otherSocketId) {
        socketService.getIO().to(otherSocketId).emit('message-deleted', {
          messageId,
        });
      }
    } catch (e) {
      console.error('Socket emit error (delete-message):', e);
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete entire conversation with a user
export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.user?.id);
    const otherUserId = new mongoose.Types.ObjectId(userId);

    // Delete all messages between the two users
    const result = await Message.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    });

    // Notify the other user via socket
    try {
      const socketService = getSocketService();
      const otherSocketId = socketService?.getConnectedUsers()[userId];
      if (socketService && otherSocketId) {
        socketService.getIO().to(otherSocketId).emit('conversation-deleted', {
          deletedByUserId: req.user?.id,
        });
      }
    } catch (e) {
      console.error('Socket emit error (delete-conversation):', e);
    }

    res.status(200).json({
      success: true,
      message: `Conversation deleted successfully. ${result.deletedCount} messages removed.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
