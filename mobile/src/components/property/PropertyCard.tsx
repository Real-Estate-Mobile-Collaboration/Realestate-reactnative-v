import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Property, User } from '../../types';
import Icon from '../common/Icon';
import { COLORS } from '../../config';
import { useFavorites } from '../../context/FavoritesContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  horizontal?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  horizontal = false,
}) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const isPropertyFavorite = isFavorite(property._id);

  const handleFavoritePress = async () => {
    if (isPropertyFavorite) {
      await removeFavorite(property._id);
    } else {
      await addFavorite(property._id);
    }
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
      return `$${(numPrice / 1000).toFixed(0)}K`;
    }
    return `$${Math.round(numPrice)}`;
  };

  const getOwnerInfo = (): { name: string; avatar?: string } => {
    if (typeof property.ownerId === 'object') {
      return {
        name: (property.ownerId as User).name,
        avatar: (property.ownerId as User).avatar || undefined,
      };
    }
    return { name: 'Owner' };
  };

  const owner = getOwnerInfo();

  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: property.images[0] || 'https://via.placeholder.com/150' }}
          style={styles.horizontalImage}
        />
        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeader}>
            <View style={styles.typeContainer}>
              <Text style={styles.typeText}>
                {property.type === 'sale' ? 'For Sale' : 'For Rent'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleFavoritePress}>
              <Icon
                name={isPropertyFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isPropertyFavorite ? COLORS.danger : COLORS.gray[400]}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.horizontalTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {property.location.city}
            </Text>
          </View>
          <Text style={styles.horizontalPrice}>
            {formatPrice(property.price)}
            {property.type === 'rent' && <Text style={styles.perMonth}>/mo</Text>}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] || 'https://via.placeholder.com/300' }}
          style={styles.image}
        />
        <View style={styles.overlay}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>
              {property.type === 'sale' ? 'For Sale' : 'For Rent'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
          >
            <Icon
              name={isPropertyFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isPropertyFavorite ? COLORS.danger : COLORS.white}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{property.category}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.price}>
          {formatPrice(property.price)}
          {property.type === 'rent' && <Text style={styles.perMonth}>/mo</Text>}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.location.address}, {property.location.city}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.ownerInfo}>
            {owner.avatar ? (
              <Image source={{ uri: owner.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={14} color={COLORS.white} />
              </View>
            )}
            <Text style={styles.ownerName}>{owner.name}</Text>
          </View>
          <Text style={styles.date}>
            {new Date(property.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
    width: CARD_WIDTH - 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  imageContainer: {
    position: 'relative',
    height: 210,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeContainer: {
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  favoriteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 11,
    borderRadius: 26,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 18,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  perMonth: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 25,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Horizontal card styles
  horizontalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    width: 210,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  horizontalImage: {
    width: '100%',
    height: 130,
  },
  horizontalContent: {
    padding: 14,
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  horizontalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 6,
  },
});

export default PropertyCard;
