import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { formatINR, formatDateAgo } from '../utils/formatters';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AdCardProps {
  ad: any;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, onPress, onFavoritePress, isFavorite }) => {
  const imageUrl = ad.images && ad.images.length > 0 ? ad.images[0].url : 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80';

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        {ad.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>HIGHLIGHTED</Text>
          </View>
        )}
        {onFavoritePress && (
          <TouchableOpacity style={styles.favButton} onPress={onFavoritePress}>
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? theme.colors.error : '#1B1B1B'}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.price} numberOfLines={1}>
          {ad.salary?.from != null && ad.salary?.to != null
            ? `₹${ad.salary.from.toLocaleString('en-IN')} - ₹${ad.salary.to.toLocaleString('en-IN')}`
            : formatINR(ad.price)}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {ad.title}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.meta} numberOfLines={1}>
            {ad.locality}, {ad.city}
          </Text>
          <Text style={styles.meta}>{formatDateAgo(ad.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    margin: 4,
    overflow: 'hidden',
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
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.colors.featuredTagBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.featuredTagText,
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 4,
  },
  content: {
    padding: 8,
  },
  price: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  title: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  meta: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
  },
});
