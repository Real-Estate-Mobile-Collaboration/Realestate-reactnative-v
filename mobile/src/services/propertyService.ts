import api from './api';
import { 
  Property, 
  PropertyFilters, 
  PropertiesResponse, 
  PropertyResponse,
  PropertyForm 
} from '../types';

export const propertyService = {
  // Get all properties with filters
  getProperties: async (filters: PropertyFilters = {}): Promise<PropertiesResponse> => {
    const params = new URLSearchParams();
    
    if (filters.city) params.append('city', filters.city);
    if (filters.category) params.append('category', filters.category);
    if (filters.type) params.append('type', filters.type);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.latitude) params.append('latitude', filters.latitude.toString());
    if (filters.longitude) params.append('longitude', filters.longitude.toString());
    if (filters.radius) params.append('radius', filters.radius.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PropertiesResponse>(`/properties?${params.toString()}`);
    return response.data;
  },

  // Get property by ID
  getPropertyById: async (id: string): Promise<PropertyResponse> => {
    const response = await api.get<PropertyResponse>(`/properties/${id}`);
    return response.data;
  },

  // Create new property
  createProperty: async (data: PropertyForm): Promise<PropertyResponse> => {
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('price', data.price);
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('city', data.city);
    formData.append('address', data.address);
    formData.append('latitude', data.latitude);
    formData.append('longitude', data.longitude);

    // Add images
    data.images.forEach((imageUri, index) => {
      const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('images', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    });

    const response = await api.post<PropertyResponse>('/properties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Update property
  updateProperty: async (id: string, data: Partial<PropertyForm>): Promise<PropertyResponse> => {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.price) formData.append('price', data.price);
    if (data.type) formData.append('type', data.type);
    if (data.category) formData.append('category', data.category);
    if (data.description) formData.append('description', data.description);
    if (data.city) formData.append('city', data.city);
    if (data.address) formData.append('address', data.address);
    if (data.latitude) formData.append('latitude', data.latitude);
    if (data.longitude) formData.append('longitude', data.longitude);

    // Add new images if any
    if (data.images && data.images.length > 0) {
      data.images.forEach((imageUri, index) => {
        // Only add local images (not URLs)
        if (!imageUri.startsWith('http')) {
          const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('images', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }
      });
    }

    const response = await api.put<PropertyResponse>(`/properties/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Delete property
  deleteProperty: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  // Get user's properties
  getUserProperties: async (): Promise<{ success: boolean; properties: Property[] }> => {
    const response = await api.get('/properties/user/my-properties');
    return response.data;
  },
};

export default propertyService;
