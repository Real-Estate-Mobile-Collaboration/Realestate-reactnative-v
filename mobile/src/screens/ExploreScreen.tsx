import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property, PropertyFilters } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { PropertyCard, PropertyFilter, LoadingSpinner, EmptyState } from '../components';
import { COLORS } from '../config';

const { width, height } = Dimensions.get('window');

type ExploreNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<ExploreNavigationProp>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProperties = useCallback(async () => {
    try {
      const response = await propertyService.getProperties({
        ...filters,
        search: searchQuery || undefined,
        limit: 20,
      });
      if (response.success) {
        setProperties(response.properties);
        if (!searchQuery && !filters.type && !filters.category) {
          setFeaturedProperties(response.properties.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProperties();
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('ExplorePropertyDetails', { propertyId });
  };

  const handleSearch = () => {
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const showLoginPrompt = () => {
    Alert.alert(
      'Login Required',
      'Please login or create an account to access this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
        { text: 'Join Us', onPress: () => navigation.navigate('Auth', { screen: 'Register' }) },
      ]
    );
  };

  const renderFeaturedItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handlePropertyPress(item._id)}
    >
      <PropertyCard
        property={item}
        onPress={() => handlePropertyPress(item._id)}
        horizontal
      />
    </TouchableOpacity>
  );

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item._id)}
    />
  );

  const ListHeader = () => (
    <View>
      {/* Back Button and Title */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Properties</Text>
        <TouchableOpacity
          style={styles.loginPromptButton}
          onPress={showLoginPrompt}
        >
          <Icon name="log-in-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name={showFilters ? 'options' : 'options-outline'}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <PropertyFilter
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Featured Section */}
      {featuredProperties.length > 0 && !searchQuery && !showFilters && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
          </View>
          <FlatList
            data={featuredProperties}
            renderItem={renderFeaturedItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery || Object.keys(filters).length > 0
            ? `Results (${properties.length})`
            : 'All Listings'}
        </Text>
      </View>

      {/* Guest Banner */}
      <TouchableOpacity style={styles.guestBanner} onPress={showLoginPrompt}>
        <Icon name="information-circle-outline" size={20} color={COLORS.white} />
        <Text style={styles.guestBannerText}>
          Login to save favorites & contact owners
        </Text>
        <Icon name="chevron-forward" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading properties..." />;
  }

  return (
    <ImageBackground
      source={require('../images/background2.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <FlatList
          data={properties}
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="No Properties Found"
              message="Try adjusting your filters or search query"
              actionLabel="Clear Filters"
              onAction={clearFilters}
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
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loginPromptButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  featuredSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginHorizontal: 12,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
});

export default ExploreScreen;
