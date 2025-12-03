import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Property, PropertyFilters } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { PropertyCard, PropertyFilter, LoadingSpinner, EmptyState } from '../components';
import { COLORS, PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../config';
import { useTabBar } from '../context';

const { width, height } = Dimensions.get('window');

type SearchNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNavigationProp>();
  const { handleScroll } = useTabBar();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchProperties = useCallback(async (page = 1, refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await propertyService.getProperties({
        ...filters,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });

      if (response.success) {
        if (page === 1) {
          setProperties(response.properties);
        } else {
          setProperties((prev) => [...prev, ...response.properties]);
        }
        setPagination({
          page: response.pagination.page,
          pages: response.pagination.pages,
          total: response.pagination.total,
        });
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, searchQuery]);

  const handleSearch = () => {
    setProperties([]);
    fetchProperties(1);
  };

  const handleRefresh = () => {
    fetchProperties(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchProperties(pagination.page + 1);
    }
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setProperties([]);
    setHasSearched(false);
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <PropertyCard
      property={item}
      onPress={() => handlePropertyPress(item._id)}
    />
  );

  const renderFooter = () => {
    if (!isLoading || properties.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../images/searchbackground.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, description..."
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
          style={[styles.searchButton, (!searchQuery && !Object.keys(filters).length) && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!searchQuery && !Object.keys(filters).length}
        >
          <Icon name="search" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Icon
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.primary}
        />
        <Text style={styles.filterToggleText}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <PropertyFilter
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Results */}
      {isLoading && properties.length === 0 ? (
        <LoadingSpinner fullScreen text="Searching..." />
      ) : !hasSearched ? (
        <View style={styles.initialState}>
          <Icon name="search" size={64} color={COLORS.gray[300]} />
          <Text style={styles.initialTitle}>Search Properties</Text>
          <Text style={styles.initialMessage}>
            Use the search bar and filters above to find your perfect property
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {pagination.total} {pagination.total === 1 ? 'property' : 'properties'} found
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="home-outline"
              title="No Properties Found"
              message="Try adjusting your search or filters"
              actionLabel="Clear All"
              onAction={clearFilters}
            />
          }
          ListFooterComponent={renderFooter}
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
  },
  container: {
    flex: 1,
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
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: '500',
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  filterToggleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  initialTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 18,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  initialMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resultCount: {
    fontSize: 15,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  listContent: {
    paddingBottom: 110,
    flexGrow: 1,
  },
  loadingFooter: {
    paddingVertical: 20,
  },
});

export default SearchScreen;
