import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property, User } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { ImageGallery, LoadingSpinner, Button, PropertyMiniMap } from '../components';
import { COLORS } from '../config';

type PropertyDetailsRouteProp = RouteProp<RootStackParamList, 'PropertyDetails'>;
type PropertyDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PropertyDetailsScreen: React.FC = () => {
  const route = useRoute<PropertyDetailsRouteProp>();
  const navigation = useNavigation<PropertyDetailsNavigationProp>();
  const { propertyId } = route.params;
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState<User | null>(null);

  const isPropertyFavorite = property ? isFavorite(property._id) : false;
  
  // Check if current user is the owner
  const getOwnerId = (): string | null => {
    if (!property) return null;
    if (typeof property.ownerId === 'object') {
      return (property.ownerId as any)._id || (property.ownerId as any).id || null;
    }
    return property.ownerId as string;
  };
  
  const ownerId = getOwnerId();
  const isOwner = !!(user && ownerId && (ownerId === user.id || ownerId === (user as any)._id));
  
  // Debug log
  console.log('Owner check:', { ownerId, userId: user?.id, isOwner });

  useEffect(() => {
    fetchPropertyDetails();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await propertyService.getPropertyById(propertyId);
      if (response.success) {
        setProperty(response.property);
        if (typeof response.property.ownerId === 'object') {
          setOwner(response.property.ownerId as User);
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoritePress = async () => {
    if (!property) return;
    if (isPropertyFavorite) {
      await removeFavorite(property._id);
    } else {
      await addFavorite(property._id);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      const priceStr = property.price ? formatPrice(property.price) : 'Contact for price';
      await Share.share({
        message: `Check out this property: ${property.title}\nPrice: ${priceStr}\nLocation: ${property.location.address}, ${property.location.city}`,
        title: property.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCall = () => {
    if (!owner?.phone) return;
    Linking.openURL(`tel:${owner.phone}`);
  };

  const handleMessage = () => {
    if (!owner) return;
    navigation.navigate('Chat', {
      userId: owner.id || (owner as any)._id,
      userName: owner.name,
      propertyId: property?._id,
    });
  };

  const handleMapView = () => {
    if (!property) return;
    navigation.navigate('MapView', {
      properties: [property],
      initialRegion: {
        latitude: property.location.coordinates[1],
        longitude: property.location.coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
    });
  };

  const handleEdit = () => {
    if (!property) return;
    navigation.navigate('EditProperty', { propertyId: property._id });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await propertyService.deleteProperty(propertyId);
              Alert.alert('Success', 'Property deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return '$0';
    }
    const numPrice = Number(price);
    if (numPrice >= 1000000) {
      return `$${(numPrice / 1000000).toFixed(1)}M`;
    }
    if (numPrice >= 1000) {
      return `$${Math.round(numPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
    return `$${Math.round(numPrice)}`;
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageGallery images={property.images} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.typeContainer}>
              <Text style={styles.typeText}>
                {property.type === 'sale' ? 'For Sale' : 'For Rent'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleFavoritePress}
              >
                <Icon
                  name={isPropertyFavorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isPropertyFavorite ? COLORS.danger : COLORS.gray[600]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Icon name="share-outline" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity style={[styles.iconButton, styles.deleteIconButton]} onPress={handleDelete}>
                  <Icon name="trash-outline" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Price */}
          <Text style={styles.price}>
            {formatPrice(property.price)}
            {property.type === 'rent' && <Text style={styles.perMonth}>/month</Text>}
          </Text>

          {/* Title */}
          <Text style={styles.title}>{property.title}</Text>

          {/* Category */}
          <View style={styles.categoryContainer}>
            <Icon name="pricetag-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.categoryText}>{property.category}</Text>
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locationContainer} onPress={handleMapView}>
            <Icon name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {property.location.address}, {property.location.city}
            </Text>
            <Icon name="chevron-forward" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Map Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location on Map</Text>
            <PropertyMiniMap
              latitude={property.location.coordinates[1]}
              longitude={property.location.coordinates[0]}
              title={property.title}
              onPress={handleMapView}
              height={180}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Owner */}
          {owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listed By</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Icon name="person" size={24} color={COLORS.white} />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{owner.name}</Text>
                  <Text style={styles.ownerContact}>{owner.email}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <Button
                title="Edit"
                onPress={handleEdit}
                variant="outline"
                icon={<Icon name="create-outline" size={20} color={COLORS.primary} />}
                style={{ flex: 1 }}
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="danger"
                icon={<Icon name="trash-outline" size={20} color={COLORS.white} />}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Contact Footer */}
      {!isOwner && owner && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Icon name="call" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Button
            title="Send Message"
            onPress={handleMessage}
            style={styles.messageButton}
            icon={<Icon name="chatbubble" size={20} color={COLORS.white} />}
          />
        </View>
      )}
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
    marginTop: 16,
    marginBottom: 24,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  deleteIconButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  perMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: {
    marginLeft: 14,
    flex: 1,
  },
  ownerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  ownerContact: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  footer: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    gap: 14,
  },
  callButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  messageButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  messageButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
});

export default PropertyDetailsScreen;
