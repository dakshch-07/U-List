import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
          !isFetching ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="heart-broken-outline" size={48} color={theme.colors.secondaryText} />
              <Text style={styles.emptyText}>You haven't saved any ads yet.</Text>
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
  list: {
    padding: 6,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    marginTop: 12,
  },
});
