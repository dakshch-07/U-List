import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image, Dimensions, Platform } from 'react-native';
import { storage } from '../utils/storage';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { setUser, language, setLanguage } = useAuthStore();

  const [step, setStep] = useState<'welcome' | 'phone' | 'otp'>('welcome');
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
      setStep('otp');

      const infoMsg = `OTP sent successfully to +91 ${cleanPhone}. Please check your SMS.`;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(infoMsg);
      } else {
        Alert.alert('OTP Sent', infoMsg);
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

  const handleStepBack = () => {
    if (step === 'otp') {
      setStep('phone');
    } else if (step === 'phone') {
      setStep('welcome');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Action Bar: Close '✕' on Left, 'Help' on Right */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={handleStepBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons
            name={step === 'welcome' ? 'close' : 'arrow-left'}
            size={26}
            color="#0F172A"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => navigation.navigate('ContactUs')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialCommunityIcons name="help-circle-outline" size={20} color="#0F172A" style={{ marginRight: 4 }} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Upper White Section: Centered Brand Logo & Tagline */}
        <View style={styles.logoHeroSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.bigHeroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTagline}>India's Fastest Growing Marketplace</Text>
        </View>

        {/* Lower Warm Orange / White Bottom Sheet Banner (OLX India reference structure crafted for Ulist) */}
        {step === 'welcome' && (
          <View style={styles.bottomHeroBanner}>
            {/* Language Switch Prompt */}
            <TouchableOpacity
              style={styles.languageToggleBtn}
              onPress={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              activeOpacity={0.8}
            >
              <Text style={styles.languageToggleText}>
                {language === 'hi' ? 'Browse in English' : 'हिंदी में ब्राउज़ करें'}
              </Text>
              <View style={styles.languageUnderline} />
            </TouchableOpacity>

            {/* Primary Action Button: White Card Button "Continue with Phone" */}
            <TouchableOpacity
              style={styles.whiteContinueBtn}
              activeOpacity={0.92}
              onPress={() => setStep('phone')}
            >
              <View style={styles.phoneIconWrap}>
                <MaterialCommunityIcons name="cellphone" size={22} color="#D9480F" />
              </View>
              <Text style={styles.whiteContinueBtnText}>Continue with Phone</Text>
            </TouchableOpacity>

            <View style={styles.orDividerRow}>
              <View style={styles.orDividerLine} />
              <Text style={styles.orDividerText}>OR</Text>
              <View style={styles.orDividerLine} />
            </View>

            {/* Secondary Option: Direct Form Entry */}
            <TouchableOpacity
              style={styles.ghostActionBtn}
              onPress={() => setStep('phone')}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostActionBtnText}>Sign In / Register with OTP</Text>
            </TouchableOpacity>

            <Text style={styles.legalDisclaimer}>
              If you continue, you are accepting{'\n'}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('TermsOfService')}
              >
                Ulist Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        )}

        {/* Step: Phone & Name Input */}
        {step === 'phone' && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Enter Your Details</Text>
            <Text style={styles.formCardSubtitle}>We will send a 4-digit verification code to your number.</Text>

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

            {/* Orange Continue Button */}
            <TouchableOpacity
              style={[styles.orangeSubmitBtn, loading && { opacity: 0.8 }]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.orangeSubmitBtnText}>Continue with OTP</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.secureNoticeRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#16A34A" />
              <Text style={styles.secureNoticeText}>100% Safe & Instant OTP verification</Text>
            </View>
          </View>
        )}

        {/* Step: OTP Verification */}
        {step === 'otp' && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Verify OTP</Text>
            <Text style={styles.formCardSubtitle}>Enter 4-digit code sent to +91 {phone}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter 4-digit OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder=""
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.orangeSubmitBtn, loading && { opacity: 0.8 }]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.orangeSubmitBtnText}>Verify & Login</Text>
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
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 10 : 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 10,
  },
  topIconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'web' ? 12 : 8,
  },
  logoHeroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  bigHeroLogo: {
    width: 170,
    height: 60,
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  // Bottom Hero Banner (Ulist Signature Orange with White Card Button)
  bottomHeroBanner: {
    backgroundColor: '#D9480F', // Ulist Brand Vibrant Orange
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  languageToggleBtn: {
    alignItems: 'center',
    marginBottom: 20,
  },
  languageToggleText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  languageUnderline: {
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  whiteContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 16,
  },
  phoneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  whiteContinueBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginVertical: 10,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  orDividerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  ghostActionBtn: {
    paddingVertical: 8,
    marginBottom: 18,
  },
  ghostActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalDisclaimer: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Form Cards
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  formCardSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  optionalText: {
    fontSize: 11,
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
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 14,
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
    height: 44,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    height: '100%',
    borderRightWidth: 1.5,
    borderRightColor: '#E2E8F0',
  },
  countryCodeFlag: {
    fontSize: 15,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    letterSpacing: 0.5,
    height: '100%',
  },
  orangeSubmitBtn: {
    backgroundColor: '#D9480F',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
  orangeSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secureNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secureNoticeText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginLeft: 5,
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
});