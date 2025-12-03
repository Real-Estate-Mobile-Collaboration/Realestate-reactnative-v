import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Message from '../models/Message';

interface ConnectedUsers {
  [userId: string]: string; // userId -> socketId
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: ConnectedUsers = {};

  // expose the instance for other modules to use
  static instance: SocketService | null = null;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST'],
      },
    });

    // store instance so controllers can access it
    SocketService.instance = this;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`);

      // User joins with their ID
      socket.on('user-online', (userId: string) => {
        this.connectedUsers[userId] = socket.id;
        console.log(`User ${userId} is online`);
        this.io.emit('user-status', {
          userId,
          status: 'online',
        });
      });

      // Handle new message
      socket.on('send-message', async (data) => {
        try {
          const { senderId, receiverId, message, propertyId } = data;

          // Save to database
          const newMessage = new Message({
            senderId,
            receiverId,
            propertyId,
            message,
          });
          await newMessage.save();
          await newMessage.populate('senderId', 'name avatar email');

          // Emit to receiver if online
          const receiverSocketId = this.connectedUsers[receiverId];
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('receive-message', {
              _id: newMessage._id,
              senderId: newMessage.senderId,
              message: newMessage.message,
              timestamp: newMessage.timestamp,
              propertyId: newMessage.propertyId,
            });
          }

          // Acknowledge sender
          socket.emit('message-sent', {
            _id: newMessage._id,
            status: 'success',
          });
        } catch (error) {
          console.error('Error saving message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicator
      socket.on('user-typing', (data) => {
        const { receiverId, isTyping } = data;
        const receiverSocketId = this.connectedUsers[receiverId];
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user-typing', { isTyping });
        }
      });

      // Handle user disconnect
      socket.on('disconnect', () => {
        // Find and remove user from online list
        for (const userId in this.connectedUsers) {
          if (this.connectedUsers[userId] === socket.id) {
            delete this.connectedUsers[userId];
            console.log(`User ${userId} is offline`);
            this.io.emit('user-status', {
              userId,
              status: 'offline',
            });
            break;
          }
        }
      });

      // Handle user going offline
      socket.on('user-offline', (userId: string) => {
        delete this.connectedUsers[userId];
        console.log(`User ${userId} went offline`);
        this.io.emit('user-status', {
          userId,
          status: 'offline',
        });
      });

      // Join a chat room
      socket.on('join-chat', (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });

      // Leave a chat room
      socket.on('leave-chat', (roomId: string) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public getConnectedUsers(): ConnectedUsers {
    return this.connectedUsers;
  }
}

export default SocketService;

// helper to get the running SocketService instance
export const getSocketService = (): SocketService | null => SocketService.instance;
