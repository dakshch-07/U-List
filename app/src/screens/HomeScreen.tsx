import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Image, ScrollView } from 'react-native';
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
  const { selectedCity } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

      {/* Top Location and Brand Header matching OLX style */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          {/* Left: Location dropdown */}
          <TouchableOpacity style={styles.citySelector} onPress={() => navigation.navigate('CityPicker')}>
            <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
            <Text style={styles.cityName} numberOfLines={1}>
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
              <MaterialCommunityIcons name="heart-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => alert('No new notifications')}
              accessibilityLabel="Notifications"
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.brandContainer}>
              <Text style={styles.brandTitle}>Ulist</Text>
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

        {/* Recent Searches Horizontal Row */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSearchesContainer}>
            <View style={styles.recentSearchesHeader}>
              <View style={styles.recentSearchesTitleRow}>
                <MaterialCommunityIcons name="history" size={15} color={theme.colors.secondaryText} />
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await clearRecentSearches();
                  setRecentSearches([]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.recentClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentChipsScroll}
            >
              {recentSearches.map((item, idx) => (
                <TouchableOpacity
                  key={`${item}-${idx}`}
                  style={styles.recentChip}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Search', { initialQuery: item })}
                >
                  <MaterialCommunityIcons name="magnify" size={13} color="#666" style={{ marginRight: 4 }} />
                  <Text style={styles.recentChipText} numberOfLines={1}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '45%',
  },
  cityName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    marginHorizontal: 4,
    color: theme.colors.text,
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
    width: 40,
    height: 44,
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
});
