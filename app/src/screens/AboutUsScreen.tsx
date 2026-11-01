import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { theme } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const AboutUsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandHero}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BY WISHCRAFT</Text>
        </View>
        <Text style={styles.tagline}>
          Don't Let Unused Things Lose Their Value. Turn Them Into Cash!
        </Text>
      </View>

      {/* Main Story Card */}
      <View style={styles.card}>
        <Text style={styles.paragraph}>
          Every home, office and business has something lying unused — an old mobile phone, furniture, electronics, appliances, clothing, accessories, collectibles or simply something we no longer need.
        </Text>
        <Text style={styles.paragraph}>
          These products may be unused, extra, pre-owned or just taking up valuable space. But what is no longer useful to one person could be exactly what someone else is looking for.
        </Text>
        <Text style={[styles.paragraph, styles.highlightText]}>
          That's where ULIST comes in!
        </Text>
        <Text style={styles.paragraph}>
          ULIST, an app by <Text style={{ fontWeight: '700' }}>WishCraft</Text>, was born from a simple yet powerful idea: to help people give their unused and extra belongings a second life while unlocking the value hidden in them.
        </Text>
        <Text style={styles.paragraph}>
          We believe that one person's unused product can become another person's valuable find.
        </Text>
        <Text style={styles.paragraph}>
          Through ULIST, we aim to make it easier for individuals, families and businesses to list, discover, buy, sell and trade products. Instead of letting things gather dust, why not turn them into extra cash?
        </Text>
      </View>

      {/* Vision Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="telescope" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Our Vision</Text>
        </View>
        <Text style={styles.paragraph}>
          Our vision goes beyond buying and selling. We want to encourage smarter consumption, reduce unnecessary waste, promote reuse and create a community where products find new owners and value gets a second chance.
        </Text>
        <Text style={styles.paragraph}>
          Whether you are decluttering your home, upgrading your gadgets, clearing excess inventory or simply looking to make some extra money, ULIST gives you an opportunity to make it happen.
        </Text>
      </View>

      {/* Philosophy Card */}
      <View style={styles.philosophyCard}>
        <Text style={styles.philosophyLabel}>OUR PHILOSOPHY</Text>
        <Text style={styles.philosophyTagline}>List It. Sell It. Cash It!</Text>
        
        <View style={styles.philosophyItems}>
          <View style={styles.philosophyPill}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.philosophyPillText}>Don't store it</Text>
          </View>
          <View style={styles.philosophyPill}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.philosophyPillText}>Don't waste it</Text>
          </View>
          <View style={styles.philosophyPill}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.philosophyPillText}>Don't let it sit unused</Text>
          </View>
        </View>

        <Text style={styles.philosophyCallout}>
          Give it a new owner, a new purpose and a new beginning.
        </Text>
      </View>

      {/* Footer Contact Button */}
      <View style={styles.footerAction}>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => navigation.navigate('ContactUs')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="email-outline" size={18} color="#FFFFFF" />
          <Text style={styles.contactBtnText}>Contact WishCraft Team</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  brandHero: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  logoImage: {
    width: 140,
    height: 48,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#FAF5F2',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D9480F',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 21,
    color: '#334155',
    marginBottom: 10,
  },
  highlightText: {
    fontWeight: '800',
    color: theme.colors.primary,
    fontSize: 14,
  },
  philosophyCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  philosophyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  philosophyTagline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#9A3412',
    marginBottom: 14,
  },
  philosophyItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  philosophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  philosophyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C2D12',
  },
  philosophyCallout: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footerAction: {
    marginTop: 6,
    alignItems: 'center',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
