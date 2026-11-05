import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { getFullImageUrl } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ChatsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();

  const { data: conversations = [], refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/conversations');
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 3000, // Poll every 3 seconds so incoming chats and badges update live
  });

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="chat-outline" size={48} color={theme.colors.secondaryText} />
        <Text style={styles.centerTitle}>Login to View Your Chats</Text>
        <Text style={styles.centerSubtitle}>Connect with buyers and sellers in realtime</Text>
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
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        onRefresh={refetch}
        refreshing={isFetching}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                conversationId: item._id,
                otherUser: item.otherUser,
                ad: item.ad,
              })
            }
          >
            <Image
              source={{
                uri: getFullImageUrl(item.ad?.images?.[0]?.url),
              }}
              style={styles.thumbnail}
            />
            <View style={styles.content}>
              <View style={styles.topLine}>
                <Text style={styles.userName} numberOfLines={1}>{item.otherUser?.name || 'User'}</Text>
                <Text style={styles.timeText}>
                  {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={styles.adTitle} numberOfLines={1}>{item.ad?.title}</Text>
              <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMessage || 'No messages yet'}</Text>
            </View>

            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
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
  row: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.secondaryText,
  },
  adTitle: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  lastMsg: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.text,
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
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
