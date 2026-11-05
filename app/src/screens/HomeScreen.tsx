import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Image, ScrollView, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppDownloadBanner } from '../components/AppDownloadBanner';
import { LocationPromptModal } from '../components/LocationPromptModal';
import { getRecentSearches, clearRecentSearches } from '../services/recentSearches';
import { storage } from '../utils/storage';
import { translations } from '../utils/translations';

// Realistic Indian 3D product category images matching OLX India style
const CATEGORY_IMAGES: Record<string, any> = {
  cars: require('../../assets/categories/cars.jpg'),
  properties: require('../../assets/categories/properties.jpg'),
  mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
  jobs: require('../../assets/categories/jobs.jpg'),
  bikes: require('../../assets/categories/bikes.jpg'),
  electronics: require('../../assets/categories/electronics.jpg'),
  'commercial-vehicles': require('../../assets/categories/commercial-vehicles.jpg'),
  furniture: require('../../assets/categories/furniture.jpg'),
  fashion: require('../../assets/categories/fashion.jpg'),
  'books-sports': require('../../assets/categories/books-sports.jpg'),
  pets: require('../../assets/categories/pets.jpg'),
  services: require('../../assets/categories/services.jpg'),
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedCity, setCity, language } = useAuthStore();
  const t = translations[language] || translations.en;
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    // Check if location modal was already answered once
    (async () => {
      const alreadyDone = await storage.getItem('ulist_location_modal_done');
      if (!alreadyDone && (!selectedCity || selectedCity === 'India')) {
        setShowLocationModal(true);
      }
    })();
  }, [selectedCity]);

  const handleDismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem('ulist_dismiss_location_prompt', 'true');
      }
    } catch {}
  };

  const handleTurnOnLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location permission to discover ads nearby.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      
      // Fetch available cities to match closest one
      const res = await api.get('/cities');
      const cities = res.data.data || [];
      if (cities.length > 0) {
        let nearest = cities[0];
        let minDistance = Infinity;
        cities.forEach((c: any) => {
          if (c.lat && c.lng) {
            const dist = Math.hypot(c.lat - loc.coords.latitude, c.lng - loc.coords.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = c;
            }
          }
        });
        setCity(nearest.name);
        setShowLocationPrompt(false);
        try {
          if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            localStorage.setItem('ulist_dismiss_location_prompt', 'true');
          }
        } catch {}
      }
    } catch (e: any) {
      Alert.alert('Location Error', 'Unable to fetch your precise GPS coordinates.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    // Load recent searches on mount and when screen is focused
    const loadSearches = async () => {
      const list = await getRecentSearches();
      setRecentSearches(list);
    };
    loadSearches();

    const unsubscribe = navigation.addListener?.('focus', () => {
      loadSearches();
    });
    return unsubscribe;
  }, [navigation]);

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Fresh ads query (with fallback to All India if user city has no ads)
  const { data: adsData, refetch, isFetching } = useQuery({
    queryKey: ['ads', selectedCity],
    queryFn: async () => {
      const res = await api.get('/ads', {
        params: { city: selectedCity, limit: 20 },
      });
      // If user selected a specific city and no ads were found, seamlessly load India-wide fresh recommendations
      if ((!res.data.data?.items || res.data.data.items.length === 0) && selectedCity !== 'India' && selectedCity !== 'All India') {
        const fallbackRes = await api.get('/ads', {
          params: { city: 'All India', limit: 20 },
        });
        return {
          ...fallbackRes.data.data,
          isFallback: true,
        };
      }
      return res.data.data;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const ads = adsData?.items || [];

  return (
    <View style={styles.container}>
      {/* OLX-Style "Where is your location?" First-Open Fullscreen Modal */}
      <LocationPromptModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onOpenCityPicker={() => navigation.navigate('CityPicker')}
      />

      {/* Top Header with City selector & Brand Logo + Sticky Search Bar together in one clean sticky top container */}
      <View style={styles.stickyTopContainer}>
        {/* Row 1: Location & Brand Actions */}
        <View style={styles.topRow}>
          {/* Left: Location Dropdown with full city name visibility */}
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => navigation.navigate('CityPicker')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
            <Text style={styles.cityName}>
              {selectedCity}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Right: Wishlist Heart, Notifications Bell, Brand Logo */}
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Favorites')}
              accessibilityLabel="Wishlist"
            >
              <MaterialCommunityIcons name="heart-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => alert('No new notifications')}
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.brandContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Row 2: Search Bar */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Search')}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.secondaryText} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>{t.searchPlaceholder}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={ads}
        numColumns={2}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Categories 4-Column Grid */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.browseCategories}</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.slice(0, 12).map((cat: any) => {
                const catImg = CATEGORY_IMAGES[cat.slug];
                return (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.categoryCard}
                    onPress={() => navigation.navigate('Category', { category: cat })}
                  >
                    <View style={styles.categoryImageBox}>
                      {catImg ? (
                        <Image
                          source={typeof catImg === 'string' ? { uri: catImg } : catImg}
                          style={styles.categoryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={cat.icon || 'tag-outline'}
                          size={28}
                          color={theme.colors.primary}
                        />
                      )}
                    </View>
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ulist custom branded "Turn on location" nearby recommendations prompt banner */}
            {showLocationPrompt && (
              <View style={styles.locationBanner}>
                <TouchableOpacity
                  style={styles.locationBannerClose}
                  onPress={handleDismissLocationPrompt}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>

                <View style={styles.locationBannerLeft}>
                  <Text style={styles.locationBannerText}>
                    {t.wantBetterRecommendations}
                  </Text>
                  <TouchableOpacity
                    style={styles.locationBannerButton}
                    onPress={handleTurnOnLocation}
                    disabled={locating}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.locationBannerBtnText}>
                      {locating ? t.detecting : t.turnOnLocation}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.locationBannerGraphic}>
                  <View style={styles.locationIconCircle}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={26} color="#D9480F" />
                  </View>
                </View>
              </View>
            )}

            {/* Fresh Recommendations Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.freshRecommendations}</Text>
            </View>

            {isFetching && ads.length === 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 4 }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <AdCard
            ad={item}
            onPress={() => navigation.navigate('AdDetail', { adId: item._id })}
          />
        )}
        ListEmptyComponent={
          !isFetching ? (
            <EmptyState
              icon="map-marker-radius-outline"
              title={`No ads in ${selectedCity} right now`}
              description="Be the first to post a classified listing here, or switch to All India to see available listings."
              buttonLabel="Switch to All India"
              onButtonPress={() => navigation.navigate('CityPicker')}
            />
          ) : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyTopContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  cityName: {
    fontSize: 14,
    fontWeight: theme.typography.weight.bold,
    marginHorizontal: 3,
    color: theme.colors.text,
  },
  taglineBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    flexShrink: 0,
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D9480F',
    letterSpacing: 0.1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerIconButton: {
    width: 26,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  brandLogo: {
    width: 76,
    height: 32,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  categoryCard: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryImageBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    color: theme.colors.text,
    lineHeight: 14,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
  },
  recentSearchesContainer: {
    marginTop: 8,
    paddingTop: 4,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  recentSearchesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentClearText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  recentChipsScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  recentChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  locationBanner: {
    backgroundColor: '#0F2942',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#D9480F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationBannerClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 4,
  },
  locationBannerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  locationBannerText: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  locationBannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#D9480F',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  locationBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationBannerGraphic: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
