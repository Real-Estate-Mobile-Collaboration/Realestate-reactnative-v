import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { RootStackParamList, PropertyForm } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { Button, Input, LocationPickerMap } from '../components';
import { COLORS, PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../config';
import { useTabBar } from '../context';

const { width, height } = Dimensions.get('window');

type CreatePropertyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreatePropertyScreen: React.FC = () => {
  const navigation = useNavigation<CreatePropertyNavigationProp>();
  const { handleScroll } = useTabBar();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formData, setFormData] = useState<PropertyForm>({
    title: '',
    price: '',
    type: 'sale',
    category: 'apartment',
    description: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof PropertyForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim() || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Please set the property location';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Please add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - formData.images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      updateField('images', [...formData.images, ...newImages].slice(0, 10));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField('images', [...formData.images, result.assets[0].uri].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      updateField('latitude', location.coords.latitude.toString());
      updateField('longitude', location.coords.longitude.toString());

      // Try to get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        if (address.city) updateField('city', address.city);
        if (address.street) {
          updateField('address', `${address.streetNumber || ''} ${address.street}`.trim());
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await propertyService.createProperty(formData);
      if (response.success) {
        Alert.alert('Success', 'Property created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../images/searchbackground.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>Add up to 10 photos of your property</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {formData.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            
            {formData.images.length < 10 && (
              <View style={styles.addImageButtons}>
                <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                  <Icon name="images-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addImageText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                  <Icon name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addImageText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Title"
            placeholder="e.g., Modern 2BR Apartment"
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
            error={errors.title}
            required
          />

          <Input
            label="Price ($)"
            placeholder="Enter price"
            value={formData.price}
            onChangeText={(text) => updateField('price', text.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            error={errors.price}
            required
          />

          {/* Type Selection */}
          <Text style={styles.label}>Type <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsContainer}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.optionButton,
                  formData.type === type.value && styles.optionButtonSelected,
                ]}
                onPress={() => updateField('type', type.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.type === type.value && styles.optionTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Selection */}
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsContainer}>
            {PROPERTY_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.optionButton,
                  formData.category === cat.value && styles.optionButtonSelected,
                ]}
                onPress={() => updateField('category', cat.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    formData.category === cat.value && styles.optionTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Description"
            placeholder="Describe your property..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={errors.description}
            required
            containerStyle={{ height: 120 }}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Icon name="locate" size={20} color={COLORS.primary} />
              <Text style={styles.locationButtonText}>
                {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <Icon name="map" size={20} color={COLORS.primary} />
              <Text style={styles.locationButtonText}>Pick on Map</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="City"
            placeholder="Enter city"
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
            error={errors.city}
            required
          />

          <Input
            label="Address"
            placeholder="Enter full address"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            error={errors.address}
            required
          />

          <View style={styles.coordinatesContainer}>
            <Input
              label="Latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChangeText={(text) => updateField('latitude', text)}
              keyboardType="numeric"
              containerStyle={{ flex: 1, marginRight: 8 }}
            />
            <Input
              label="Longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChangeText={(text) => updateField('longitude', text)}
              keyboardType="numeric"
              containerStyle={{ flex: 1, marginLeft: 8 }}
            />
          </View>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          
          {formData.latitude && formData.longitude && (
            <View style={styles.selectedLocationBadge}>
              <Icon name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.selectedLocationText}>Location set</Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Button
          title="Create Listing"
          onPress={handleSubmit}
          loading={isLoading}
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Location Picker Modal */}
      <LocationPickerMap
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={(location) => {
          updateField('latitude', location.latitude.toString());
          updateField('longitude', location.longitude.toString());
          if (location.city && !formData.city) {
            updateField('city', location.city);
          }
          if (location.address && !formData.address) {
            updateField('address', location.address);
          }
        }}
        initialLocation={
          formData.latitude && formData.longitude
            ? {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
              }
            : undefined
        }
      />
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    padding: 18,
    paddingTop: 60,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 10,
  },
  required: {
    color: COLORS.danger,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: COLORS.gray[100],
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  coordinatesContainer: {
    flexDirection: 'row',
  },
  selectedLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.success + '15',
    borderRadius: 10,
  },
  selectedLocationText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 10,
  },
});

export default CreatePropertyScreen;
