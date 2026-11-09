import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { getFullImageUrl } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ChatsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: conversations = [], refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/conversations');
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 8000,
  });

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="chat-outline" size={54} color={theme.colors.secondaryText} />
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

  // Filter conversations by Buying (I am buyer) vs Selling (My Ad)
  const filteredByTab = conversations.filter((c: any) => {
    const isMyAd = c.ad?.user === user?._id || c.ad?.user?._id === user?._id;
    if (activeTab === 'selling') return isMyAd;
    return !isMyAd;
  });

  // Apply Quick Filter chips (All, Unread, Read)
  const filteredConversations = filteredByTab.filter((c: any) => {
    if (activeFilter === 'unread') return (c.unreadCount || 0) > 0;
    if (activeFilter === 'read') return (c.unreadCount || 0) === 0;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Buying / Selling Tabs (OLX India Style) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'buying' && styles.tabBtnActive]}
          onPress={() => setActiveTab('buying')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'buying' && styles.tabBtnTextActive]}>
            BUYING
          </Text>
          {activeTab === 'buying' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'selling' && styles.tabBtnActive]}
          onPress={() => setActiveTab('selling')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'selling' && styles.tabBtnTextActive]}>
            SELLING
          </Text>
          {activeTab === 'selling' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* QUICK FILTERS Chips: Only All, Unread, and Read */}
      <View style={styles.quickFilterSection}>
        <Text style={styles.quickFilterTitle}>QUICK FILTERS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'unread' && styles.chipActive]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.chipText, activeFilter === 'unread' && styles.chipTextActive]}>Unread</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'read' && styles.chipActive]}
            onPress={() => setActiveFilter('read')}
          >
            <Text style={[styles.chipText, activeFilter === 'read' && styles.chipTextActive]}>Read</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Conversations List or Empty State */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item._id}
        onRefresh={refetch}
        refreshing={isFetching}
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyScroll : styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                conversationId: item._id,
                otherUser: item.otherUser,
                ad: item.ad,
              })
            }
          >
            {item.ad?.images?.[0]?.url ? (
              <Image
                source={{
                  uri: getFullImageUrl(item.ad?.images?.[0]?.url),
                }}
                style={styles.chatAvatar}
              />
            ) : (
              <View style={styles.chatAvatarPlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={26} color="#94A3B8" />
              </View>
            )}
            <View style={styles.chatDetails}>
              <View style={styles.chatNameRow}>
                <Text style={styles.chatName} numberOfLines={1}>{item.otherUser?.name || 'User'}</Text>
                <Text style={styles.chatDate}>
                  {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : ''}
                </Text>
              </View>
              <Text style={styles.chatAdTitle} numberOfLines={1}>{item.ad?.title}</Text>
              <Text style={styles.chatLastMessage} numberOfLines={1}>{item.lastMessage || 'No messages yet'}</Text>
            </View>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Friendly Warm Orange Theme Illustration */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.bubbleCircle}>
                <MaterialCommunityIcons name="chat-processing-outline" size={54} color="#D9480F" />
              </View>
              <View style={styles.bubbleMini}>
                <MaterialCommunityIcons name="star-four-points" size={18} color="#EA580C" />
              </View>
            </View>

            <Text style={styles.emptyHeading}>You've got no messages so far!</Text>
            <Text style={styles.emptySubheading}>Be the first one to begin a conversation.</Text>

            <TouchableOpacity
              style={styles.startMessagingBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.startMessagingBtnText}>Start Messaging</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabBtnActive: {
    borderBottomColor: '#D9480F',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  tabBtnTextActive: {
    color: '#D9480F',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#D9480F',
    borderRadius: 2,
  },
  quickFilterSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickFilterTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    borderColor: '#D9480F',
    backgroundColor: '#FFF7ED',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  chipTextActive: {
    color: '#D9480F',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  chatRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chatAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDetails: {
    flex: 1,
    marginLeft: 12,
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  chatDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chatAdTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chatLastMessage: {
    fontSize: 13,
    color: '#334155',
    marginTop: 3,
  },
  unreadBadge: {
    backgroundColor: '#D9480F',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 30,
  },
  illustrationWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  bubbleCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleMini: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubheading: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  startMessagingBtn: {
    width: '100%',
    maxWidth: 280,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#D9480F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#D9480F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  startMessagingBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  centerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#D9480F',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#D9480F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

