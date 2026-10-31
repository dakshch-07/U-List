import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { AdCard } from '../components/AdCard';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedCity } = useAuthStore();
  const [search, setSearch] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Suggestions
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

  const handleSearchSubmit = () => {
    setSubmittedQuery(search.trim());
  };

  const ads = resultsData?.items || [];

  return (
    <View style={styles.container}>
      {/* Header Search Box */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, brands, cars..."
          value={search}
          onChangeText={(txt) => {
            setSearch(txt);
            if (submittedQuery) setSubmittedQuery('');
          }}
          onSubmitEditing={handleSearchSubmit}
          autoFocus
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setSubmittedQuery(''); }}>
            <MaterialCommunityIcons name="close" size={20} color={theme.colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Instant Suggestions Dropdown if typing */}
      {!submittedQuery && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              style={styles.suggestionRow}
              onPress={() => {
                setSearch(item.title);
                setSubmittedQuery(item.title);
              }}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.secondaryText} />
              <Text style={styles.suggestionText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sort Options Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultsCount}>{ads.length} ads found</Text>
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[styles.sortButton, sort === 'newest' && styles.activeSortButton]}
            onPress={() => setSort('newest')}
          >
            <Text style={[styles.sortText, sort === 'newest' && styles.activeSortText]}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sort === 'price_asc' && styles.activeSortButton]}
            onPress={() => setSort('price_asc')}
          >
            <Text style={[styles.sortText, sort === 'price_asc' && styles.activeSortText]}>Price Low</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sort === 'price_desc' && styles.activeSortButton]}
            onPress={() => setSort('price_desc')}
          >
            <Text style={[styles.sortText, sort === 'price_desc' && styles.activeSortText]}>Price High</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ads Results */}
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
          !isFetching ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results match your search.</Text>
            </View>
          ) : (
            <View />
          )
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    marginLeft: 10,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resultsCount: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  activeSortButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortText: {
    fontSize: 12,
    color: theme.colors.secondaryText,
  },
  activeSortText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  list: {
    padding: 6,
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
