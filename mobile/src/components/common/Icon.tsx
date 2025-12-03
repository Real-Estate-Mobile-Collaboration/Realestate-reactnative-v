import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../config';

// Simple fallback icon mapping using Unicode characters
const ICON_MAP: Record<string, string> = {
  // Home & Buildings
  'home': '🏠',
  'home-outline': '🏠',
  'business': '🏢',
  'business-outline': '🏢',
  
  // Navigation
  'arrow-back': '←',
  'arrow-forward': '→',
  'chevron-back': '‹',
  'chevron-forward': '›',
  'chevron-down': '▼',
  'chevron-up': '▲',
  'close': '✕',
  'close-outline': '✕',
  'close-circle': '⊗',
  'close-circle-outline': '⊗',
  
  // User & Auth
  'person': '👤',
  'person-outline': '👤',
  'person-circle': '👤',
  'person-circle-outline': '👤',
  'people': '👥',
  'people-outline': '👥',
  'lock-closed': '🔒',
  'lock-closed-outline': '🔒',
  'key': '🔑',
  'key-outline': '🔑',
  'log-out': '🚪',
  'log-out-outline': '🚪',
  
  // Communication
  'mail': '✉',
  'mail-outline': '✉',
  'chatbubble': '💬',
  'chatbubble-outline': '💬',
  'chatbubbles': '💬',
  'chatbubbles-outline': '💬',
  'call': '📞',
  'call-outline': '📞',
  'send': '➤',
  'send-outline': '➤',
  
  // Actions
  'search': '🔍',
  'search-outline': '🔍',
  'add': '+',
  'add-outline': '+',
  'add-circle': '⊕',
  'add-circle-outline': '⊕',
  'remove': '−',
  'remove-outline': '−',
  'create': '✏',
  'create-outline': '✏',
  'trash': '🗑',
  'trash-outline': '🗑',
  'settings': '⚙',
  'settings-outline': '⚙',
  'options': '⋯',
  'options-outline': '⋯',
  'ellipsis-horizontal': '⋯',
  'ellipsis-vertical': '⋮',
  'filter': '🔽',
  'filter-outline': '🔽',
  'share': '↗',
  'share-outline': '↗',
  'share-social': '↗',
  'share-social-outline': '↗',
  
  // Media
  'camera': '📷',
  'camera-outline': '📷',
  'image': '🖼',
  'image-outline': '🖼',
  'images': '🖼',
  'images-outline': '🖼',
  
  // Location
  'location': '📍',
  'location-outline': '📍',
  'location-sharp': '📍',
  'map': '🗺',
  'map-outline': '🗺',
  'navigate': '🧭',
  'navigate-outline': '🧭',
  'compass': '🧭',
  'compass-outline': '🧭',
  
  // Heart / Favorites
  'heart': '❤',
  'heart-outline': '♡',
  'heart-sharp': '❤',
  
  // Star / Rating
  'star': '★',
  'star-outline': '☆',
  'star-half': '★',
  
  // Status
  'checkmark': '✓',
  'checkmark-outline': '✓',
  'checkmark-done': '✓✓',
  'checkmark-circle': '✓',
  'checkmark-circle-outline': '✓',
  'alert': '⚠',
  'alert-outline': '⚠',
  'alert-circle': '⚠',
  'alert-circle-outline': '⚠',
  'information': 'ℹ',
  'information-outline': 'ℹ',
  'information-circle': 'ℹ',
  'information-circle-outline': 'ℹ',
  'help': '?',
  'help-outline': '?',
  'help-circle': '?',
  'help-circle-outline': '?',
  
  // Visibility
  'eye': '👁',
  'eye-outline': '👁',
  'eye-off': '👁',
  'eye-off-outline': '👁',
  
  // Time
  'time': '🕐',
  'time-outline': '🕐',
  'calendar': '📅',
  'calendar-outline': '📅',
  
  // Property Features
  'bed': '🛏',
  'bed-outline': '🛏',
  'water': '🚿',
  'water-outline': '🚿',
  'car': '🚗',
  'car-outline': '🚗',
  'resize': '↔',
  'resize-outline': '↔',
  'expand': '↔',
  'expand-outline': '↔',
  
  // Money
  'cash': '💵',
  'cash-outline': '💵',
  'card': '💳',
  'card-outline': '💳',
  'pricetag': '🏷',
  'pricetag-outline': '🏷',
  
  // Misc
  'menu': '☰',
  'menu-outline': '☰',
  'list': '☰',
  'list-outline': '☰',
  'grid': '▦',
  'grid-outline': '▦',
  'apps': '▦',
  'apps-outline': '▦',
  'refresh': '↻',
  'refresh-outline': '↻',
  'sync': '↻',
  'sync-outline': '↻',
  'notifications': '🔔',
  'notifications-outline': '🔔',
  'document': '📄',
  'document-outline': '📄',
  'documents': '📄',
  'documents-outline': '📄',
  'copy': '📋',
  'copy-outline': '📋',
  'link': '🔗',
  'link-outline': '🔗',
  'globe': '🌐',
  'globe-outline': '🌐',
  'wifi': '📶',
  'wifi-outline': '📶',
  'bluetooth': '📶',
  'phone-portrait': '📱',
  'phone-portrait-outline': '📱',
  'laptop': '💻',
  'laptop-outline': '💻',
  'desktop': '🖥',
  'desktop-outline': '🖥',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = COLORS.text,
  style 
}) => {
  const iconChar = ICON_MAP[name] || '●';
  
  return (
    <Text 
      style={[
        styles.icon, 
        { 
          fontSize: size * 0.8, 
          color,
          lineHeight: size,
          width: size,
          height: size,
        },
        style
      ]}
    >
      {iconChar}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

export default Icon;
