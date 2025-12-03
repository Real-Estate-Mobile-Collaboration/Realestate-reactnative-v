import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../config';
import Icon from '../common/Icon';

interface PropertyMiniMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  onPress?: () => void;
  height?: number;
}

const PropertyMiniMap: React.FC<PropertyMiniMapProps> = ({
  latitude,
  longitude,
  title,
  onPress,
  height = 200,
}) => {
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
    .leaflet-control-attribution { display: none; }
    .leaflet-control-zoom { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    }).setView([${latitude}, ${longitude}], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([${latitude}, ${longitude}]).addTo(map);
  </script>
</body>
</html>
    `;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { height }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      disabled={!onPress}
    >
      <WebView
        source={{ html: generateMapHTML() }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {/* Overlay for click */}
      {onPress && (
        <View style={styles.overlay}>
          <View style={styles.expandButton}>
            <Icon name="expand" size={16} color={COLORS.white} />
            <Text style={styles.expandText}>View on Map</Text>
          </View>
        </View>
      )}

      {/* Attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OSM</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  expandText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '600',
  },
  attribution: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  attributionText: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
});

export default PropertyMiniMap;
