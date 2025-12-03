import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Pressable,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList, Property } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { Button, Input, LoadingSpinner, PropertyCard, EmptyState } from '../components';
import { COLORS } from '../config';
import { useTabBar } from '../context';

const { width, height } = Dimensions.get('window');

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, updateProfile, logout } = useAuth();
  const { favorites, refreshFavorites } = useFavorites();
  const { handleScroll } = useTabBar();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'favorites'>('listings');
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const fetchUserProperties = useCallback(async () => {
    try {
      const response = await propertyService.getUserProperties();
      if (response.success) {
        setUserProperties(response.properties);
      }
    } catch (error) {
      console.error('Error fetching user properties:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProperties();
      refreshFavorites();
    }, [fetchUserProperties, refreshFavorites])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserProperties(), refreshFavorites()]);
    setIsRefreshing(false);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEditForm((prev) => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(editForm);
      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  const handleDeleteProperty = (propertyId: string, propertyTitle: string) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await propertyService.deleteProperty(propertyId);
              if (response.success) {
                setUserProperties((prev) => prev.filter((p) => p._id !== propertyId));
                Alert.alert('Success', 'Property deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete property');
              }
            } catch (error) {
              console.error('Error deleting property:', error);
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const displayedProperties = activeTab === 'listings' ? userProperties : favorites;

  return (
    <ImageBackground
      source={require('../images/background3.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={isEditing ? handlePickAvatar : undefined}
          disabled={!isEditing || isUploadingAvatar}
        >
          {isUploadingAvatar ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          ) : (isEditing ? editForm.avatar : user?.avatar) ? (
            <Image
              source={{ uri: isEditing ? editForm.avatar : user?.avatar! }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color={COLORS.white} />
            </View>
          )}
          {isEditing && !isUploadingAvatar && (
            <View style={styles.editAvatarBadge}>
              <Icon name="camera" size={16} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editForm}>
            <Input
              label="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    avatar: user?.avatar || '',
                  });
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                loading={isLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Icon name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userProperties.length}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
            My Listings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <View style={styles.propertiesContainer}>
        {displayedProperties.length === 0 ? (
          <EmptyState
            icon={activeTab === 'listings' ? 'home-outline' : 'heart-outline'}
            title={activeTab === 'listings' ? 'No Listings Yet' : 'No Favorites Yet'}
            message={
              activeTab === 'listings'
                ? 'Start by creating your first property listing'
                : 'Save properties you like to see them here'
            }
            actionLabel={activeTab === 'listings' ? 'Create Listing' : undefined}
            onAction={activeTab === 'listings' ? () => navigation.navigate('CreateProperty') : undefined}
          />
        ) : (
          displayedProperties.map((property) => (
            <Pressable
              key={property._id}
              onPress={() => handlePropertyPress(property._id)}
              onLongPress={() => {
                if (activeTab === 'listings') {
                  handleDeleteProperty(property._id, property.title);
                }
              }}
              delayLongPress={1000}
            >
              <PropertyCard
                property={property}
                onPress={() => handlePropertyPress(property._id)}
              />
            </Pressable>
          ))
        )}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          icon={<Icon name="log-out-outline" size={20} color={COLORS.white} />}
        />
      </View>
    </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  container: {
    flex: 1,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'center',
    padding: 28,
    paddingTop: 60,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userPhone: {
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  editForm: {
    width: '100%',
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginTop: 16,
    paddingVertical: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  statDivider: {
    width: 1.5,
    backgroundColor: COLORS.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: COLORS.gray[200],
    borderRadius: 14,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  propertiesContainer: {
    padding: 16,
    minHeight: 200,
  },
  logoutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default ProfileScreen;
