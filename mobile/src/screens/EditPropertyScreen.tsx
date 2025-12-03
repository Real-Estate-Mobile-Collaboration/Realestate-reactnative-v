import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { RootStackParamList, PropertyForm, Property } from '../types';
import Icon from '../components/common/Icon';
import { propertyService } from '../services';
import { Button, Input, LoadingSpinner } from '../components';
import { COLORS, PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../config';

type EditPropertyRouteProp = RouteProp<RootStackParamList, 'EditProperty'>;
type EditPropertyNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EditPropertyScreen: React.FC = () => {
  const navigation = useNavigation<EditPropertyNavigationProp>();
  const route = useRoute<EditPropertyRouteProp>();
  const { propertyId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const response = await propertyService.getPropertyById(propertyId);
      if (response.success) {
        const property = response.property;
        setFormData({
          title: property.title,
          price: property.price.toString(),
          type: property.type,
          category: property.category,
          description: property.description,
          city: property.location.city,
          address: property.location.address,
          latitude: property.location.coordinates[1].toString(),
          longitude: property.location.coordinates[0].toString(),
          images: property.images,
        });
        setExistingImages(property.images);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

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

    if (existingImages.length === 0 && newImages.length === 0) {
      newErrors.images = 'Please add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImages = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= 10) {
      Alert.alert('Limit Reached', 'You can only have up to 10 images');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - totalImages,
    });

    if (!result.canceled) {
      const images = result.assets.map((asset) => asset.uri);
      setNewImages((prev) => [...prev, ...images].slice(0, 10 - existingImages.length));
    }
  };

  const takePhoto = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= 10) {
      Alert.alert('Limit Reached', 'You can only have up to 10 images');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
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

    setIsSaving(true);
    try {
      const response = await propertyService.updateProperty(propertyId, {
        ...formData,
        images: newImages, // Only send new images
      });

      if (response.success) {
        Alert.alert('Success', 'Property updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update property');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading property..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <View>
              <Text style={styles.imageLabel}>Current Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {existingImages.map((uri, index) => (
                  <View key={`existing-${index}`} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeExistingImage(index)}
                    >
                      <Icon name="close" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* New Images */}
          <Text style={styles.imageLabel}>Add New Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {newImages.map((uri, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeNewImage(index)}
                >
                  <Icon name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            
            {existingImages.length + newImages.length < 10 && (
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
        </View>

        {/* Submit Button */}
        <Button
          title="Update Listing"
          onPress={handleSubmit}
          loading={isSaving}
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  section: {
    marginBottom: 28,
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  imageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    marginBottom: 18,
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

export default EditPropertyScreen;
