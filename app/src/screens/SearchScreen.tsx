import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../services/recentSearches';

// Popular Indian Search Suggestions with typo corrections
const POPULAR_SEARCHES = ['Swift VXi', 'iPhone 14', 'Royal Enfield', '2 BHK Flat', 'Smart TV', 'Activa 6G'];

const TYPO_MAP: Record<string, string> = {
  'blu sheos': 'blue shoes',
  'iphne': 'iPhone 14',
  'actva': 'Activa 6G',
  'swft': 'Swift VXi',
  'royel': 'Royal Enfield',
  'tv': 'Smart TV',
  'flat': '2 BHK Flat',
  'scoty': 'Activa 6G',
};

export const SearchScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { selectedCity, setCity } = useAuthStore();
  const initialQuery = route?.params?.initialQuery || '';
  const [search, setSearch] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [recentList, setRecentList] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const list = await getRecentSearches();
      setRecentList(list);
    })();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setSearch(initialQuery);
      setSubmittedQuery(initialQuery);
      saveRecentSearch(initialQuery);
    }
  }, [initialQuery]);

  // Suggestions while typing
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions', search],
    queryFn: async () => {
      if (search.trim().length < 2) return [];
      const res = await api.get('/ads/suggest', { params: { q: search } });
      return res.data.data;
    },
    enabled: search.trim().length >= 2 && !submittedQuery,
  });

  // Ads Query
  const { data: resultsData, isFetching } = useQuery({
    queryKey: ['searchResults', submittedQuery, selectedCity, sort],
    queryFn: async () => {
      const res = await api.get('/ads', {
        params: {
          q: submittedQuery || undefined,
          city: selectedCity,
          sort,
        },
      });
      return res.data.data;
    },
  });

  const handleSearchSubmit = async (textToSearch?: string) => {
    const q = (textToSearch || search).trim();
    if (q) {
      setSearch(q);
      setSubmittedQuery(q);
      const updated = await saveRecentSearch(q);
      setRecentList(updated);
    }
  };

  const ads = resultsData?.items || [];
  const normalizedQuery = submittedQuery.toLowerCase().trim();
  const suggestedCorrection = TYPO_MAP[normalizedQuery] || (ads.length === 0 && search.length > 3 ? 'Swift VXi' : null);

  return (
    <View style={styles.container}>
      {/* Header Search Box */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Find Cars, Mobile Phones and more..."
          value={search}
          onChangeText={(txt) => {
            setSearch(txt);
            if (submittedQuery) setSubmittedQuery('');
          }}
          onSubmitEditing={() => handleSearchSubmit()}
          autoFocus
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => { setSearch(''); setSubmittedQuery(''); }} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.secondaryText} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleSearchSubmit()} style={styles.searchSubmitBtn}>
            <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Filter Bar directly below Search input (OLX India style) */}
      <View style={styles.locationSelectorRow}>
        <TouchableOpacity
          style={styles.locationSelectorBox}
          onPress={() => navigation.navigate('CityPicker')}
          activeOpacity={0.8}
        >
          <View style={styles.locationLeftGroup}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#1B1B1B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {selectedCity}
            </Text>
          </View>
          {selectedCity !== 'India' ? (
            <TouchableOpacity
              onPress={() => setCity('India')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.locationClearBtn}
            >
              <MaterialCommunityIcons name="close" size={16} color="#666666" />
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons name="chevron-down" size={18} color="#666666" />
          )}
        </TouchableOpacity>
      </View>

      {/* Instant Suggestions Dropdown if typing */}
      {!submittedQuery && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              style={styles.suggestionRow}
              onPress={() => handleSearchSubmit(item.title)}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.secondaryText} />
              <Text style={styles.suggestionText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter and Sort row when query submitted */}
      {submittedQuery ? (
        <View style={styles.sortBar}>
          <Text style={styles.resultsCount}>
            {ads.length} results in <Text style={{ fontWeight: '700' }}>{selectedCity}</Text>
          </Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortPill, sort === 'newest' && styles.activeSortPill]}
              onPress={() => setSort('newest')}
            >
              <Text style={[styles.sortPillText, sort === 'newest' && styles.activeSortPillText]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortPill, sort === 'price_asc' && styles.activeSortPill]}
              onPress={() => setSort('price_asc')}
            >
              <Text style={[styles.sortPillText, sort === 'price_asc' && styles.activeSortPillText]}>Price ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortPill, sort === 'price_desc' && styles.activeSortPill]}
              onPress={() => setSort('price_desc')}
            >
              <Text style={[styles.sortPillText, sort === 'price_desc' && styles.activeSortPillText]}>Price ↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Loading Skeletons */}
      {isFetching && submittedQuery ? (
        <View style={styles.skeletonGrid}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={ads}
          numColumns={2}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdCard
              ad={item}
              onPress={() => navigation.navigate('AdDetail', { adId: item._id })}
            />
          )}
          ListEmptyComponent={
            submittedQuery ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon="magnify-remove-outline"
                  title={`No results for "${submittedQuery}"`}
                  description="We couldn't find anything matching your search. Check for typos or try popular terms."
                />

                {/* Typo Suggestion pill */}
                {suggestedCorrection && (
                  <View style={styles.typoBox}>
                    <Text style={styles.typoLabel}>Did you mean: </Text>
                    <TouchableOpacity onPress={() => handleSearchSubmit(suggestedCorrection)}>
                      <Text style={styles.typoLink}>{suggestedCorrection}?</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Popular searches pills */}
                <View style={styles.popularBox}>
                  <Text style={styles.popularTitle}>Popular right now</Text>
                  <View style={styles.popularPills}>
                    {POPULAR_SEARCHES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.popularPill}
                        onPress={() => handleSearchSubmit(item)}
                      >
                        <Text style={styles.popularPillText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {suggestedCorrection && (
                  <TouchableOpacity
                    style={styles.fallbackButton}
                    onPress={() => handleSearchSubmit(suggestedCorrection)}
                  >
                    <Text style={styles.fallbackButtonText}>Search "{suggestedCorrection}"</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.initialState}>
                {recentList.length > 0 && (
                  <View style={styles.searchSectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="history" size={16} color={theme.colors.secondaryText} />
                        <Text style={styles.popularTitle}>Recent Searches</Text>
                      </View>
                      <TouchableOpacity
                        onPress={async () => {
                          await clearRecentSearches();
                          setRecentList([]);
                        }}
                      >
                        <Text style={styles.clearLink}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.popularPills}>
                      {recentList.map((item, idx) => (
                        <TouchableOpacity
                          key={`${item}-${idx}`}
                          style={[styles.popularPill, styles.recentPill]}
                          onPress={() => handleSearchSubmit(item)}
                        >
                          <MaterialCommunityIcons name="magnify" size={14} color="#555" style={{ marginRight: 4 }} />
                          <Text style={styles.popularPillText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.searchSectionBlock}>
                  <Text style={styles.popularTitle}>Popular Categories & Searches</Text>
                  <View style={styles.popularPills}>
                    {POPULAR_SEARCHES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.popularPill}
                        onPress={() => handleSearchSubmit(item)}
                      >
                        <Text style={styles.popularPillText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 8,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: 'none',
  },
  searchSubmitBtn: {
    width: 34,
    height: 34,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  locationSelectorRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationClearBtn: {
    padding: 2,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FAF5F2',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultsCount: {
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeSortPill: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortPillText: {
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: '500',
  },
  activeSortPillText: {
    color: '#FFFFFF',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
  },
  list: {
    padding: 6,
  },
  emptyContainer: {
    paddingHorizontal: 16,
  },
  typoBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  typoLabel: {
    fontSize: 14,
    color: theme.colors.secondaryText,
  },
  typoLink: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  popularBox: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  popularPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  popularPill: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  popularPillText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  fallbackButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  initialState: {
    padding: 16,
  },
  searchSectionBlock: {
    marginBottom: 20,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  clearLink: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
