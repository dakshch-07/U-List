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
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'unread' | 'important'>('all');

  const { data: conversations = [], refetch, isFetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/conversations');
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 3000,
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

  // Apply Quick Filter chips
  const filteredConversations = filteredByTab.filter((c: any) => {
    if (activeFilter === 'unread') return (c.unreadCount || 0) > 0;
    if (activeFilter === 'verified') return c.otherUser?.phone || c.otherUser?.role === 'admin';
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

      {/* QUICK FILTERS Chips */}
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
            style={[styles.chip, activeFilter === 'verified' && styles.chipActive]}
            onPress={() => setActiveFilter('verified')}
          >
            <MaterialCommunityIcons
              name="star-check"
              size={14}
              color={activeFilter === 'verified' ? '#00479A' : '#7C3AED'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.chipText, activeFilter === 'verified' && styles.chipTextActive]}>
              Ulist Verified Sellers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'unread' && styles.chipActive]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.chipText, activeFilter === 'unread' && styles.chipTextActive]}>Unread</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, activeFilter === 'important' && styles.chipActive]}
            onPress={() => setActiveFilter('important')}
          >
            <Text style={[styles.chipText, activeFilter === 'important' && styles.chipTextActive]}>Important</Text>
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
            <Image
              source={{
                uri: getFullImageUrl(item.ad?.images?.[0]?.url),
              }}
              style={styles.chatAvatar}
            />
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
            {/* Friendly Avatar with Magnifying Glass Illustration (Ulist Theme) */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.avatarHead}>
                <View style={styles.avatarHair} />
                <View style={styles.avatarFace}>
                  <View style={styles.avatarEye} />
                </View>
              </View>
              <View style={styles.avatarBody} />
              {/* Magnifying Glass */}
              <View style={styles.magnifier}>
                <View style={styles.magnifierLens} />
                <View style={styles.magnifierHandle} />
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
    borderBottomColor: '#00479A',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  tabBtnTextActive: {
    color: '#00479A',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: '#00479A',
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
    borderColor: '#00479A',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  chipTextActive: {
    color: '#00479A',
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
    backgroundColor: '#00479A',
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
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  avatarHead: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FBBF24',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  avatarHair: {
    position: 'absolute',
    top: 0,
    width: 64,
    height: 30,
    backgroundColor: '#00479A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  avatarFace: {
    position: 'absolute',
    bottom: 14,
    right: 18,
  },
  avatarEye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00479A',
  },
  avatarBody: {
    width: 90,
    height: 48,
    borderRadius: 45,
    backgroundColor: '#00479A',
    marginTop: -8,
  },
  magnifier: {
    position: 'absolute',
    right: 14,
    top: 26,
    alignItems: 'center',
  },
  magnifierLens: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 6,
    borderColor: '#E2E8F0',
    backgroundColor: 'rgba(219, 234, 254, 0.5)',
  },
  magnifierHandle: {
    width: 10,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '-45deg' }],
    marginTop: -4,
    marginLeft: 26,
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
    height: 46,
    borderRadius: 6,
    backgroundColor: '#00479A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#00479A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
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
    backgroundColor: '#00479A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

