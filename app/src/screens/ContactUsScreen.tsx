import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { api } from '../services/api';

export const ContactUsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !mobile.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      const msg = 'Please fill all fields marked with *';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Required Fields', msg);
      }
      return;
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Mobile', msg);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/contact', {
        type: 'general',
        fullName: fullName.trim(),
        mobile: cleanMobile,
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSubmitted(true);
      const successMsg = res.data?.message || 'Inquiry submitted successfully!';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(successMsg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to submit inquiry. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(errMsg);
      } else {
        Alert.alert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Banner Title */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>WE ARE HERE TO HELP YOU</Text>
          <Text style={styles.headerSubtitle}>
            Have a question, feedback, or need assistance? Reach out directly to our team.
          </Text>
        </View>

        {/* Success Confirmation Card */}
        {submitted ? (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <MaterialCommunityIcons name="check-circle" size={48} color="#1E8E3E" />
            </View>
            <Text style={styles.successTitle}>Inquiry Sent!</Text>
            <Text style={styles.successDesc}>
              Thank you for contacting Ulist. Your inquiry has been routed to our support team. We will reach out to you within 24 hours.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setSubmitted(false);
                setSubject('');
                setMessage('');
                navigation.goBack();
              }}
            >
              <Text style={styles.doneBtnText}>Return to App</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Contact Form Card */
          <View style={styles.formCard}>
            <View style={styles.assistBanner}>
              <Text style={styles.assistHeading}>How we can assist you?</Text>
              <Text style={styles.assistDesc}>
                If you have any issues, feedback, or simply want to clarify something about listings on Ulist, let us know.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={theme.colors.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                placeholderTextColor={theme.colors.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={theme.colors.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Question about listing verification, report, account"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor={theme.colors.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Describe your issue or feedback in detail..."
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                placeholderTextColor={theme.colors.secondaryText}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendBtnText}>SEND</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B1B1B',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginTop: 3,
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#00875A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  activeTabText: {
    color: '#00875A',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  assistBanner: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assistHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  assistDesc: {
    fontSize: 11.5,
    color: '#6B6B6B',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 3,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 13.5,
    color: '#1B1B1B',
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
  },
  sendBtn: {
    backgroundColor: '#0084D4',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  supportFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#616161',
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
  },
  successIconBox: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
