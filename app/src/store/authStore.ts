import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  selectedCity: string;
  isLoading: boolean;
  setCity: (city: string) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  selectedCity: 'India',
  isLoading: true,

  setCity: async (city) => {
    set({ selectedCity: city });
    try {
      await SecureStore.setItemAsync('ulist_user_city', city);
    } catch {}
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('ulist_access_token');
      await SecureStore.deleteItemAsync('ulist_refresh_token');
    } catch {}
    set({ user: null });
  },

  initializeAuth: async () => {
    try {
      const savedCity = await SecureStore.getItemAsync('ulist_user_city');
      if (savedCity) {
        set({ selectedCity: savedCity });
      }

      const token = await SecureStore.getItemAsync('ulist_access_token');
      if (token) {
        const res = await api.get('/users/me');
        if (res.data.success) {
          set({ user: res.data.data });
        }
      }
    } catch {
      // Offline or session invalid
    } finally {
      set({ isLoading: false });
    }
  },
}));
