import { Platform } from 'react-native';

export const requestDeviceNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  }
  return false;
};

export const showDeviceNotification = async (title: string, options?: { body?: string; url?: string }) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            reg.showNotification(title, {
              body: options?.body || '',
              icon: '/assets/icon-192.png',
              badge: '/assets/icon-192.png',
              data: { url: options?.url || '/' },
            });
            return;
          }
        }
        new Notification(title, {
          body: options?.body,
          icon: '/assets/icon-192.png',
        });
      } catch (e) {
        console.warn('Could not display local notification:', e);
      }
    }
  }
};
