import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { formatINR, formatDateAgo, getFullImageUrl } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { storage } from '../utils/storage';

export const MyAdsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'pending' | 'sold' | 'rejected'>('active');

  const { data: ads = [], refetch, isFetching } = useQuery({
    queryKey: ['myAds', tab, user?._id],
    queryFn: async () => {
      const token = await storage.getItem('ulist_access_token');
      if (!token) return [];
      const res = await api.get('/ads/mine', {
        params: { status: tab },
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Re-fetch fresh data every time user focuses on My Ads screen
  useFocusEffect(
    useCallback(() => {
      if (user) {
        refetch();
      }
    }, [user, tab, refetch])
  );

  const handleMarkSold = async (id: string) => {
    try {
      await api.post(`/ads/${id}/sold`);
      Alert.alert('Status updated', 'Ad marked as sold');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['myAds'] });
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Ad', 'Are you sure you want to permanently delete this ad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/ads/${id}`);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['myAds'] });
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="tag-multiple-outline" size={48} color={theme.colors.secondaryText} />
        <Text style={styles.centerTitle}>Login to View Your Ads</Text>
        <Text style={styles.centerSubtitle}>Manage all your active, sold and pending listings</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['active', 'pending', 'sold', 'rejected'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && styles.activeTabItem]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={ads}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => {
          const fallbackThumb = 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80';
          const imgUrl = item.images?.[0]?.url ? getFullImageUrl(item.images[0].url) : null;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {imgUrl ? (
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.adThumb}
                    resizeMode="cover"
                    defaultSource={{ uri: fallbackThumb }}
                  />
                ) : (
                  <View style={styles.adThumbFallback}>
                    <MaterialCommunityIcons name="image-outline" size={24} color="#94A3B8" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.adTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.adPrice}>{formatINR(item.price)}</Text>
                  <Text style={styles.adMeta}>
                    Views: {item.views || 0} • Posted {formatDateAgo(item.createdAt)}
                  </Text>
                  {tab === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color="#D97706" />
                      <Text style={styles.pendingBadgeText}>Pending Admin Review</Text>
                    </View>
                  )}
                  {item.rejectReason ? (
                    <Text style={styles.rejectReason}>Reason: {item.rejectReason}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionRow}>
                {tab === 'active' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleMarkSold(item._id)}
                  >
                    <Text style={styles.actionBtnText}>Mark as Sold</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: theme.colors.error }]}
                  onPress={() => handleDelete(item._id)}
                >
                  <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name={tab === 'pending' ? 'clock-check-outline' : 'tag-off-outline'}
              size={48}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>No {tab} ads found.</Text>
            {tab === 'pending' && (
              <Text style={styles.emptySubtext}>
                When you post an ad, it undergoes a quick review by our admin team and will appear here until approved.
              </Text>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 16 }]}
              onPress={() => navigation.navigate('SellTab')}
            >
              <Text style={styles.primaryButtonText}>Post an Ad</Text>
            </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerTitle: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    marginTop: 12,
  },
  centerSubtitle: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  tabText: {
    fontSize: 12,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.secondaryText,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  list: {
    padding: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  adTitle: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  adPrice: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
    marginTop: 4,
  },
  adMeta: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 4,
  },
  rejectReason: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.error,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  adThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
  },
  adThumbFallback: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
});
