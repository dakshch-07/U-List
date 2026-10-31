import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';

export const FavoritesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const queryClient = useQueryClient();

  const { data: favorites = [], isFetching, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get('/favorites');
      return res.data.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (adId: string) => {
      await api.delete(`/favorites/${adId}`);
      return adId;
    },
    onSuccess: (removedAdId) => {
      queryClient.setQueryData(['favorites'], (old: any = []) =>
        old.filter((item: any) => item._id !== removedAdId)
      );
    },
  });

  return (
    <View style={styles.container}>
      {isFetching && favorites.length === 0 ? (
        <View style={styles.skeletonGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <AdCard
              ad={item}
              isFavorite={true}
              onPress={() => navigation.navigate('AdDetail', { adId: item._id })}
              onFavoritePress={() => removeMutation.mutate(item._id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Nothing saved yet"
              description="Tap the heart on any classified ad and it will show up here for quick access."
              buttonLabel="Browse Bestsellers & Ads"
              onButtonPress={() => navigation.navigate('Home')}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: 6,
    flexGrow: 1,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
  },
});
