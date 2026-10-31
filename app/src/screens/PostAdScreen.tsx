import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PostAdScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, selectedCity } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);

  // Dynamic field values
  const [dynamicAttrs, setDynamicAttrs] = useState<Record<string, any>>({});

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [locality, setLocality] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [showPhone, setShowPhone] = useState(true);

  // Photos
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const pickImage = async () => {
    if (images.length >= 8) {
      Alert.alert('Limit reached', 'You can upload up to 8 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photos permission to upload pictures');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImages([...images, res.assets[0].uri]);
    }
  };

  const handleSubmitAd = async () => {
    if (!title.trim() || !description.trim() || !locality.trim() || !phone.trim()) {
      Alert.alert('Missing fields', 'Please fill all mandatory fields');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', selectedCategory._id);
      if (selectedSubcategory) {
        formData.append('subcategory', selectedSubcategory._id);
      }
      formData.append('price', price || '0');
      formData.append('city', selectedCity);
      formData.append('locality', locality.trim());
      formData.append('contactName', contactName.trim());
      formData.append('phone', phone.trim());
      formData.append('showPhone', String(showPhone));
      formData.append('attributes', JSON.stringify(dynamicAttrs));

      images.forEach((uri, idx) => {
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('images', {
          uri,
          name: `upload_${idx}.${ext}`,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        } as any);
      });

      const res = await api.post('/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', res.data.message || 'Your ad has been posted!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.message || 'Could not post ad');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="lock-outline" size={48} color={theme.colors.secondaryText} />
        <Text style={styles.centerTitle}>Login Required to Post Ads</Text>
        <Text style={styles.centerSubtitle}>Please log in to start selling on Ulist</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>
          {step === 1 && 'Step 1: Choose Category'}
          {step === 2 && 'Step 2: Key Details'}
          {step === 3 && 'Step 3: Upload Photos'}
          {step === 4 && 'Step 4: Price & Contact'}
        </Text>
        <Text style={styles.stepProgress}>{step}/4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step 1: Category Picker */}
        {step === 1 && (
          <View>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat._id}
                style={styles.categoryRow}
                onPress={() => {
                  setSelectedCategory(cat);
                  setStep(2);
                }}
              >
                <MaterialCommunityIcons name={cat.icon || 'tag'} size={24} color={theme.colors.primary} />
                <Text style={styles.categoryName}>{cat.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.secondaryText} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Dynamic Category Attributes & Title */}
        {step === 2 && (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Title * (max 70 chars)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Honda Activa 6G 2021 single owner"
                maxLength={70}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, { height: 90 }]}
                placeholder="Include condition, reasons for selling, warranty, etc."
                multiline
                maxLength={4000}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Dynamic Attributes from Category Definition */}
            {selectedCategory?.fields?.map((field: any) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {field.label} {field.required && '*'}
                </Text>
                {field.type === 'select' ? (
                  <View style={styles.optionPills}>
                    {field.options?.map((opt: string) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.pill,
                          dynamicAttrs[field.key] === opt && styles.activePill,
                        ]}
                        onPress={() =>
                          setDynamicAttrs({ ...dynamicAttrs, [field.key]: opt })
                        }
                      >
                        <Text
                          style={[
                            styles.pillText,
                            dynamicAttrs[field.key] === opt && styles.activePillText,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder={`Enter ${field.label}`}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    value={dynamicAttrs[field.key] ? String(dynamicAttrs[field.key]) : ''}
                    onChangeText={(v) =>
                      setDynamicAttrs({ ...dynamicAttrs, [field.key]: v })
                    }
                  />
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (!title || !description) {
                  Alert.alert('Required', 'Please fill title and description');
                  return;
                }
                setStep(3);
              }}
            >
              <Text style={styles.nextButtonText}>Next: Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <View>
            <Text style={styles.label}>Upload Photos (Up to 8, first photo is cover)</Text>
            <View style={styles.photosGrid}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.deletePhoto}
                    onPress={() => setImages(images.filter((_, i) => i !== idx))}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 8 && (
                <TouchableOpacity style={styles.addPhotoBox} onPress={pickImage}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={32} color={theme.colors.primary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
              <Text style={styles.nextButtonText}>Next: Pricing & Contact</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Price & Locality */}
        {step === 4 && (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Set Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.colors.surface }]} value={selectedCity} editable={false} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Locality / Area *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Andheri West, Whitefield"
                value={locality}
                onChangeText={setLocality}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name *</Text>
              <TextInput style={styles.input} value={contactName} onChangeText={setContactName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setShowPhone(!showPhone)}
            >
              <MaterialCommunityIcons
                name={showPhone ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.toggleText}>Show my phone number on this ad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nextButton, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitAd}
              disabled={submitting}
            >
              <Text style={styles.nextButtonText}>
                {submitting ? 'Submitting Ad...' : 'Post Ad Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  centerTitle: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    marginTop: 12,
  },
  centerSubtitle: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  stepTitle: {
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
  },
  stepProgress: {
    fontSize: theme.typography.size.body,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.bold,
  },
  scroll: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryName: {
    flex: 1,
    marginLeft: 12,
    fontSize: theme.typography.size.body,
    fontWeight: theme.typography.weight.medium,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: theme.typography.size.caption,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: theme.typography.size.body,
    backgroundColor: theme.colors.background,
  },
  optionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  activePill: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: theme.typography.size.caption,
    color: theme.colors.text,
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 12,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 4,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  deletePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  addPhotoBox: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  addPhotoText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
    marginTop: 4,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: {
    marginLeft: 8,
    fontSize: theme.typography.size.body,
    color: theme.colors.text,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
});
