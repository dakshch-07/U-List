import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Linking, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { formatINR, formatDateAgo } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AdDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { adId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Favorite status
  const { data: favData } = useQuery({
    queryKey: ['favoriteStatus', adId],
    queryFn: async () => {
      if (!user) return { isFavorite: false };
      const res = await api.get(`/favorites/${adId}/status`);
      return res.data;
    },
    enabled: !!user,
  });

  const isFavorite = !!favData?.isFavorite;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigation.navigate('Login');
        return;
      }
      if (isFavorite) {
        await api.delete(`/favorites/${adId}`);
      } else {
        await api.post(`/favorites/${adId}`);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['favoriteStatus', adId], { isFavorite: !isFavorite });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const { data: ad, isLoading } = useQuery({
    queryKey: ['adDetail', adId],
    queryFn: async () => {
      const res = await api.get(`/ads/${adId}`);
      return res.data.data;
    },
  });

  const handleStartChat = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (ad.user?._id === user._id) {
      Alert.alert('Notice', 'This is your own listing.');
      return;
    }

    try {
      const res = await api.post('/conversations', { adId: ad._id });
      navigation.navigate('ChatRoom', {
        conversationId: res.data.data._id,
        otherUser: ad.user,
        ad: ad,
      });
    } catch (err: any) {
      Alert.alert('Chat Error', err.response?.data?.message || 'Unable to open conversation');
    }
  };

  const handleReportAd = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    Alert.prompt
      ? Alert.prompt('Report Listing', 'Reason for reporting this ad (e.g. Fraud, Offensive):', async (reason) => {
          if (!reason) return;
          try {
            await api.post('/reports', { targetType: 'ad', target: adId, reason });
            Alert.alert('Report Submitted', 'Thank you for helping keep Ulist safe.');
          } catch {}
        })
      : Alert.alert('Report Submitted', 'Ad reported for policy violation review.');
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Check out this listing on Ulist: ${ad?.title} for ${formatINR(ad?.price)}`,
      });
    } catch {}
  };

  const handleCall = () => {
    if (ad?.phone) {
      Linking.openURL(`tel:${ad.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (ad?.phone) {
      const cleanPhone = ad.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi,%20I%20am%20interested%20in%20your%20ad%20"${ad.title}"%20on%20Ulist`);
    }
  };

  if (isLoading || !ad) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: theme.colors.secondaryText }}>Loading listing details...</Text>
      </View>
    );
  }

  const imageUrl = ad.images && ad.images.length > 0 ? ad.images[0].url : 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover Photo */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.actionCircle}
              onPress={() => toggleFavoriteMutation.mutate()}
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? theme.colors.error : '#1B1B1B'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircle} onPress={onShare}>
              <MaterialCommunityIcons name="share-variant" size={22} color="#1B1B1B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing & Title */}
        <View style={styles.section}>
          <Text style={styles.price}>
            {ad.salary?.from != null && ad.salary?.to != null
              ? `₹${ad.salary.from.toLocaleString('en-IN')} - ₹${ad.salary.to.toLocaleString('en-IN')} / ${ad.salary.period || 'Month'}`
              : formatINR(ad.price)}
          </Text>
          <Text style={styles.title}>{ad.title}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.secondaryText} />
            <Text style={styles.locationText}>
              {ad.locality}, {ad.city}
            </Text>
            <Text style={styles.dateText}>• {formatDateAgo(ad.createdAt)}</Text>
          </View>
        </View>

        {/* Dynamic Category Attributes Grid */}
        {ad.attributes && Object.keys(ad.attributes).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.attrGrid}>
              {Object.entries(ad.attributes).map(([key, val]) => (
                <View key={key} style={styles.attrItem}>
                  <Text style={styles.attrKey}>{key.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.attrVal}>{String(val)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{ad.description}</Text>
        </View>

        {/* Seller Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => navigation.navigate('SellerProfile', { sellerId: ad.user?._id })}
          >
            <View style={styles.sellerAvatar}>
              <MaterialCommunityIcons name="account" size={28} color={theme.colors.secondaryText} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sellerName}>{ad.contactName || ad.user?.name}</Text>
              <Text style={styles.sellerMeta}>Member on Ulist • View profile & ads</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Report Link */}
        <TouchableOpacity style={styles.reportRow} onPress={handleReportAd}>
          <MaterialCommunityIcons name="flag-outline" size={18} color={theme.colors.error} />
          <Text style={styles.reportText}>Report this ad</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar: Chat, Call, WhatsApp */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleStartChat}
        >
          <MaterialCommunityIcons name="chat-outline" size={20} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        {ad.showPhone && (
          <>
            <TouchableOpacity style={styles.outlineButton} onPress={handleCall}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.outlineButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  reportText: {
    color: theme.colors.error,
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.medium,
    marginLeft: 6,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  price: {
    fontSize: theme.typography.size.title,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  title: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginLeft: 4,
  },
  dateText: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attrItem: {
    width: '50%',
    marginBottom: 12,
  },
  attrKey: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    fontWeight: theme.typography.weight.medium,
  },
  attrVal: {
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
    fontWeight: theme.typography.weight.medium,
    marginTop: 2,
  },
  description: {
    fontSize: theme.typography.size.body,
    lineHeight: 22,
    color: theme.colors.text,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  sellerMeta: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  chatButton: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  outlineButton: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  whatsappButton: {
    width: 44,
    height: 44,
    backgroundColor: '#25D366',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
