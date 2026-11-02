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
import { getRecentSearches, clearRecentSearches } from '../services/recentSearches';

// Realistic Indian 3D product category images matching OLX India style
const CATEGORY_IMAGES: Record<string, string> = {
  cars: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=200&q=80',
  properties: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
  mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
  jobs: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80',
  bikes: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=200&q=80',
  electronics: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=200&q=80',
  'commercial-vehicles': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=200&q=80',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80',
  fashion: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=200&q=80',
  'books-sports': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
  pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80',
  services: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80',
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedCity, setCity } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    // Check if location prompt was dismissed
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (localStorage.getItem('ulist_dismiss_location_prompt') === 'true') {
        setShowLocationPrompt(false);
      }
    }
    if (selectedCity && selectedCity !== 'India') {
      setShowLocationPrompt(false);
    }
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

  // Fresh ads query
  const { data: adsData, refetch, isFetching } = useQuery({
    queryKey: ['ads', selectedCity],
    queryFn: async () => {
      const res = await api.get('/ads', {
        params: { city: selectedCity, limit: 20 },
      });
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
      {/* Top Banner on Web */}
      <AppDownloadBanner />

      <FlatList
        data={ads}
        numColumns={2}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Top Location, Tagline, Icons and Brand Header inside ListHeaderComponent so it scrolls away naturally */}
            <View style={styles.header}>
              <View style={styles.topRow}>
                {/* Left: Location dropdown + Tagline */}
                <View style={styles.locationTaglineCol}>
                  <TouchableOpacity style={styles.citySelector} onPress={() => navigation.navigate('CityPicker')}>
                    <MaterialCommunityIcons name="map-marker" size={17} color={theme.colors.primary} />
                    <Text style={styles.cityName} numberOfLines={1}>
                      {selectedCity}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={15} color={theme.colors.text} />
                  </TouchableOpacity>

                  <View style={styles.taglineBadge}>
                    <Text style={styles.taglineText} numberOfLines={1}>
                      List It. Sell It. Cash It!
                    </Text>
                  </View>
                </View>

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

              {/* Search Bar Row below */}
              <View style={styles.searchRow}>
                <TouchableOpacity
                  style={styles.searchBar}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Search')}
                >
                  <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.secondaryText} />
                  <Text style={styles.searchPlaceholder} numberOfLines={1}>Find Cars, Mobile Phones and more...</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories 4-Column Grid */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
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
                        <Image source={{ uri: catImg }} style={styles.categoryImage} resizeMode="contain" />
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

            {/* Quikr-style "Turn on location" nearby recommendations prompt banner */}
            {showLocationPrompt && (
              <View style={styles.locationBanner}>
                <TouchableOpacity
                  style={styles.locationBannerClose}
                  onPress={handleDismissLocationPrompt}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>

                <View style={styles.locationBannerLeft}>
                  <Text style={styles.locationBannerText}>
                    Want better recommendations? Turn on your location & we'll show ads nearby.
                  </Text>
                  <TouchableOpacity
                    style={styles.locationBannerButton}
                    onPress={handleTurnOnLocation}
                    disabled={locating}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.locationBannerBtnText}>
                      {locating ? 'Detecting...' : 'Turn on location'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.locationBannerGraphic}>
                  <MaterialCommunityIcons name="map-marker-path" size={48} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            )}

            {/* Fresh Recommendations Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fresh recommendations</Text>
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
  header: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTaglineCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
    flexWrap: 'nowrap',
    overflow: 'visible',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    flexShrink: 0,
  },
  cityName: {
    fontSize: 13,
    fontWeight: theme.typography.weight.bold,
    marginHorizontal: 2,
    color: theme.colors.text,
  },
  taglineBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  taglineText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D9480F',
    letterSpacing: 0.1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  headerIconButton: {
    width: 24,
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
    width: 82,
    height: 34,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    height: 44,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
    flex: 1,
  },
  headerIconButton: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    backgroundColor: '#4B6584',
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
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
    paddingRight: 10,
  },
  locationBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  locationBannerButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  locationBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  locationBannerGraphic: {
    opacity: 0.85,
    marginLeft: 6,
  },
});
