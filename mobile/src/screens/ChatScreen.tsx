import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Keyboard,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Message } from '../types';
import Icon from '../components/common/Icon';
import { messageService, socketService } from '../services';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components';
import { COLORS } from '../config';

const { width, height } = Dimensions.get('window');

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const { userId, userName, propertyId } = route.params;
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await messageService.getConversation(userId);
      if (response.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      // Mark messages as read
      messageService.markConversationAsRead(userId);
    }, [fetchMessages, userId])
  );

  useEffect(() => {
    // Listen for new messages
    socketService.onReceiveMessage((message) => {
      if (message.senderId === userId || message.senderId?._id === userId) {
        setMessages((prev) => [...prev, message]);
        messageService.markConversationAsRead(userId);
      }
    });

    // Listen for typing indicator
    socketService.onUserTyping((data) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socketService.offReceiveMessage();
      socketService.offUserTyping();
    };
  }, [userId]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    Keyboard.dismiss();

    // Optimistically add message
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: user!.id,
      receiverId: userId,
      message: messageText,
      timestamp: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Send via REST API for persistence (socket will handle real-time delivery on backend)
      const response = await messageService.sendMessage(userId, messageText, propertyId);
      
      if (response.success && response.message) {
        // Replace temp message with actual message from server
        setMessages((prev) => 
          prev.map((m) => m._id === tempMessage._id ? response.message : m)
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    socketService.sendTypingIndicator(userId, text.length > 0);
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await messageService.deleteMessage(messageId);
              if (response.success) {
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
              } else {
                Alert.alert('Error', response.message || 'Failed to delete message');
              }
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const senderId = typeof item.senderId === 'object' 
      ? (item.senderId as any)._id || (item.senderId as any).id 
      : item.senderId;
    const isOwn = senderId === user?.id;
    const showDate = index === 0 || 
      new Date(item.timestamp).toDateString() !== 
      new Date(messages[index - 1].timestamp).toDateString();

    const messageContent = (
      <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {item.message}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
            {formatTime(item.timestamp)}
          </Text>
          {isOwn && (
            <Icon
              name={item.read ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={item.read ? COLORS.primary : COLORS.gray[300]}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );

    return (
      <View>
        {showDate && (
          <Text style={styles.dateLabel}>
            {new Date(item.timestamp).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
        <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
          {isOwn ? (
            <Pressable
              onLongPress={() => handleDeleteMessage(item._id)}
              delayLongPress={1000}
            >
              {messageContent}
            </Pressable>
          ) : (
            messageContent
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading messages..." />;
  }

  return (
    <ImageBackground
      source={require('../images/messagebackground.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 90}
      >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={48} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>Start the conversation</Text>
          </View>
        }
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{userName} is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.gray[400]}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Icon
            name="send"
            size={20}
            color={inputText.trim() ? COLORS.white : COLORS.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 248, 245, 0.45)',
  },
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  dateLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  readIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.gray[100],
    borderRadius: 22,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatScreen;