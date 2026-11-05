import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Share, Platform, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { getFullImageUrl } from '../utils/formatters';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { translations } from '../utils/translations';

export const AccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, setUser, logout, language } = useAuthStore();
  const t = translations[language] || translations.en;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant photos permission to upload your profile picture.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const asset = res.assets[0];
      setUploadingAvatar(true);

      const formData = new FormData();
      const filename = `avatar_${Date.now()}.jpg`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const resp = await fetch(asset.uri);
          const blob = await resp.blob();
          formData.append('avatar', blob, filename);
        } catch {
          formData.append('avatar', asset.uri);
        }
      } else {
        formData.append('avatar', {
          uri: asset.uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      const token = await storage.getItem('ulist_access_token');
      const response = await api.put('/users/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.data && response.data.data) {
        setUser(response.data.data);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.response?.data?.message || err.message || 'Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInviteFriends = async () => {
    try {
      const shareUrl = 'https://u-list-app.vercel.app';
      const message = `Check out Ulist - Buy and Sell anything near you with ease! Download or visit: ${shareUrl}`;
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: 'Ulist - List It. Sell It. Cash It!',
          text: message,
          url: shareUrl,
        });
      } else if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(`${message}`);
          Alert.alert('Link Copied', 'Invite link copied to clipboard!');
        } else {
          Alert.alert('Invite Link', shareUrl);
        }
      } else {
        await Share.share({
          message,
          title: 'Ulist - List It. Sell It. Cash It!',
        });
      }
    } catch {
      // User cancelled share
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your listings, messages, and profile data will be permanently removed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/auth/me');
              await logout();
              Alert.alert('Account deleted', 'Your account has been deleted permanently');
            } catch {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickAvatar}
          activeOpacity={0.8}
        >
          {user?.avatar ? (
            <Image
              source={{ uri: getFullImageUrl(user.avatar) }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={40} color={theme.colors.secondaryText} />
            </View>
          )}

          {/* Camera upload badge */}
          <View style={styles.cameraBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 16 }}>
          {user ? (
            <>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
              <TouchableOpacity onPress={handlePickAvatar} style={styles.changePhotoTextBtn}>
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.name}>{t.welcomeToUlist}</Text>
              <Text style={styles.email}>{t.loginSubtitle}</Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginBtnText}>{t.loginRegister}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Account Navigation List */}
      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyAdsTab')}
        >
          <MaterialCommunityIcons name="tag-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.myAds}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <MaterialCommunityIcons name="heart-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.favourites}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ContactUs')}
        >
          <MaterialCommunityIcons name="headset" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.helpAndSupport}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        {/* Invite friends to Ulist (OLX-style item) */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleInviteFriends}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="account-multiple-plus-outline" size={22} color={theme.colors.text} />
          <View style={styles.menuItemStacked}>
            <Text style={styles.menuTextStacked}>{t.inviteFriends}</Text>
            <Text style={styles.menuSubtextStacked}>{t.inviteSubtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        {/* Language Selection Option */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Language')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="translate" size={22} color={theme.colors.text} />
          <View style={styles.menuItemStacked}>
            <Text style={styles.menuTextStacked}>{t.selectLanguage}</Text>
            <Text style={styles.menuSubtextStacked}>
              {language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.privacyPolicy}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <MaterialCommunityIcons name="file-document-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.termsOfService}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AboutUs')}
        >
          <MaterialCommunityIcons name="information-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>{t.aboutUs}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        {user && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <MaterialCommunityIcons name="logout" size={22} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>{t.logOut}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <MaterialCommunityIcons name="delete-forever-outline" size={22} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>{t.deleteAccount}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  changePhotoTextBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  name: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  email: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  phone: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  loginBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: 12,
  },
  menu: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuText: {
    flex: 1,
    marginLeft: 14,
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text,
  },
  menuItemStacked: {
    flex: 1,
    marginLeft: 14,
  },
  menuTextStacked: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text,
  },
  menuSubtextStacked: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
});
