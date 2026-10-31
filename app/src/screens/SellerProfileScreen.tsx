import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SellerProfileScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { sellerId } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ['sellerProfile', sellerId],
    queryFn: async () => {
      const res = await api.get(`/users/${sellerId}`);
      return res.data.data;
    },
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.secondaryText }}>Loading seller profile...</Text>
      </View>
    );
  }

  const { user, ads } = data;

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.secondaryText} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>
            Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </Text>
          <Text style={styles.adsCount}>{ads.length} active listings</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Listings by {user.name}</Text>

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
          <View style={styles.center}>
            <Text style={{ color: theme.colors.secondaryText }}>No active listings right now.</Text>
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
  center: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  meta: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  adsCount: {
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.primary,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.secondaryText,
    textTransform: 'uppercase',
  },
  list: {
    padding: 6,
  },
});
