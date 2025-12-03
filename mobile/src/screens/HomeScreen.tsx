import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property, PropertyFilters } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { PropertyCard, PropertyFilter, LoadingSpinner, EmptyState } from '../components';
import { COLORS } from '../config';
import { useTabBar } from '../context';

const { width, height } = Dimensions.get('window');

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { handleScroll } = useTabBar();
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
    navigation.navigate('PropertyDetails', { propertyId });
  };

  const handleSearch = () => {
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const renderFeaturedItem = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item._id)}
      horizontal
    />
  );

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item._id)}
    />
  );

  const ListHeader = () => (
    <View>
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
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('MapView', { properties })}
        >
          <Icon name="map-outline" size={24} color={COLORS.white} />
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
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
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
            : 'Recent Listings'}
        </Text>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 110,
    paddingTop: 50,
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
  mapButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
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
  seeAll: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
