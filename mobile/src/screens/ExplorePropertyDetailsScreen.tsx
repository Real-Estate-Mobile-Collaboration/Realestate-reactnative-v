import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property, User } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { LoadingSpinner, Button } from '../components';
import { COLORS } from '../config';

const { width } = Dimensions.get('window');

type ExplorePropertyDetailsRouteProp = RouteProp<RootStackParamList, 'ExplorePropertyDetails'>;
type ExplorePropertyDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExplorePropertyDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ExplorePropertyDetailsNavigationProp>();
  const route = useRoute<ExplorePropertyDetailsRouteProp>();
  const { propertyId } = route.params;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await propertyService.getPropertyById(propertyId);
      if (response.success) {
        setProperty(response.property);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  const showLoginPrompt = (action: string) => {
    Alert.alert(
      'Login Required',
      `Please login or create an account to ${action}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
        { text: 'Join Us', onPress: () => navigation.navigate('Auth', { screen: 'Register' }) },
      ]
    );
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return '$0';
    }
    const numPrice = Number(price);
    return `$${numPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getOwnerInfo = (): { name: string; avatar?: string } => {
    if (property && typeof property.ownerId === 'object') {
      return {
        name: (property.ownerId as User).name,
        avatar: (property.ownerId as User).avatar || undefined,
      };
    }
    return { name: 'Owner' };
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading property..." />;
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color={COLORS.gray[300]} />
        <Text style={styles.errorText}>Property not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const owner = getOwnerInfo();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {property.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.propertyImage}
              />
            ))}
          </ScrollView>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Favorite Button - Requires Login */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => showLoginPrompt('save favorites')}
          >
            <Icon name="heart-outline" size={24} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {property.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Property Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {property.type === 'sale' ? 'For Sale' : 'For Rent'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Category */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(property.price)}
              {property.type === 'rent' && <Text style={styles.perMonth}>/month</Text>}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{property.category}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{property.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>
              {property.location.address}, {property.location.city}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Owner Info */}
          <View style={styles.ownerSection}>
            <Text style={styles.sectionTitle}>Listed By</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerInfo}>
                {owner.avatar ? (
                  <Image source={{ uri: owner.avatar }} style={styles.ownerAvatar} />
                ) : (
                  <View style={styles.ownerAvatarPlaceholder}>
                    <Icon name="person" size={24} color={COLORS.white} />
                  </View>
                )}
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>{owner.name}</Text>
                  <Text style={styles.ownerLabel}>Property Owner</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Login Prompt */}
          <View style={styles.loginPromptSection}>
            <Icon name="lock-closed-outline" size={32} color={COLORS.primary} />
            <Text style={styles.loginPromptTitle}>Want to contact the owner?</Text>
            <Text style={styles.loginPromptText}>
              Login or create an account to message the owner and save this property to your favorites.
            </Text>
            <View style={styles.loginPromptButtons}>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
              >
                <Text style={styles.joinButtonText}>Join Us</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Posted Date */}
          <Text style={styles.postedDate}>
            Posted on {new Date(property.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginVertical: 16,
  },
  imageContainer: {
    height: 320,
    position: 'relative',
  },
  propertyImage: {
    width: width,
    height: 320,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  typeBadge: {
    position: 'absolute',
    top: 50,
    left: 76,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  perMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryBadge: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  ownerSection: {
    marginBottom: 24,
  },
  ownerCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  ownerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  ownerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loginPromptSection: {
    backgroundColor: 'rgba(139, 69, 19, 0.08)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.15)',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  loginPromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  loginButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  postedDate: {
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
  },
});

export default ExplorePropertyDetailsScreen;
