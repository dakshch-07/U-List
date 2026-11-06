import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import { theme } from '../theme';

export const AppDownloadBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Only apply on Web platform
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. If user is ALREADY running the app as an installed PWA / standalone, NEVER show banner!
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;

    if (isStandalone) {
      setVisible(false);
      return;
    }

    // 2. Check if user dismissed it earlier
    (async () => {
      try {
        const dismissed = await storage.getItem('ulist_dismiss_download_banner');
        const installed = await storage.getItem('ulist_app_installed');
        if (!dismissed && !installed) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    })();

    // 3. Listen for browser PWA install prompt event ('beforeinstallprompt')
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    // 4. When app is installed, instantly disappear the notification banner permanently!
    const handleAppInstalled = async () => {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        await storage.setItem('ulist_app_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = async () => {
    setVisible(false);
    try {
      await storage.setItem('ulist_dismiss_download_banner', 'true');
    } catch {}
  };

  const handleDownload = async () => {
    if (deferredPrompt) {
      // Trigger native 1-click browser PWA install prompt!
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setVisible(false);
        try {
          await storage.setItem('ulist_app_installed', 'true');
        } catch {}
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: If browser doesn't expose beforeinstallprompt (e.g. iOS Safari), show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("To install Ulist on iPhone/iPad: Tap the Share button in Safari, then tap 'Add to Home Screen'!");
      } else {
        alert("To install Ulist: Tap the browser menu (⋮) in Chrome, then tap 'Install app' or 'Add to Home screen'!");
      }
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.leftSection}>
        {/* App Logo Badge */}
        <View style={styles.appIconBox}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.mainTitle} numberOfLines={1}>
            Get Instant and 3x more
          </Text>
          <Text style={styles.subTitle} numberOfLines={1}>
            Responses on your Ad!
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 9999,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  appIconBox: {
    width: 60,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 58,
    height: 28,
  },
  textContent: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
    lineHeight: 16,
  },
  subTitle: {
    fontSize: 12,
    color: '#616161',
    fontWeight: '500',
    lineHeight: 15,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#0084D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 1,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    marginLeft: 10,
    padding: 4,
  },
});
