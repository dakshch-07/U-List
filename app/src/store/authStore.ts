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
      await storage.deleteItem('ulist_cached_user');
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

      // 1. Immediately hydrate cached user so app never shows "Sign In / Register" on startup
      const cachedUserStr = await storage.getItem('ulist_cached_user');
      if (cachedUserStr) {
        try {
          const parsed = JSON.parse(cachedUserStr);
          if (parsed && parsed._id) {
            set({ user: parsed, isLoading: false });
          }
        } catch {}
      }

      // 2. Verify / refresh with backend in background
      const token = await storage.getItem('ulist_access_token');
      if (token) {
        try {
          const res = await api.get('/users/me');
          if (res.data?.success && res.data?.data) {
            set({ user: res.data.data });
            await storage.setItem('ulist_cached_user', JSON.stringify(res.data.data));
          }
        } catch (apiErr: any) {
          // If offline, keep the cached user intact! Never log out on network glitch/exit.
          console.warn('[Auth] Background sync error (kept session):', apiErr.message);
        }
      }
    } catch {
      // Keep existing session
    } finally {
      set({ isLoading: false });
    }
  },
}));
