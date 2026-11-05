import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { storage } from '../utils/storage';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    if (cleanPhone.length < 10) {
      const msg = `Please enter a valid 10-digit number (Entered: ${cleanPhone.length})`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Incomplete Number', msg);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone: cleanPhone });
      const receivedOtp = res.data.data?.otpPreview || '1234';
      setOtpHint(receivedOtp);
      setStep('otp');

      const infoMsg = `OTP sent! Demo code is: ${receivedOtp} (or use 1234)`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(infoMsg);
      } else {
        Alert.alert('OTP Dispatched', infoMsg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      const msg = 'Please enter the 4-digit OTP';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Required', msg);
      }
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const res = await api.post('/auth/verify-otp', {
        phone: cleanPhone,
        otp: cleanOtp,
        name: name.trim() || undefined,
      });

      const { user, accessToken, refreshToken } = res.data.data;

      try {
        await storage.setItem('ulist_access_token', accessToken);
        await storage.setItem('ulist_refresh_token', refreshToken);
        await storage.setItem('ulist_cached_user', JSON.stringify(user));
      } catch (e) {}

      setUser(user);

      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Login Successful! Welcome to Ulist.');
      } else {
        Alert.alert('Success', 'Welcome to Ulist!');
      }

      navigation.goBack();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP. Please use 1234.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(errMsg);
      } else {
        Alert.alert('Verification Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Outer Card with Elevation & Rounded border */}
      <View style={styles.authCard}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandSubtitle}>
            {step === 'phone'
              ? 'Enter your phone number to sign in or register'
              : `Enter 4-digit code sent to +91 ${phone}`}
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name <Text style={styles.optionalText}>(Optional)</Text></Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeFlag}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
            </View>

            {/* Continue with OTP Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.8 }]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitText}>Continue with OTP</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.secureNoticeRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#16A34A" />
              <Text style={styles.secureNoticeText}>100% Safe & Secure verification</Text>
            </View>

            <Text style={styles.termsNotice}>
              By continuing, you confirm that you agree with Ulist's{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </>
        ) : (
          <>
            {otpHint && (
              <View style={styles.demoBadge}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.demoBadgeText}>
                  Test OTP: <Text style={styles.boldText}>{otpHint}</Text> (or use 1234)
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter 4-digit OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • •"
                placeholderTextColor="#D1D5DB"
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.8 }]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitText}>Verify & Login</Text>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setStep('phone');
                setOtp('');
                setOtpHint(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#D9480F" style={{ marginRight: 4 }} />
              <Text style={styles.switchText}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 150,
    height: 56,
    marginBottom: 10,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 7,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },
  requiredAsterisk: {
    color: '#DC2626',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    height: '100%',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    height: 48,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
  },
  countryCodeFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 15.5,
    color: '#0F172A',
    fontWeight: '600',
    letterSpacing: 0.5,
    height: '100%',
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 54,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 14,
    color: '#D9480F',
  },
  submitButton: {
    backgroundColor: '#D9480F',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#D9480F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secureNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secureNoticeText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginLeft: 5,
  },
  switchButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: '#D9480F',
    fontSize: 14,
    fontWeight: '700',
  },
  demoBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 18,
    alignItems: 'center',
  },
  demoBadgeText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  termsNotice: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 17,
  },
  termsLink: {
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});