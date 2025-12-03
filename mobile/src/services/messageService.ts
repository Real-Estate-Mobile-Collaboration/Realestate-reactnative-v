import api from './api';
import { Message, Conversation, MessagesResponse, ConversationsResponse } from '../types';

export const messageService = {
  // Send a message
  sendMessage: async (
    receiverId: string,
    message: string,
    propertyId?: string
  ): Promise<{ success: boolean; message: Message }> => {
    const response = await api.post('/messages', {
      receiverId,
      message,
      propertyId,
    });
    return response.data;
  },

  // Get conversation with a specific user
  getConversation: async (userId: string): Promise<MessagesResponse> => {
    const response = await api.get<MessagesResponse>(`/messages/${userId}`);
    return response.data;
  },

  // Get all conversations
  getConversations: async (): Promise<ConversationsResponse> => {
    const response = await api.get<ConversationsResponse>('/messages/conversations');
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },

  // Mark all messages in conversation as read
  markConversationAsRead: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/messages/conversation/${userId}/read`);
    return response.data;
  },

  // Delete a single message
  deleteMessage: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/messages/message/${messageId}`);
    return response.data;
  },

  // Delete entire conversation with a user
  deleteConversation: async (userId: string): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await api.delete(`/messages/conversation/${userId}`);
    return response.data;
  },
};

export default messageService;
