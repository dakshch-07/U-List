import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, BackHandler } from 'react-native';
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
import { AboutUsScreen } from './src/screens/AboutUsScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './src/screens/TermsOfServiceScreen';
import { LanguageScreen } from './src/screens/LanguageScreen';
import { OfflineNotice } from './src/components/OfflineNotice';
import { translations } from './src/utils/translations';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  const { language } = useAuthStore();
  const t = translations[language] || translations.en;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryText,
        tabBarStyle: {
          height: 59,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: '#EBEBEB',
          overflow: 'visible',
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 60,
          marginTop: -2.5,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 11.4,
          fontWeight: '600',
          lineHeight: 13,
          paddingTop: 1,
          marginTop: -1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t.home,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={22.5} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsScreen}
        options={{
          tabBarLabel: t.chats,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chat-outline" color={color} size={22.5} />
          ),
        }}
      />
      <Tab.Screen
        name="SellTab"
        component={PostAdScreen}
        options={{
          tabBarLabel: t.sell,
          tabBarIcon: () => (
            <View style={styles.sellButtonWrapper}>
              <View style={styles.sellButton}>
                <MaterialCommunityIcons name="currency-inr" color="#FFFFFF" size={26} />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyAdsTab"
        component={MyAdsScreen}
        options={{
          tabBarLabel: t.myAds,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={22.5} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          tabBarLabel: t.account,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={22.5} />
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

      // Sync browser history with React Navigation on Web so mobile back button steps back instead of exiting
      const handlePopState = () => {
        if (navigationRef.current && navigationRef.current.canGoBack()) {
          navigationRef.current.goBack();
        }
      };
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }

    // Android Hardware Back Button step-wise navigation handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
        return true; // Prevents app from closing
      }
      return false; // Exit app only if at the root screen
    });

    return () => backHandler.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
            window.history.pushState(null, '', window.location.href);
          }
        }}
      >
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
          <Stack.Screen
            name="AboutUs"
            component={AboutUsScreen}
            options={{ title: 'About Us' }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ title: 'Privacy Policy' }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{ title: 'Terms of Service' }}
          />
          <Stack.Screen
            name="Language"
            component={LanguageScreen}
            options={{
              title: 'भाषा चुनें / SELECT LANGUAGE',
              headerTitleStyle: { fontWeight: '700', fontSize: 16 },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  sellButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Lowered so the top border of the bottom nav cuts across the exact equator (midpoint) of the circle:
    // With 52 height, half is 26px above the tab bar top edge.
    marginTop: -28,
    marginBottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
  },
});
