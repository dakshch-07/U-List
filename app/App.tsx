import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from './src/theme';
import { useAuthStore } from './src/store/authStore';
import { HomeScreen } from './src/screens/HomeScreen';
import { CityPickerScreen } from './src/screens/CityPickerScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { AdDetailScreen } from './src/screens/AdDetailScreen';
import { PostAdScreen } from './src/screens/PostAdScreen';
import { MyAdsScreen } from './src/screens/MyAdsScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ChatsScreen } from './src/screens/ChatsScreen';
import { ChatRoomScreen } from './src/screens/ChatRoomScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { SellerProfileScreen } from './src/screens/SellerProfileScreen';
import { ContactUsScreen } from './src/screens/ContactUsScreen';
import { OfflineNotice } from './src/components/OfflineNotice';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryText,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          boxSizing: 'content-box',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 14,
          paddingTop: 4,
          paddingBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chat-outline" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="SellTab"
        component={PostAdScreen}
        options={{
          tabBarLabel: 'Sell',
          tabBarIcon: () => (
            <View style={styles.sellButton}>
              <MaterialCommunityIcons name="currency-inr" color="#FFFFFF" size={26} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyAdsTab"
        component={MyAdsScreen}
        options={{
          tabBarLabel: 'My Ads',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="heart-outline" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { initializeAuth } = useAuthStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    initializeAuth();

    // Check URL parameters for direct ad navigation (e.g., ?adId=xxx or #/ad/xxx)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlAdId = params.get('adId');
      if (urlAdId) {
        setTimeout(() => {
          navigationRef.current?.navigate('AdDetail', { adId: urlAdId });
        }, 500);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer ref={navigationRef}>
        <OfflineNotice />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 16 },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Main"
            component={BottomTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CityPicker"
            component={CityPickerScreen}
            options={{ title: 'Select City' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Category"
            component={CategoryScreen}
            options={({ route }: any) => ({ title: route.params?.category?.name || 'Category' })}
          />
          <Stack.Screen
            name="AdDetail"
            component={AdDetailScreen}
            options={{ title: 'Listing Details' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In / Register' }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: 'My Favourites' }}
          />
          <Stack.Screen
            name="SellerProfile"
            component={SellerProfileScreen}
            options={{ title: 'Seller Profile' }}
          />
          <Stack.Screen
            name="ContactUs"
            component={ContactUsScreen}
            options={{ title: 'Help & Contact Us' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  sellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    marginBottom: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
