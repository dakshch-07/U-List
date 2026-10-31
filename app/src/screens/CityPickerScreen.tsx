import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CityPickerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { setCity, selectedCity } = useAuthStore();
  const [search, setSearch] = useState('');
  const [locating, setLocating] = useState(false);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities');
      return res.data.data;
    },
  });

  const handleSelectCity = (name: string) => {
    setCity(name);
    navigation.goBack();
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      // Pick nearest Indian city from list by distance
      if (cities.length > 0) {
        let nearest = cities[0];
        let minDistance = Infinity;

        cities.forEach((c: any) => {
          if (c.lat && c.lng) {
            const dist = Math.hypot(c.lat - loc.coords.latitude, c.lng - loc.coords.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearest = c;
            }
          }
        });

        handleSelectCity(nearest.name);
      }
    } catch (e) {
      alert('Could not determine current location');
    } finally {
      setLocating(false);
    }
  };

  const filteredCities = cities.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.secondaryText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search city or state..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.colors.secondaryText}
        />
      </View>

      {/* GPS Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleUseCurrentLocation}
        disabled={locating}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={22} color={theme.colors.primary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.locationTitle}>Use current location</Text>
          <Text style={styles.locationSubtitle}>
            {locating ? 'Finding nearest city...' : 'Auto-detect your location'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Popular Cities in India</Text>

      <FlatList
        data={filteredCities}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityRow}
            onPress={() => handleSelectCity(item.name)}
          >
            <View>
              <Text style={[styles.cityName, selectedCity === item.name && styles.selectedText]}>
                {item.name}
              </Text>
              <Text style={styles.stateName}>{item.state}</Text>
            </View>
            {selectedCity === item.name && (
              <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationTitle: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  locationSubtitle: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.secondaryText,
    textTransform: 'uppercase',
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cityName: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  stateName: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },
});
