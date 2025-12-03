// API Configuration
// Change this to your backend server URL
// Use your computer's local IP address (run 'ipconfig' to find it)
export const API_BASE_URL = 'http://192.168.43.240:5000/api';
export const SOCKET_URL = 'http://192.168.43.240:5000';

// App Configuration
export const APP_CONFIG = {
  itemsPerPage: 10,
  maxImages: 10,
  imageQuality: 0.8,
  mapDefaultRegion: {
    latitude: 36.8065,
    longitude: 10.1815,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
};

// Property Categories
export const PROPERTY_CATEGORIES = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Land', value: 'land' },
  { label: 'Studio', value: 'studio' },
];

// Property Types
export const PROPERTY_TYPES = [
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
];

// Colors - Elegant Brown/Earth Theme
export const COLORS = {
  primary: '#8B4513',        // Saddle Brown - main brand color
  primaryDark: '#6B3410',    // Darker brown for pressed states
  primaryLight: '#A0522D',   // Sienna - lighter brown
  secondary: '#D2691E',      // Chocolate - accent color
  accent: '#CD853F',         // Peru - warm accent
  success: '#2E7D32',        // Forest green
  danger: '#C62828',         // Deep red
  warning: '#F57C00',        // Deep orange
  info: '#00796B',           // Teal
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#FAFAF8',           // Warm white
    100: '#F5F5F0',          // Light cream
    200: '#E8E4DE',          // Light beige
    300: '#D4CFC6',          // Beige
    400: '#A69B8C',          // Warm gray
    500: '#7A7062',          // Medium warm gray
    600: '#5C5347',          // Dark warm gray
    700: '#3D362E',          // Darker brown gray
    800: '#2A2520',          // Very dark brown
    900: '#1A1614',          // Almost black brown
  },
  background: '#FAF9F7',     // Warm off-white background
  card: '#FFFFFF',
  text: '#2C2416',           // Dark brown text
  textSecondary: '#6B5D4D',  // Medium brown text
  border: '#E0D8CE',         // Warm border color
  // Gradient colors for special effects
  gradientStart: '#8B4513',
  gradientEnd: '#D2691E',
};
