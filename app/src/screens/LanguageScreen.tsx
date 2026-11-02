import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { LanguageCode } from '../utils/translations';

export const LanguageScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, setLanguage } = useAuthStore();
  const [selected, setSelected] = useState<LanguageCode>(language);

  const handleSave = async () => {
    await setLanguage(selected);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Options List */}
      <View style={styles.list}>
        {/* English */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setSelected('en')}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, selected === 'en' && styles.optionTextActive]}>
            English
          </Text>
          {selected === 'en' && (
            <MaterialCommunityIcons name="check" size={24} color="#0B4F9C" />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Hindi */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => setSelected('hi')}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, selected === 'hi' && styles.optionTextActive]}>
            हिंदी
          </Text>
          {selected === 'hi' && (
            <MaterialCommunityIcons name="check" size={24} color="#0B4F9C" />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />
      </View>

      {/* Continue Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {selected === 'hi' ? 'आगे बढ़ें / CONTINUE' : 'आगे बढ़ें / CONTINUE'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  optionText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  optionTextActive: {
    fontWeight: '600',
    color: '#0B4F9C',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  continueButton: {
    backgroundColor: '#004B91',
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
