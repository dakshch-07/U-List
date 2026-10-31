import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { setUser } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }

    if (isRegister && (!name.trim() || !phone.trim())) {
      Alert.alert('Required', 'Please enter your full name and phone number');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), phone: phone.trim(), password }
        : { email: email.trim(), password };

      const res = await api.post(endpoint, payload);
      const { user, accessToken, refreshToken } = res.data.data;

      await SecureStore.setItemAsync('ulist_access_token', accessToken);
      await SecureStore.setItemAsync('ulist_refresh_token', refreshToken);
      setUser(user);

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Authentication failed', err.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.brandBox}>
        <Text style={styles.brandTitle}>Ulist</Text>
        <Text style={styles.brandSubtitle}>
          {isRegister ? 'Create an account to start selling & chatting' : 'Welcome back! Sign in to continue'}
        </Text>
      </View>

      {isRegister && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChangeText={setName}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. rahul@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {isRegister && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +91 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && { opacity: 0.6 }]}
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsRegister(!isRegister)}
      >
        <Text style={styles.switchText}>
          {isRegister
            ? 'Already have an account? Sign In'
            : "Don't have an account? Register now"}
        </Text>
      </TouchableOpacity>
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
  },
  brandSubtitle: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.bold,
    marginBottom: 6,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.size.body,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  switchButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    color: theme.colors.secondaryText,
    fontSize: theme.typography.size.body,
  },
});
