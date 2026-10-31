import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Production Render backend API URL
export const BASE_URL = 'https://u-list-api.onrender.com/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('ulist_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Non-blocking
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle silent refresh if 401
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('ulist_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newAccess = res.data.data.accessToken;
          await SecureStore.setItemAsync('ulist_access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch {
        await SecureStore.deleteItemAsync('ulist_access_token');
        await SecureStore.deleteItemAsync('ulist_refresh_token');
      }
    }
    return Promise.reject(error);
  }
);
