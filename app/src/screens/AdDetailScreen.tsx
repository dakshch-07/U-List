import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share, Linking, Alert, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { formatINR, formatDateAgo, getFullImageUrl } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AdDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { adId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isStartingChat, setIsStartingChat] = useState(false);

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
    if (isStartingChat) return;

    if (!user) {
      navigation.navigate('Login');
      return;
    }

    const sellerUserId = ad.user?._id || ad.user;
    const currentUserId = user?._id || (user as any)?.id;

    if (sellerUserId && currentUserId && sellerUserId.toString() === currentUserId.toString()) {
      Alert.alert('Notice', 'This is your own listing.');
      return;
    }

    try {
      setIsStartingChat(true);
      const res = await api.post('/conversations', { adId: ad._id });
      setIsStartingChat(false);
      navigation.navigate('ChatRoom', {
        conversationId: res.data.data._id,
        otherUser: res.data.data.otherUser || ad.user,
        ad: ad,
      });
    } catch (err: any) {
      setIsStartingChat(false);
      const errorMsg = err.response?.data?.message || err.message || 'Unable to open conversation';
      Alert.alert('Chat Error', errorMsg);
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
      const shareUrl = `https://www.ulist.in/a/${ad?._id}`;
      const priceText = ad?.salary?.from != null && ad?.salary?.to != null
        ? `₹${ad.salary.from.toLocaleString('en-IN')} - ₹${ad.salary.to.toLocaleString('en-IN')}`
        : formatINR(ad?.price);
      
      const shareMessage = `Check out this listing on Ulist: ${ad?.title} for ${priceText}\n\n👉 View details: ${shareUrl}`;

      await Share.share({
        title: ad?.title || 'Ulist Listing',
        message: shareMessage,
        url: shareUrl,
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

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);
  const [carouselWidth, setCarouselWidth] = useState(Dimensions.get('window').width);

  const rawImages = ad?.images && ad.images.length > 0 ? ad.images : [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' }];
  const fallbackDetailUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    if (carouselWidth > 0) {
      const page = Math.round(offsetX / carouselWidth);
      if (page !== activeImageIndex && page >= 0 && page < rawImages.length) {
        setActiveImageIndex(page);
      }
    }
  };

  const scrollToImage = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, rawImages.length - 1));
    setActiveImageIndex(targetIndex);
    imageScrollRef.current?.scrollTo({ x: targetIndex * carouselWidth, animated: true });
  };

  const handlePrevImage = () => {
    if (activeImageIndex > 0) {
      scrollToImage(activeImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (activeImageIndex < rawImages.length - 1) {
      scrollToImage(activeImageIndex + 1);
    }
  };

  if (isLoading || !ad) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: theme.colors.secondaryText }}>Loading listing details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover Photo & Swipeable Carousel */}
        <View
          style={styles.imageContainer}
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width;
            if (width > 0 && width !== carouselWidth) {
              setCarouselWidth(width);
            }
          }}
        >
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            onMomentumScrollEnd={onCarouselScroll}
            scrollEventThrottle={16}
            style={{ width: '100%', height: '100%' }}
          >
            {rawImages.map((img: any, idx: number) => {
              const fullUrl = getFullImageUrl(img.url);
              return (
                <View key={idx} style={{ width: carouselWidth, height: '100%', backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    source={{ uri: fullUrl }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              );
            })}
          </ScrollView>

          {/* Web / Touch Arrow Controls for Easy Navigation */}
          {rawImages.length > 1 && activeImageIndex > 0 && (
            <TouchableOpacity
              style={[styles.carouselArrow, styles.carouselArrowLeft]}
              onPress={handlePrevImage}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {rawImages.length > 1 && activeImageIndex < rawImages.length - 1 && (
            <TouchableOpacity
              style={[styles.carouselArrow, styles.carouselArrowRight]}
              onPress={handleNextImage}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Multiple Images Dots Navigation */}
          {rawImages.length > 1 && (
            <View style={styles.imagePagination}>
              {rawImages.map((_: any, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => scrollToImage(idx)}
                  style={[
                    styles.paginationDot,
                    activeImageIndex === idx && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {rawImages.length > 1 && (
            <View style={styles.imageBadgeCount}>
              <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
              <Text style={styles.imageBadgeText}>{activeImageIndex + 1}/{rawImages.length}</Text>
            </View>
          )}

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
            {ad.user?.avatar ? (
              <Image
                source={{ uri: getFullImageUrl(ad.user.avatar) }}
                style={styles.sellerAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.sellerAvatar}>
                <MaterialCommunityIcons name="account" size={28} color={theme.colors.secondaryText} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sellerName}>{ad.contactName || ad.user?.name}</Text>
              <Text style={styles.sellerMeta}>Member on Ulist • View profile & ads</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* 5-Step Deal Flowchart matching user requested journey */}
        <View style={styles.flowSection}>
          <Text style={styles.flowSectionTitle}>How Deal Works on Ulist</Text>
          <View style={styles.flowGrid}>
            <View style={styles.flowStep}>
              <View style={[styles.flowIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={20} color="#0284C7" />
              </View>
              <Text style={styles.flowStepTitle}>Ask for More</Text>
              <Text style={styles.flowStepSub}>Chat & clarify details</Text>
            </View>

            <View style={styles.flowArrow}>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
            </View>

            <View style={styles.flowStep}>
              <View style={[styles.flowIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="handshake-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.flowStepTitle}>Negotiate</Text>
              <Text style={styles.flowStepSub}>Agree on best price</Text>
            </View>

            <View style={styles.flowArrow}>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
            </View>

            <View style={styles.flowStep}>
              <View style={[styles.flowIconBox, { backgroundColor: '#EDE9FE' }]}>
                <MaterialCommunityIcons name="eye-check-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.flowStepTitle}>Check Yourself</Text>
              <Text style={styles.flowStepSub}>Inspect item in-person</Text>
            </View>

            <View style={styles.flowArrow}>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
            </View>

            <View style={styles.flowStep}>
              <View style={[styles.flowIconBox, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="cash-check" size={20} color="#16A34A" />
              </View>
              <Text style={styles.flowStepTitle}>Buy & Happy U</Text>
              <Text style={styles.flowStepSub}>Safe closing</Text>
            </View>
          </View>
        </View>

        {/* Buyer Guidelines (Quikr Style) Below Every Ad */}
        <View style={styles.guidelinesSection}>
          <View style={styles.guidelinesHeader}>
            <Text style={styles.guidelinesTitle}>Buyer Guidelines</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://u-list-api.onrender.com/terms')}>
              <Text style={styles.knowMoreLink}>Know More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guidelineRow}>
            <View style={styles.guidelineCheck}>
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.guidelineText}>Be careful when paying offline</Text>
          </View>

          <View style={styles.guidelineRow}>
            <View style={styles.guidelineCheck}>
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.guidelineText}>Beware of ads with unrealistic prices, lookalikes or clone products</Text>
          </View>

          <View style={styles.guidelineRow}>
            <View style={styles.guidelineCheck}>
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.guidelineText}>Chat and ask questions to be clear on product details</Text>
          </View>

          <View style={styles.guidelineRow}>
            <View style={styles.guidelineCheck}>
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.guidelineText}>Do not deposit/transfer money to bank or any third party payment gateways without verifying credentials</Text>
          </View>
        </View>

        {/* Report Link */}
        <TouchableOpacity style={styles.reportRow} onPress={handleReportAd}>
          <MaterialCommunityIcons name="flag-outline" size={18} color={theme.colors.error} />
          <Text style={styles.reportText}>Report this ad</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar: Chat & Call */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.chatButton, isStartingChat && { opacity: 0.7 }]}
          onPress={handleStartChat}
          disabled={isStartingChat}
        >
          {isStartingChat ? (
            <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="chat-outline" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.chatButtonText}>{isStartingChat ? 'Opening...' : 'Chat'}</Text>
        </TouchableOpacity>

        {ad.showPhone ? (
          <TouchableOpacity style={styles.outlineButton} onPress={handleCall}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.outlineButtonText}>Call</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.outlineButton, styles.disabledButton]}
            disabled={true}
            activeOpacity={1}
          >
            <MaterialCommunityIcons name="phone-off-outline" size={20} color="#9CA3AF" />
            <Text style={[styles.outlineButtonText, styles.disabledButtonText]}>Call</Text>
          </TouchableOpacity>
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
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: theme.colors.primary,
  },
  imageBadgeCount: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carouselArrowLeft: {
    left: 12,
  },
  carouselArrowRight: {
    right: 12,
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
  sellerAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.border,
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
  disabledButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  whatsappButton: {
    width: 44,
    height: 44,
    backgroundColor: '#25D366',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowSection: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  flowSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  flowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowStep: {
    flex: 1,
    alignItems: 'center',
  },
  flowIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  flowStepTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  flowStepSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  flowArrow: {
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  guidelinesSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  knowMoreLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  guidelineCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  guidelineText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '400',
  },
});
