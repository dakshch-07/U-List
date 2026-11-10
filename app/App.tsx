import React, { useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, BackHandler, TouchableOpacity } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from './src/services/api';

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
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { OfflineNotice } from './src/components/OfflineNotice';
import * as Linking from 'expo-linking';
import { translations } from './src/utils/translations';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'https://www.ulist.in', 'https://ulist.in'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: '',
          ChatsTab: 'chats',
          SellTab: 'sell',
          MyAdsTab: 'my-ads',
          AccountTab: 'account',
        },
      },
      AdDetail: 'a/:adId',
      CityPicker: 'cities',
      Search: 'search',
      Category: 'category/:slug',
      Login: 'login',
      Notifications: 'notifications',
      Favorites: 'favorites',
      ContactUs: 'contact',
      AboutUs: 'about',
      PrivacyPolicy: 'privacy',
      TermsOfService: 'terms',
      ChatRoom: 'chat/:conversationId',
    },
  },
};

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message || 'Unexpected application error'}</Text>
          <TouchableOpacity
            style={errorStyles.btn}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.reload();
              } else {
                this.setState({ hasError: false });
              }
            }}
          >
            <Text style={errorStyles.btnText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#00479A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

function BottomTabs() {
  const { user, language } = useAuthStore();
  const t = translations[language] || translations.en;

  // Poll conversations for unread badge count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?._id],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/conversations');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const totalUnreadCount = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);

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
          tabBarBadge: totalUnreadCount > 0 ? (totalUnreadCount > 99 ? '99+' : totalUnreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            lineHeight: 16,
            top: 2,
          },
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chat-outline" color={color} size={22.5} />
          ),
        }}
      />
      <Tab.Screen
        name="SellTab"
        component={PostAdScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Clear any editAd params so user always starts a brand new ad
            navigation.navigate('SellTab', { editAd: null, fresh: Date.now() });
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
              try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('editAd')) {
                  url.searchParams.delete('editAd');
                  window.history.replaceState({}, '', url.pathname);
                }
              } catch {}
            }
          },
        })}
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
  const isNavigatingRef = useRef<boolean>(false);
  const lastExitPressRef = useRef<number>(0);

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

      // Ensure root URL has an initial history entry
      if (!window.history.state?.ulistApp) {
        window.history.replaceState({ ulistApp: true, index: 0 }, '', window.location.href);
      }
    }

    // Android Native Hardware Back Button handler (only triggers on actual device back button)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.current && navigationRef.current.canGoBack()) {
        navigationRef.current.goBack();
        return true; // Stepped back inside app, do not close app
      }

      // User is at root Home screen: Require double press to exit
      const now = Date.now();
      if (now - lastExitPressRef.current < 2500) {
        return false; // Exit app on second press within 2.5 seconds
      }

      lastExitPressRef.current = now;
      if (Platform.OS === 'android') {
        import('react-native').then(({ ToastAndroid }) => {
          ToastAndroid.show('Press back again to exit Ulist', ToastAndroid.SHORT);
        });
      }
      return true; // Intercept first back press at root
    });

    return () => backHandler.remove();
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onStateChange={() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history && !isNavigatingRef.current) {
              window.history.pushState({ ulistApp: true, timestamp: Date.now() }, '', window.location.href);
            }
          }}
        >
          <OfflineNotice />
          <Stack.Navigator
            screenOptions={({ navigation }) => ({
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
              headerTitleStyle: { fontWeight: '700', fontSize: 16 },
              headerShadowVisible: false,
              headerLeft: (props) =>
                props.canGoBack ? (
                  <TouchableOpacity
                    onPress={() => {
                      isNavigatingRef.current = true;
                      navigation.goBack();
                      setTimeout(() => {
                        isNavigatingRef.current = false;
                      }, 200);
                    }}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, marginLeft: -4 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                ) : null,
            })}
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
              options={{ headerShown: false }}
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
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
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
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  sellButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Lifted slightly higher above the tab bar so the circle floats prominently
    marginTop: -38,
    marginBottom: 0,
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
  },
});
