import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  // Send OTP
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: cleanPhone });
      if (res.data.data?.otpPreview) {
        setOtpHint(res.data.data.otpPreview);
      }
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 4) {
      Alert.alert('Required', 'Please enter the 4-digit OTP sent to your phone');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phone: phone.replace(/[^0-9]/g, ''),
        otp: otp.trim(),
        name: name.trim() || undefined,
      });

      const { user, accessToken, refreshToken } = res.data.data;

      await SecureStore.setItemAsync('ulist_access_token', accessToken);
      await SecureStore.setItemAsync('ulist_refresh_token', refreshToken);
      setUser(user);

      Alert.alert('Success', 'Welcome to Ulist!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.brandBox}>
        <Text style={styles.brandTitle}>Ulist</Text>
        <Text style={styles.brandSubtitle}>
          {step === 'phone'
            ? 'Enter your phone number to sign in or register'
            : `Enter 4-digit code sent to +91 ${phone}`}
        </Text>
      </View>

      {step === 'phone' ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Continue with OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsNotice}>
            By continuing, you confirm that you agree with Ulist's Terms and Conditions and Privacy Policy.
          </Text>
        </>
      ) : (
        <>
          {otpHint && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>
                Demo / Test OTP: <Text style={styles.boldText}>{otpHint}</Text> (or use 1234)
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter 4-digit OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="••••"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setStep('phone');
              setOtp('');
              setOtpHint(null);
            }}
          >
            <Text style={styles.switchText}>Change phone number</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: theme.typography.size.title,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderBottomLeftRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: theme.typography.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopRightRadius: theme.borderRadius.sm,
    borderBottomRightRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  otpInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 10,
    color: theme.colors.primary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  switchText: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
  },
  demoBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 16,
    alignItems: 'center',
  },
  demoBadgeText: {
    fontSize: 13,
    color: '#92400E',
  },
  boldText: {
    fontWeight: '700',
  },
  termsNotice: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});