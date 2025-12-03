// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Property Types
export interface PropertyLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  city: string;
  address: string;
}

export interface Property {
  _id: string;
  title: string;
  price: number;
  type: 'sale' | 'rent';
  category: 'apartment' | 'house' | 'land' | 'studio';
  description: string;
  images: string[];
  location: PropertyLocation;
  ownerId: User | string;
  isForSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  city?: string;
  category?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// Message Types
export interface Message {
  _id: string;
  senderId: User | string;
  receiverId: User | string;
  propertyId?: Property | string;
  message: string;
  timestamp: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  errors?: Array<{ msg: string; param: string }>;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface PropertiesResponse {
  success: boolean;
  properties: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PropertyResponse {
  success: boolean;
  property: Property;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Explore: undefined;
  ExplorePropertyDetails: { propertyId: string };
  Main: undefined;
  Auth: { screen?: string } | undefined;
  PropertyDetails: { propertyId: string };
  CreateProperty: undefined;
  EditProperty: { propertyId: string };
  Chat: { userId: string; userName: string; propertyId?: string };
  UserProfile: { userId: string };
  MapView: { properties?: Property[]; initialRegion?: any };
  Search: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  AddProperty: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface PropertyForm {
  title: string;
  price: string;
  type: 'sale' | 'rent';
  category: 'apartment' | 'house' | 'land' | 'studio';
  description: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  images: string[];
}

export interface ProfileForm {
  name: string;
  phone: string;
  avatar?: string;
}
