import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedCity } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Fresh ads query
  const { data: adsData, refetch } = useQuery({
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
      {/* Top Location and Search Bar Header with Wishlist and Notifications */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>Ulist</Text>
          </View>
          <TouchableOpacity style={styles.citySelector} onPress={() => navigation.navigate('CityPicker')}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.cityName} numberOfLines={1}>
              {selectedCity}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Search')}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.secondaryText} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>Search "Cars, Mobiles, Bikes..."</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Favorites')}
          >
            <MaterialCommunityIcons name="heart-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => alert('No new notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.text} />
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
              <Text style={styles.sectionTitle}>Browse Categories</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.slice(0, 12).map((cat: any) => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate('Category', { category: cat })}
                >
                  <View style={styles.categoryIconCircle}>
                    <MaterialCommunityIcons
                      name={cat.icon || 'tag-outline'}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fresh Recommendations Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fresh recommendations</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <AdCard
            ad={item}
            onPress={() => navigation.navigate('AdDetail', { adId: item._id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings found in {selectedCity}</Text>
          </View>
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
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  cityName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
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
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: theme.typography.size.caption,
    textAlign: 'center',
    color: theme.colors.text,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
  },
});
