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
      {/* Top Location and Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.citySelector} onPress={() => navigation.navigate('CityPicker')}>
          <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.primary} />
          <Text style={styles.cityName} numberOfLines={1}>
            {selectedCity}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Search')}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.secondaryText} />
          <Text style={styles.searchPlaceholder}>Find Cars, Mobile Phones and more...</Text>
        </TouchableOpacity>
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    marginHorizontal: 4,
    color: theme.colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    height: 42,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
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
