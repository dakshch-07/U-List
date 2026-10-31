import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, Platform, BackHandler } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PostAdScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, selectedCity } = useAuthStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);

  // Dynamic field values
  const [dynamicAttrs, setDynamicAttrs] = useState<Record<string, any>>({});

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [adCity, setAdCity] = useState(
    selectedCity && selectedCity !== 'India' && selectedCity !== 'All India' ? selectedCity : 'Mumbai'
  );
  const [locality, setLocality] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [showPhone, setShowPhone] = useState(true);

  // Photos
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Sync city & contact if user changes
  React.useEffect(() => {
    if (user?.name && !contactName) setContactName(user.name);
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user]);

  React.useEffect(() => {
    if (selectedCity && selectedCity !== 'India' && selectedCity !== 'All India') {
      setAdCity(selectedCity);
    }
  }, [selectedCity]);

  // Safe local storage helpers for Web & Mobile
  const clearDraft = async () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ulist_ad_draft');
      }
      await SecureStore.deleteItemAsync('ulist_ad_draft');
    } catch {}
  };

  // Auto-restore draft from local storage if session expired or page reloaded
  React.useEffect(() => {
    (async () => {
      try {
        let savedDraft = '';
        if (typeof localStorage !== 'undefined') {
          savedDraft = localStorage.getItem('ulist_ad_draft') || '';
        }
        if (!savedDraft) {
          savedDraft = (await SecureStore.getItemAsync('ulist_ad_draft')) || '';
        }
        if (savedDraft) {
          const d = JSON.parse(savedDraft);
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
          if (d.price) setPrice(d.price);
          if (d.locality) setLocality(d.locality);
          if (d.dynamicAttrs) setDynamicAttrs(d.dynamicAttrs);
        }
      } catch {}
    })();
  }, []);

  // Auto-save draft on every detail update
  React.useEffect(() => {
    if (title || description || price || locality) {
      const draftStr = JSON.stringify({ title, description, price, locality, dynamicAttrs });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ulist_ad_draft', draftStr);
      }
      SecureStore.setItemAsync('ulist_ad_draft', draftStr).catch(() => {});
    }
  }, [title, description, price, locality, dynamicAttrs]);

  // Handle Step-by-Step Back Navigation
  const handleStepBack = () => {
    if (step > 1) {
      setStep((prev) => ((prev - 1) as 1 | 2 | 3 | 4));
      return true;
    }
    // If on Step 1, go back in app navigation or home
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeTab');
    }
    return true;
  };

  // Hardware Back Button (Android) & Browser Back Navigation handling
  useEffect(() => {
    const backAction = () => {
      if (step > 1) {
        setStep((prev) => ((prev - 1) as 1 | 2 | 3 | 4));
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Browser popstate hook for Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = () => {
        if (step > 1) {
          setStep((prev) => ((prev - 1) as 1 | 2 | 3 | 4));
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        backHandler.remove();
        window.removeEventListener('popstate', handlePopState);
      };
    }

    return () => backHandler.remove();
  }, [step]);

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
      const msg = 'Please fill all mandatory fields (Title, Description, Locality, Phone)';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(msg);
      } else {
        Alert.alert('Missing fields', msg);
      }
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
      // Ad physical location must be a valid Indian city
      const postCity = (adCity && adCity !== 'India' && adCity !== 'All India') ? adCity.trim() : 'Mumbai';
      formData.append('city', postCity);
      formData.append('locality', locality.trim());
      formData.append('contactName', contactName.trim() || user?.name || 'Seller');
      formData.append('phone', phone.trim());
      formData.append('showPhone', String(showPhone));
      formData.append('attributes', JSON.stringify(dynamicAttrs));

      // Handle image binary conversions cross-platform (web Blob vs mobile asset)
      for (let idx = 0; idx < images.length; idx++) {
        const uri = images[idx];
        const ext = uri.split('.').pop() || 'jpg';
        const mime = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        const filename = `photo_${idx}_${Date.now()}.${ext}`;

        if (Platform.OS === 'web') {
          try {
            const resp = await fetch(uri);
            const blob = await resp.blob();
            formData.append('images', blob, filename);
          } catch {
            // Fallback
            formData.append('images', { uri, name: filename, type: mime } as any);
          }
        } else {
          formData.append('images', {
            uri,
            name: filename,
            type: mime,
          } as any);
        }
      }

      await api.post('/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Clear draft upon successful post
      await clearDraft();

      // Invalidate queries so admin queues & listings update
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['myAds'] });

      // Show beautiful dedicated approval notice modal like OLX
      setIsSuccessModalVisible(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Could not post ad. Please try again.';
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Submission Error: ${errMsg}`);
      } else {
        Alert.alert('Submission Error', errMsg);
      }
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
      {/* Step Indicator with Back Navigation Button */}
      <View style={styles.stepHeader}>
        <View style={styles.stepLeftContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleStepBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>
            {step === 1 && 'Step 1: Choose Category'}
            {step === 2 && 'Step 2: Key Details'}
            {step === 3 && 'Step 3: Upload Photos'}
            {step === 4 && 'Step 4: Price & Contact'}
          </Text>
        </View>
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setStep(1)}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.text} />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextButton, { flex: 1, marginTop: 0, marginLeft: 12 }]}
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setStep(2)}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.text} />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextButton, { flex: 1, marginTop: 0, marginLeft: 12 }]}
                onPress={() => setStep(4)}
              >
                <Text style={styles.nextButtonText}>Next: Price & Details</Text>
              </TouchableOpacity>
            </View>
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
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city (e.g. Mumbai, Delhi, Bengaluru)"
                value={adCity}
                onChangeText={setAdCity}
              />
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

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setStep(3)}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.text} />
                <Text style={styles.backStepButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextButton, { flex: 1, marginTop: 0, marginLeft: 12 }, submitting && { opacity: 0.6 }]}
                onPress={handleSubmitAd}
                disabled={submitting}
              >
                <Text style={styles.nextButtonText}>
                  {submitting ? 'Submitting Ad...' : 'Post Ad Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* OLX-Style Success & Moderation Status Modal */}
      {isSuccessModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <MaterialCommunityIcons name="clock-check-outline" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.modalHeading}>Ad Submitted Successfully!</Text>
            <Text style={styles.modalSubheading}>
              Your listing will be verified and approved by the Ulist Moderation Team within 2 to 3 hours.
            </Text>

            <View style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalInfoText}>Ensures safe & verified buyers & sellers</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.modalInfoText}>Live on app immediately upon admin approval</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                setStep(1);
                setTitle('');
                setDescription('');
                setPrice('');
                setImages([]);
                navigation.navigate('MyAdsTab');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Go to My Ads</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                setStep(1);
                setTitle('');
                setDescription('');
                setPrice('');
                setImages([]);
                navigation.navigate('HomeTab');
              }}
            >
              <Text style={styles.modalSecondaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  stepLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    borderRadius: 20,
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backStepButtonText: {
    marginLeft: 4,
    color: theme.colors.text,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.body,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalSuccessIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E8E3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: theme.typography.size.subheading,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubheading: {
    fontSize: theme.typography.size.body,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInfoBox: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  modalInfoText: {
    marginLeft: 10,
    fontSize: 12,
    color: theme.colors.text,
    flex: 1,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.body,
  },
  modalSecondaryBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    color: theme.colors.secondaryText,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.body,
  },
});
