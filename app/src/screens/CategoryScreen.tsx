import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { useAuthStore } from '../store/authStore';

export const CategoryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { category } = route.params;
  const { selectedCity } = useAuthStore();
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const { data: adsData, isFetching } = useQuery({
    queryKey: ['categoryAds', category._id, selectedSub, selectedCity],
    queryFn: async () => {
      const res = await api.get('/ads', {
        params: {
          category: category._id,
          subcategory: selectedSub || undefined,
          city: selectedCity,
        },
      });
      return res.data.data;
    },
  });

  const ads = adsData?.items || [];
  const subcategories = category.subcategories || [];

  return (
    <View style={styles.container}>
      {/* Subcategory Pills Row */}
      {subcategories.length > 0 && (
        <View style={styles.subContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ _id: 'all', name: 'All' }, ...subcategories]}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const isSelected = (item._id === 'all' && !selectedSub) || selectedSub === item._id;
              return (
                <TouchableOpacity
                  style={[styles.subPill, isSelected && styles.activeSubPill]}
                  onPress={() => setSelectedSub(item._id === 'all' ? null : item._id)}
                >
                  <Text style={[styles.subPillText, isSelected && styles.activeSubPillText]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Ads List */}
      <FlatList
        data={ads}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AdCard
            ad={item}
            onPress={() => navigation.navigate('AdDetail', { adId: item._id })}
          />
        )}
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No ads in this category for {selectedCity}</Text>
            </View>
          ) : (
            <View />
          )
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
  subContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginRight: 8,
  },
  activeSubPill: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subPillText: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.text,
  },
  activeSubPillText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
  },
  list: {
    padding: 6,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
  },
});
