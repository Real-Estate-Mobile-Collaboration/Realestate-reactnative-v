import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Pressable,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Conversation, User } from '../types';
import Icon from '../components/common/Icon';
import { messageService, socketService } from '../services';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, EmptyState } from '../components';
import { COLORS } from '../config';
import { useTabBar } from '../context';

const { width, height } = Dimensions.get('window');

type MessagesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const { user } = useAuth();
  const { handleScroll } = useTabBar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await messageService.getConversations();
      console.log('Conversations response:', JSON.stringify(response, null, 2));
      if (response.success && response.conversations) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  useEffect(() => {
    // Listen for new messages to update conversations
    socketService.onReceiveMessage((message) => {
      fetchConversations();
    });

    return () => {
      socketService.offReceiveMessage();
    };
  }, [fetchConversations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    const otherUser = conversation.user;
    const oderId = otherUser.id || (otherUser as any)._id;
    console.log('Navigating to chat with user:', oderId, otherUser.name);
    navigation.navigate('Chat', {
      userId: oderId,
      userName: otherUser.name,
    });
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    const otherUser = conversation.user;
    const userId = otherUser.id || (otherUser as any)._id;

    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete your conversation with ${otherUser.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await messageService.deleteConversation(userId);
              if (response.success) {
                // Remove from local state
                setConversations((prev) =>
                  prev.filter((c) => {
                    const cUserId = c.user?.id || (c.user as any)?._id;
                    return cUserId !== userId;
                  })
                );
                Alert.alert('Success', 'Conversation deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = item.user;
    if (!otherUser) return null;
    
    const isUnread = (item.unreadCount || 0) > 0;

    return (
      <Pressable
        style={[styles.conversationItem, isUnread && styles.unreadConversation]}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleDeleteConversation(item)}
        delayLongPress={1000}
      >
        <View style={styles.avatarContainer}>
          {otherUser.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={24} color={COLORS.white} />
            </View>
          )}
          {isUnread && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, isUnread && styles.unreadText]}>
              {otherUser.name || 'Unknown User'}
            </Text>
            <Text style={styles.timestamp}>
              {item.lastMessage?.timestamp ? formatTime(item.lastMessage.timestamp) : ''}
            </Text>
          </View>
          <View style={styles.messagePreview}>
            <Text
              style={[styles.lastMessage, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage?.message || ''}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
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
      <View style={styles.container}>
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, index) => item.user?.id || (item.user as any)?._id || `conv-${index}`}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No Messages Yet"
              message="Start a conversation by contacting a property owner"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    backgroundColor: 'rgba(250, 248, 245, 0.48)',
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 110,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadConversation: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 14,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default MessagesScreen;
