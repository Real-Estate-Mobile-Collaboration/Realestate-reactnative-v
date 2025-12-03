import api, { setAuthToken } from './api';
import { User, AuthResponse, LoginForm, RegisterForm, ProfileForm } from '../types';

export const authService = {
  // Register new user
  register: async (data: RegisterForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
    });
    
    if (response.data.success && response.data.token) {
      await setAuthToken(response.data.token);
    }
    
    return response.data;
  },

  // Login user
  login: async (data: LoginForm): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    
    if (response.data.success && response.data.token) {
      await setAuthToken(response.data.token);
    }
    
    return response.data;
  },

  // Get current user
  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: ProfileForm): Promise<{ success: boolean; user: User }> => {
    // Check if avatar is a local file URI (new image selected)
    const isNewAvatar = data.avatar && !data.avatar.startsWith('http');
    
    if (isNewAvatar) {
      // Use FormData for image upload
      const formData = new FormData();
      
      if (data.name) formData.append('name', data.name);
      if (data.phone) formData.append('phone', data.phone);
      
      // Add avatar image
      const filename = data.avatar!.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('avatar', {
        uri: data.avatar,
        name: filename,
        type,
      } as any);
      
      const response = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Use JSON for text-only updates
      const response = await api.put('/auth/profile', {
        name: data.name,
        phone: data.phone,
      });
      return response.data;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    await setAuthToken(null);
  },
};

export default authService;
