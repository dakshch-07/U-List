import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LocationPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenCityPicker: () => void;
}

export const LocationPromptModal: React.FC<LocationPromptModalProps> = ({
  visible,
  onClose,
  onOpenCityPicker,
}) => {
  const { setCity } = useAuthStore();
  const [locating, setLocating] = useState(false);

  if (!visible) return null;

  const handleFindMyLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission in your device settings or choose "Other location" below.',
          [
            { text: 'Choose Other', onPress: onOpenCityPicker },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: (Location as any)?.Accuracy?.Balanced || (Location as any)?.Accuracy?.Low || 3,
      });

      // Find nearest Indian city from backend list
      const res = await api.get('/cities');
      const cities = res.data.data || [];
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
        await setCity(nearest.name);
        await storage.setItem('ulist_location_modal_done', 'true');
        onClose();
      } else {
        await setCity('Mumbai');
        await storage.setItem('ulist_location_modal_done', 'true');
        onClose();
      }
    } catch {
      // Fallback
      Alert.alert('Notice', 'Could not detect GPS location automatically. Please select your city manually.', [
        { text: 'Select City', onPress: onOpenCityPicker },
      ]);
    } finally {
      setLocating(false);
    }
  };

  const handleOtherLocation = async () => {
    await storage.setItem('ulist_location_modal_done', 'true');
    onClose();
    onOpenCityPicker();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Subtle Close '✕' Button at top right if user wants to browse right away */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        {/* 3-Ring Radar Circle with Location Pin */}
        <View style={styles.radarOuterRing}>
          <View style={styles.radarMiddleRing}>
            <View style={styles.radarInnerCircle}>
              {/* Google Maps / OLX Style Location Pin */}
              <View style={styles.pinWrapper}>
                <MaterialCommunityIcons name="map-marker" size={72} color="#1D4ED8" />
                <View style={styles.pinCenterDot} />
              </View>
            </View>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Where is your location?</Text>

        {/* Subtitle */}
        <Text style={styles.subheading}>
          Enjoy a personalized selling and buying experience by telling us your location.
        </Text>

        {/* Primary Blue Button: Find My Location */}
        <TouchableOpacity
          style={styles.findButton}
          activeOpacity={0.88}
          onPress={handleFindMyLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.btnContentRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.findButtonText}>Find My Location</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Secondary Link: Other location */}
        <TouchableOpacity
          style={styles.otherLocationButton}
          activeOpacity={0.7}
          onPress={handleOtherLocation}
        >
          <Text style={styles.otherLocationText}>Other location</Text>
          <View style={styles.underline} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 8,
    zIndex: 10,
  },
  radarOuterRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(219, 234, 254, 0.45)', // very light blue ring
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 42,
  },
  radarMiddleRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(191, 219, 254, 0.65)', // middle blue ring
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInnerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(147, 197, 253, 0.75)', // inner circular core
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  pinCenterDot: {
    position: 'absolute',
    top: 19,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FBBF24', // Yellow inner dot matching user image
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 44,
  },
  findButton: {
    width: '100%',
    height: 50,
    borderRadius: 6,
    backgroundColor: '#00479A', // Deep authentic blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#00479A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  otherLocationButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  otherLocationText: {
    color: '#00479A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  underline: {
    width: '100%',
    height: 2,
    backgroundColor: '#00479A',
    borderRadius: 1,
  },
});
