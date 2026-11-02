import { storage } from '../utils/storage';

const RECENT_SEARCHES_KEY = 'ulist_recent_searches_list';
const DEFAULT_RECENT = ['Swift VXi', 'iPhone 14', 'Royal Enfield', 'Activa 6G', '2 BHK Flat'];

export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const data = await storage.getItem(RECENT_SEARCHES_KEY);
    if (data) return JSON.parse(data);
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
    const updated = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    await storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [trimmed];
  }
};

export const clearRecentSearches = async (): Promise<void> => {
  try {
    await storage.deleteItem(RECENT_SEARCHES_KEY);
  } catch (e) {}
};
