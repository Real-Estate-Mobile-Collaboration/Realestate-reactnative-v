import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  // Connect to socket server
  connect(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('user-online', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('user-offline', this.userId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  // Send a message
  sendMessage(
    receiverId: string,
    message: string,
    propertyId?: string
  ): void {
    if (this.socket && this.userId) {
      this.socket.emit('send-message', {
        senderId: this.userId,
        receiverId,
        message,
        propertyId,
      });
    }
  }

  // Listen for incoming messages
  onReceiveMessage(callback: (message: any) => void): void {
    this.socket?.on('receive-message', callback);
  }

  // Remove message listener
  offReceiveMessage(): void {
    this.socket?.off('receive-message');
  }

  // Listen for message sent confirmation
  onMessageSent(callback: (data: { _id: string; status: string }) => void): void {
    this.socket?.on('message-sent', callback);
  }

  // Remove message sent listener
  offMessageSent(): void {
    this.socket?.off('message-sent');
  }

  // Listen for message errors
  onMessageError(callback: (error: { error: string }) => void): void {
    this.socket?.on('message-error', callback);
  }

  // Remove message error listener
  offMessageError(): void {
    this.socket?.off('message-error');
  }

  // Send typing indicator
  sendTypingIndicator(receiverId: string, isTyping: boolean): void {
    this.socket?.emit('user-typing', { receiverId, isTyping });
  }

  // Listen for typing indicator
  onUserTyping(callback: (data: { isTyping: boolean }) => void): void {
    this.socket?.on('user-typing', callback);
  }

  // Remove typing listener
  offUserTyping(): void {
    this.socket?.off('user-typing');
  }

  // Listen for user status changes
  onUserStatus(callback: (data: { userId: string; status: 'online' | 'offline' }) => void): void {
    this.socket?.on('user-status', callback);
  }

  // Remove user status listener
  offUserStatus(): void {
    this.socket?.off('user-status');
  }

  // Join a chat room
  joinChat(roomId: string): void {
    this.socket?.emit('join-chat', roomId);
  }

  // Leave a chat room
  leaveChat(roomId: string): void {
    this.socket?.emit('leave-chat', roomId);
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
