import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { formatDateAgo } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestDeviceNotificationPermission, showDeviceNotification } from '../utils/notifications';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: async () => {
      if (!user) return { data: [], unreadCount: 0 };
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!user,
  });

  const notifications = data?.data || [];

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/all/read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = async (item: any) => {
    if (!item.isRead) {
      try {
        await api.put(`/notifications/${item._id}/read`);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}
    }

    if (item.ad) {
      if (item.type === 'ad_approved' && item.ad.status === 'active') {
        navigation.navigate('AdDetail', { adId: item.ad._id || item.ad });
      } else {
        navigation.navigate('MyAdsTab', { tab: item.type === 'ad_rejected' ? 'rejected' : 'pending' });
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="bell-outline" size={54} color={theme.colors.secondaryText} />
        <Text style={styles.centerTitle}>Login to View Notifications</Text>
        <Text style={styles.centerSubtitle}>Stay updated on your ad approvals, rejections and deals</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [permissionGranted, setPermissionGranted] = React.useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission === 'granted' : false
  );

  const handleEnableDeviceAlerts = async () => {
    const granted = await requestDeviceNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      showDeviceNotification('Notifications Activated!', {
        body: 'You will now receive instant phone notifications for ad reviews and buyer messages.',
      });
    }
  };

  return (
    <View style={styles.container}>
      {!permissionGranted && (
        <View style={styles.permissionBanner}>
          <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#D9480F" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.permissionTitle}>Turn On Device Notifications</Text>
            <Text style={styles.permissionDesc}>
              Get notified immediately on your phone when an ad is approved, rejected, or you receive a chat.
            </Text>
          </View>
          <TouchableOpacity style={styles.enableBtn} onPress={handleEnableDeviceAlerts}>
            <Text style={styles.enableBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.headerCount}>{notifications.length} notifications</Text>
          <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
            <Text style={styles.markAllReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[theme.colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isApproved = item.type === 'ad_approved';
          const isRejected = item.type === 'ad_rejected';
          const isExpired = item.type === 'ad_expired';

          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.notifUnread]}
              activeOpacity={0.8}
              onPress={() => handleNotificationPress(item)}
            >
              <View
                style={[
                  styles.iconBox,
                  isApproved && { backgroundColor: '#DCFCE7' },
                  isRejected && { backgroundColor: '#FEE2E2' },
                  isExpired && { backgroundColor: '#FEF3C7' },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    isApproved
                      ? 'check-circle'
                      : isRejected
                      ? 'close-circle'
                      : isExpired
                      ? 'clock-alert-outline'
                      : 'bell-outline'
                  }
                  size={24}
                  color={
                    isApproved
                      ? '#16A34A'
                      : isRejected
                      ? '#DC2626'
                      : isExpired
                      ? '#D97706'
                      : theme.colors.primary
                  }
                />
              </View>

              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{formatDateAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                You will be notified here whenever your ads are approved, rejected, or updated by our review team.
              </Text>
            </View>
          ) : null
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
  },
  permissionDesc: {
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 15,
    marginTop: 2,
  },
  enableBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerCount: {
    fontSize: 13,
    color: theme.colors.secondaryText,
    fontWeight: '500',
  },
  markAllReadText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'flex-start',
  },
  notifUnread: {
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 6,
  },
  message: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    color: theme.colors.secondaryText,
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
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
