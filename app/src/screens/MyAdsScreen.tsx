import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { formatINR, formatDateAgo } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const MyAdsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'active' | 'pending' | 'sold' | 'rejected'>('active');

  const { data: ads = [], refetch } = useQuery({
    queryKey: ['myAds', tab],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/ads/mine', { params: { status: tab } });
      return res.data.data;
    },
    enabled: !!user,
  });

  const handleMarkSold = async (id: string) => {
    try {
      await api.post(`/ads/${id}/sold`);
      Alert.alert('Status updated', 'Ad marked as sold');
      refetch();
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.adPrice}>{formatINR(item.price)}</Text>
                <Text style={styles.adMeta}>
                  Views: {item.views} • Posted {formatDateAgo(item.createdAt)}
                </Text>
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
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {tab} ads found.</Text>
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
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
  },
});
