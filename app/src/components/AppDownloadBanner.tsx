import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../theme';

export const AppDownloadBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on Web browsers (mobile web or desktop web)
    if (Platform.OS !== 'web') return;

    (async () => {
      try {
        let dismissed = '';
        if (typeof localStorage !== 'undefined') {
          dismissed = localStorage.getItem('ulist_dismiss_download_banner') || '';
        } else {
          dismissed = (await SecureStore.getItemAsync('ulist_dismiss_download_banner')) || '';
        }
        if (!dismissed) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    })();
  }, []);

  const handleDismiss = async () => {
    setVisible(false);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ulist_dismiss_download_banner', 'true');
      }
      await SecureStore.setItemAsync('ulist_dismiss_download_banner', 'true');
    } catch {}
  };

  const handleDownload = () => {
    // Direct link to official APK download or Google Play Store
    window.open('https://github.com/dakshch-07/U-List/releases', '_blank');
  };

  if (!visible) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.leftSection}>
        {/* App Logo Badge */}
        <View style={styles.appIconBox}>
          <Text style={styles.appIconText}>U</Text>
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
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 2,
  },
  appIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
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
