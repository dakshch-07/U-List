import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const RECENT_SEARCHES_KEY = 'ulist_recent_searches_list';
const DEFAULT_RECENT = ['Swift VXi', 'iPhone 14', 'Royal Enfield', 'Activa 6G', '2 BHK Flat'];

export const getRecentSearches = async (): Promise<string[]> => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (data) return JSON.parse(data);
    } else {
      const stored = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
      if (stored) return JSON.parse(stored);
    }
    return DEFAULT_RECENT;
  } catch (e) {
    return DEFAULT_RECENT;
  }
};

export const saveRecentSearch = async (query: string): Promise<string[]> => {
  const trimmed = query.trim();
  if (!trimmed) return await getRecentSearches();

  try {
    const current = await getRecentSearches();
    // Filter out duplicates case-insensitively, and put to front
    const updated = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);

    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } else {
      await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    return [trimmed];
  }
};

export const clearRecentSearches = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } else {
      await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
    }
  } catch (e) {}
};
