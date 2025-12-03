import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import Icon from '../components/common/Icon';
import { RootStackParamList, Property } from '../types';
import { propertyService } from '../services';
import { LoadingSpinner } from '../components';
import { COLORS, APP_CONFIG } from '../config';

type MapViewRouteProp = RouteProp<RootStackParamList, 'MapView'>;
type MapViewNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const MapViewScreen: React.FC = () => {
  const route = useRoute<MapViewRouteProp>();
  const navigation = useNavigation<MapViewNavigationProp>();
  const webViewRef = useRef<WebView>(null);

  const { properties: initialProperties, initialRegion } = route.params || {};
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  const [isLoading, setIsLoading] = useState(!initialProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const defaultCenter = initialRegion
    ? { lat: initialRegion.latitude, lng: initialRegion.longitude }
    : { lat: APP_CONFIG.mapDefaultRegion.latitude, lng: APP_CONFIG.mapDefaultRegion.longitude };

  useEffect(() => {
    if (!initialProperties) {
      fetchProperties();
    }
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Error getting user location:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await propertyService.getProperties({ limit: 100 });
      if (response.success) {
        setProperties(response.properties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
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

  const getMarkerColor = (type: 'sale' | 'rent'): string => {
    return type === 'sale' ? COLORS.primary : COLORS.success;
  };

  const generateMapHTML = () => {
    const markersJS = properties.map((p) => `
      {
        id: "${p._id}",
        lat: ${p.location.coordinates[1]},
        lng: ${p.location.coordinates[0]},
        price: "${formatPrice(p.price)}",
        title: "${p.title.replace(/"/g, '\\"')}",
        type: "${p.type}",
        image: "${p.images[0] || ''}",
        city: "${p.location.city}"
      }
    `).join(',');

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
    .custom-marker {
      background: ${COLORS.primary};
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .custom-marker.rent {
      background: ${COLORS.success};
    }
    .custom-marker::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid ${COLORS.primary};
    }
    .custom-marker.rent::after {
      border-top-color: ${COLORS.success};
    }
    .user-location {
      width: 16px;
      height: 16px;
      background: #007AFF;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([${defaultCenter.lat}, ${defaultCenter.lng}], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const markers = [${markersJS}];
    
    markers.forEach(m => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="custom-marker ' + (m.type === 'rent' ? 'rent' : '') + '">' + m.price + '</div>',
        iconSize: [60, 30],
        iconAnchor: [30, 30]
      });
      
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          property: m
        }));
      });
    });

    ${userLocation ? `
    const userIcon = L.divIcon({
      className: 'user-location-icon',
      html: '<div class="user-location"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([${userLocation.lat}, ${userLocation.lng}], { icon: userIcon }).addTo(map);
    ` : ''}

    if (markers.length > 0) {
      const group = L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
      map.fitBounds(group.getBounds().pad(0.1));
    }

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
      if (data.type === 'markerClick') {
        const property = properties.find(p => p._id === data.property.id);
        if (property) {
          setSelectedProperty(property);
        }
      }
    } catch (e) {
      console.log('Error parsing message:', e);
    }
  };

  const goToUserLocation = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.goToLocation(${userLocation.lat}, ${userLocation.lng}); true;`
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading map..." />;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {/* My Location Button */}
      {userLocation && (
        <TouchableOpacity style={styles.myLocationButton} onPress={goToUserLocation}>
          <Icon name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* Selected Property Card */}
      {selectedProperty && (
        <TouchableOpacity
          style={styles.propertyCard}
          onPress={() => handlePropertyPress(selectedProperty._id)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: selectedProperty.images[0] || 'https://via.placeholder.com/100' }}
            style={styles.propertyImage}
          />
          <View style={styles.propertyInfo}>
            <View style={styles.propertyHeader}>
              <View style={[styles.typeBadge, { backgroundColor: getMarkerColor(selectedProperty.type) }]}>
                <Text style={styles.typeText}>
                  {selectedProperty.type === 'sale' ? 'For Sale' : 'For Rent'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProperty(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.propertyPrice}>
              {formatPrice(selectedProperty.price)}
              {selectedProperty.type === 'rent' && <Text style={styles.perMonth}>/mo</Text>}
            </Text>
            <Text style={styles.propertyTitle} numberOfLines={1}>
              {selectedProperty.title}
            </Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedProperty.location.city}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>For Sale</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>For Rent</Text>
        </View>
      </View>

      {/* Property Count */}
      <View style={styles.countBadge}>
        <Icon name="home" size={16} color={COLORS.primary} />
        <Text style={styles.countText}>{properties.length} properties</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 190,
    right: 16,
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
  propertyCard: {
    position: 'absolute',
    bottom: 26,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  propertyImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 14,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  typeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 6,
    letterSpacing: -0.3,
  },
  perMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  legend: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    gap: 18,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  countBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
});

export default MapViewScreen;
