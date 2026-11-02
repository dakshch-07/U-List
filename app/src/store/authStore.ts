import { create } from 'zustand';
import { storage } from '../utils/storage';
import { api } from '../services/api';
import { LanguageCode } from '../utils/translations';

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
  language: LanguageCode;
  isLoading: boolean;
  setCity: (city: string) => void;
  setLanguage: (lang: LanguageCode) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  selectedCity: 'India',
  language: 'en',
  isLoading: true,

  setLanguage: async (lang) => {
    set({ language: lang });
    try {
      await storage.setItem('ulist_user_language', lang);
    } catch {}
  },

  setCity: async (city) => {
    set({ selectedCity: city });
    try {
      await storage.setItem('ulist_user_city', city);
    } catch {}
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await storage.deleteItem('ulist_access_token');
      await storage.deleteItem('ulist_refresh_token');
    } catch {}
    set({ user: null });
  },

  initializeAuth: async () => {
    try {
      const savedLanguage = await storage.getItem('ulist_user_language');
      if (savedLanguage === 'en' || savedLanguage === 'hi') {
        set({ language: savedLanguage });
      }

      const savedCity = await storage.getItem('ulist_user_city');
      if (savedCity) {
        set({ selectedCity: savedCity });
      }

      const token = await storage.getItem('ulist_access_token');
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
