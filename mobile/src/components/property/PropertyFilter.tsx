import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../../config';
import { PropertyFilters } from '../../types';

interface PropertyFilterProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  onClearFilters: () => void;
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PropertyFilter: React.FC<PropertyFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = !!(
    filters.type ||
    filters.category ||
    filters.minPrice ||
    filters.maxPrice
  );

  const handleTypeChange = (type: string) => {
    onFilterChange({
      ...filters,
      type: filters.type === type ? undefined : type,
    });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClearFilters}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {PROPERTY_TYPES.map((type) => (
              <FilterChip
                key={type.value}
                label={type.label}
                selected={filters.type === type.value}
                onPress={() => handleTypeChange(type.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {PROPERTY_CATEGORIES.map((category) => (
              <FilterChip
                key={category.value}
                label={category.label}
                selected={filters.category === category.value}
                onPress={() => handleCategoryChange(category.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: COLORS.gray[100],
    borderWidth: 0,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default PropertyFilter;
