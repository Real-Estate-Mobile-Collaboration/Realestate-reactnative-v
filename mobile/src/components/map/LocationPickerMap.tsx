import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Icon from '../common/Icon';
import { COLORS, APP_CONFIG } from '../../config';

interface LocationPickerMapProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

const { width, height } = Dimensions.get('window');

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [address, setAddress] = useState<{ address?: string; city?: string } | null>(null);

  const defaultCenter = initialLocation
    ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
    : { lat: APP_CONFIG.mapDefaultRegion.latitude, lng: APP_CONFIG.mapDefaultRegion.longitude };

  useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedLocation) {
      reverseGeocode(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setSelectedLocation(coords);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.setMarker(${coords.lat}, ${coords.lng}); true;`
          );
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        setAddress({
          address: `${result.streetNumber || ''} ${result.street || ''}`.trim() || undefined,
          city: result.city || result.subregion || undefined,
        });
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
      setAddress(null);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: address?.address,
        city: address?.city,
      });
      onClose();
    }
  };

  const generateMapHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      pointer-events: none;
    }
    .crosshair::before, .crosshair::after {
      content: '';
      position: absolute;
      background: #666;
    }
    .crosshair::before {
      width: 2px;
      height: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
    .crosshair::after {
      width: 20px;
      height: 2px;
      top: 50%;
      transform: translateY(-50%);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="crosshair"></div>
  <script>
    const map = L.map('map').setView([${defaultCenter.lat}, ${defaultCenter.lng}], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = null;
    ${selectedLocation ? `
    marker = L.marker([${selectedLocation.lat}, ${selectedLocation.lng}]).addTo(map);
    ` : ''}

    map.on('click', function(e) {
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng).addTo(map);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelect',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }));
    });

    window.setMarker = function(lat, lng) {
      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }
      map.setView([lat, lng], 15);
    };

    window.goToLocation = function(lat, lng) {
      map.setView([lat, lng], 15);
    };
  </script>
</body>
</html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelect') {
        setSelectedLocation({ lat: data.lat, lng: data.lng });
      }
    } catch (e) {
      console.log('Error parsing message:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: generateMapHTML() }}
            style={styles.map}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {/* My Location Button */}
          <TouchableOpacity style={styles.myLocationButton} onPress={getCurrentLocation}>
            <Icon name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Instructions */}
          <View style={styles.instructionsBanner}>
            <Icon name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.instructionsText}>Tap on the map to select a location</Text>
          </View>
        </View>

        {/* Selected Location Info */}
        <View style={styles.footer}>
          {selectedLocation ? (
            <View style={styles.locationInfo}>
              <View style={styles.locationDetails}>
                <Icon name="location" size={24} color={COLORS.primary} />
                <View style={styles.locationTexts}>
                  <Text style={styles.coordinatesText}>
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </Text>
                  {address?.city && (
                    <Text style={styles.addressText}>
                      {address.address ? `${address.address}, ` : ''}{address.city}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
                <Icon name="checkmark" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noLocation}>
              <Icon name="location-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.noLocationText}>
                No location selected. Tap on the map to select.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 21,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 42,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  instructionsBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: 0,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  locationInfo: {
    gap: 14,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  locationTexts: {
    flex: 1,
  },
  coordinatesText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  noLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  noLocationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});

export default LocationPickerMap;
