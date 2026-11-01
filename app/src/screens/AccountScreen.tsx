import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

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
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={36} color={theme.colors.secondaryText} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          {user ? (
            <>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
            </>
          ) : (
            <>
              <Text style={styles.name}>Welcome to Ulist</Text>
              <Text style={styles.email}>Log in to manage ads and chat</Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginBtnText}>Log In / Register</Text>
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
          <Text style={styles.menuText}>My Ads</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <MaterialCommunityIcons name="heart-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>Favourites</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ContactUs')}
        >
          <MaterialCommunityIcons name="headset" size={22} color={theme.colors.primary} />
          <Text style={[styles.menuText, { fontWeight: '600' }]}>Help & Contact Us</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('https://u-list-api.onrender.com/privacy')}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>Privacy Policy</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('https://u-list-api.onrender.com/terms')}
        >
          <MaterialCommunityIcons name="file-document-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>Terms of Service</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('https://u-list-api.onrender.com/about')}
        >
          <MaterialCommunityIcons name="information-outline" size={22} color={theme.colors.text} />
          <Text style={styles.menuText}>About Us</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
        </TouchableOpacity>

        {user && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={logout}>
              <MaterialCommunityIcons name="logout" size={22} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <MaterialCommunityIcons name="delete-forever-outline" size={22} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Delete Account</Text>
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
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
});
