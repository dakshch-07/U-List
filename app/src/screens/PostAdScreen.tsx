import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, Platform, BackHandler } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../utils/storage';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initiateRazorpayPayment } from '../services/paymentService';
import { getFullImageUrl } from '../utils/formatters';

// Realistic 3D Indian product images matching OLX India style
const CATEGORY_IMAGES: Record<string, any> = {
  cars: require('../../assets/categories/cars.jpg'),
  properties: require('../../assets/categories/properties.jpg'),
  mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
  jobs: require('../../assets/categories/jobs.jpg'),
  bikes: require('../../assets/categories/bikes.jpg'),
  electronics: require('../../assets/categories/electronics.jpg'),
  'commercial-vehicles': require('../../assets/categories/commercial-vehicles.jpg'),
  furniture: require('../../assets/categories/furniture.jpg'),
  fashion: require('../../assets/categories/fashion.jpg'),
  'books-sports': require('../../assets/categories/books-sports.jpg'),
  pets: require('../../assets/categories/pets.jpg'),
  services: require('../../assets/categories/services.jpg'),
};

// Category fallback icons with brand colors
const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  cars: { icon: 'car-side', color: '#EF4444' },
  properties: { icon: 'office-building', color: '#10B981' },
  mobiles: { icon: 'cellphone', color: '#3B82F6' },
  jobs: { icon: 'briefcase', color: '#D97706' },
  bikes: { icon: 'motorbike', color: '#6366F1' },
  electronics: { icon: 'television-classic', color: '#8B5CF6' },
  'commercial-vehicles': { icon: 'truck', color: '#F59E0B' },
  furniture: { icon: 'sofa', color: '#92400E' },
  fashion: { icon: 'tshirt-crew', color: '#EC4899' },
  'books-sports': { icon: 'guitar-acoustic', color: '#F97316' },
  pets: { icon: 'dog', color: '#A855F7' },
  services: { icon: 'wrench', color: '#64748B' },
};

export const PostAdScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { user, selectedCity } = useAuthStore();
  const queryClient = useQueryClient();
  const editingAd = route?.params?.editAd || null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(editingAd ? 2 : 1);
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
  const [createdAdData, setCreatedAdData] = useState<any>(null);
  const [selectedHighlightPlan, setSelectedHighlightPlan] = useState<'30_days' | '15_days'>('30_days');

  // Pre-fill fields if in Edit mode, or ensure fresh blank slate if posting new ad
  useEffect(() => {
    if (editingAd) {
      setTitle(editingAd.title || '');
      setDescription(editingAd.description || '');
      setPrice(editingAd.price ? String(editingAd.price) : '');
      setAdCity(editingAd.city || 'Mumbai');
      setLocality(editingAd.locality || '');
      setContactName(editingAd.contactName || user?.name || '');
      setPhone(editingAd.phone || user?.phone || '');
      if (editingAd.attributes) setDynamicAttrs(editingAd.attributes);
      if (editingAd.images && Array.isArray(editingAd.images)) {
        setImages(
          editingAd.images
            .map((img: any) => {
              if (typeof img === 'string') return getFullImageUrl(img);
              if (img && typeof img.url === 'string') return getFullImageUrl(img.url);
              return null;
            })
            .filter(Boolean) as string[]
        );
      }
      setStep(2);
    } else {
      // User tapped Sell to create a new ad: start cleanly from Step 1
      setStep(1);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setLocality('');
      setDynamicAttrs({});
      setImages([]);
      clearDraft();
    }
  }, [editingAd]);

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

  // Safe storage helpers for Web & Mobile
  const clearDraft = async () => {
    try {
      await storage.deleteItem('ulist_ad_draft');
    } catch {}
  };

  // Auto-restore draft from storage if session expired or page reloaded (ONLY if not editing an ad)
  React.useEffect(() => {
    if (editingAd) return;
    (async () => {
      try {
        const savedDraft = await storage.getItem('ulist_ad_draft');
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
  }, [editingAd]);

  // Auto-save draft on every detail update (ONLY if not editing an ad)
  React.useEffect(() => {
    if (editingAd) return;
    if (title || description || price || locality) {
      const draftStr = JSON.stringify({ title, description, price, locality, dynamicAttrs });
      storage.setItem('ulist_ad_draft', draftStr).catch(() => {});
    }
  }, [editingAd, title, description, price, locality, dynamicAttrs]);

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

  const { data: myAds = [] } = useQuery({
    queryKey: ['myAds'],
    queryFn: async () => {
      const res = await api.get('/ads/mine');
      return res.data.data;
    },
    enabled: !!user,
  });

  // Count all ads posted in current 30-day window (Active, Pending, Sold, Rejected, Deleted) towards the 5 ads limit
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeMyAdsCount = myAds.filter((a: any) => {
    const createdTime = new Date(a.createdAt).getTime();
    return createdTime >= thirtyDaysAgo;
  }).length;

  const pickImage = async () => {
    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Limit reached: You can upload up to 8 photos');
      } else {
        Alert.alert('Limit reached', 'You can upload up to 8 photos');
      }
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Permission required: Please grant photos permission to upload pictures');
      } else {
        Alert.alert('Permission required', 'Please grant photos permission to upload pictures');
      }
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.6,
      allowsEditing: false,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newUris = res.assets.map((asset) => asset.uri);
      // Combine and cap at 8 images
      setImages((prev) => [...prev, ...newUris].slice(0, 8));
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
      // Check token prior to submission
      const token = await storage.getItem('ulist_access_token');
      if (!token) {
        const msg = 'Session expired or not logged in. Please sign in to submit your ad.';
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(msg);
        } else {
          Alert.alert('Login Required', msg);
        }
        navigation.navigate('Login');
        return;
      }

      const authHeader = { Authorization: `Bearer ${token}` };

      // Handle Edit Ad flow
      if (editingAd?._id) {
        await api.put(`/ads/${editingAd._id}`, {
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          city: (adCity && adCity !== 'India' && adCity !== 'All India') ? adCity.trim() : 'Mumbai',
          locality: locality.trim(),
          contactName: contactName.trim() || user?.name || 'Seller',
          phone: phone.trim(),
          showPhone,
          attributes: dynamicAttrs,
          status: 'active', // Retain active status or directly active upon edit
        }, {
          headers: authHeader,
        });

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Ad updated successfully!');
        } else {
          Alert.alert('Updated', 'Ad updated successfully!');
        }
        await clearDraft();
        queryClient.invalidateQueries({ queryKey: ['ads'] });
        queryClient.invalidateQueries({ queryKey: ['myAds'] });
        navigation.navigate('MyAdsTab', { tab: 'active' });
        return;
      }

      // New Ad flow
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (selectedCategory?._id) {
        formData.append('category', selectedCategory._id);
      }
      if (selectedSubcategory?._id) {
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

      // Fast client-side image compression & conversion for instant uploads
      for (let idx = 0; idx < images.length; idx++) {
        const uri = images[idx];
        const filename = `photo_${idx}_${Date.now()}.jpg`;

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          try {
            // Compress in browser canvas before network upload to reduce payload from ~5MB to ~150KB
            const compressedBlob = await new Promise<Blob>((resolve, reject) => {
              const img = document.createElement('img');
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const maxDim = 1200;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  canvas.toBlob(
                    (blob) => {
                      if (blob) resolve(blob);
                      else reject(new Error('Canvas toBlob failed'));
                    },
                    'image/jpeg',
                    0.75
                  );
                } else {
                  reject(new Error('Canvas context null'));
                }
              };
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = uri;
            });
            formData.append('images', compressedBlob, filename);
          } catch {
            // Fallback to direct fetch blob
            const resp = await fetch(uri);
            const blob = await resp.blob();
            formData.append('images', blob, filename);
          }
        } else {
          formData.append('images', {
            uri,
            name: filename,
            type: 'image/jpeg',
          } as any);
        }
      }

      const res = await api.post('/ads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeader,
        },
        timeout: 180000, // 3 minutes specifically for multi-photo uploads
      });

      // Clear draft upon successful post
      await clearDraft();

      // Invalidate queries so admin queues & listings update
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['myAds'] });

      // Store created ad data and show Highlight screen
      setCreatedAdData(res.data?.data || null);
      setIsSuccessModalVisible(true);
    } catch (err: any) {
      if (err.response?.status === 402 || err.response?.data?.requiresPayment) {
        // Free quota of 5 ads exceeded -> Prompt to pay ₹29 for 6th ad onwards
        Alert.alert(
          '5 Free Ads Limit Reached',
          'You have posted 5 free ads. Additional listings are ₹29 per ad. Proceed to pay via Razorpay to post this ad?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay ₹29 Now',
              onPress: () => {
                initiateRazorpayPayment({
                  type: 'extra_ad',
                  userName: user?.name,
                  userEmail: user?.email,
                  userPhone: user?.phone,
                  onSuccess: async () => {
                    Alert.alert('Payment Successful!', '₹29 received. Your extra ad credit has been added. Submitting your ad now...');
                    queryClient.invalidateQueries({ queryKey: ['myAds'] });
                    // Automatically re-trigger ad submission now that credit is purchased
                    handleSubmitAd();
                  },
                  onFailure: (pErr) => {
                    if (pErr?.message !== 'Payment cancelled by user') {
                      Alert.alert('Payment Incomplete', pErr?.message || 'Could not complete payment.');
                    }
                  },
                });
              },
            },
          ]
        );
        return;
      }

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
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.stepTitle}>
            {step === 1 && 'Categories'}
            {step === 2 && 'Step 2: Price & Details'}
            {step === 3 && 'Step 3: Upload Photos'}
            {step === 4 && 'Step 4: Location & Contact'}
          </Text>
        </View>
        <Text style={styles.stepProgress}>{step}/4</Text>
      </View>

      <ScrollView contentContainerStyle={step === 1 ? styles.categoriesScroll : styles.scroll}>
        {/* Step 1: Clean 2-Column Grid Category Picker (OLX Style with realistic 3D image + name) */}
        {step === 1 && (
          <View style={styles.categoriesGrid}>
            {categories.map((cat: any) => {
              const imgSource = CATEGORY_IMAGES[cat.slug];
              const iconMeta = CATEGORY_ICONS[cat.slug] || { icon: 'tag-outline', color: '#D9480F' };
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.categoryCard}
                  activeOpacity={0.82}
                  onPress={() => {
                    // When choosing a category for a fresh ad, reset previous ad values
                    if (!editingAd) {
                      setTitle('');
                      setDescription('');
                      setPrice('');
                      setLocality('');
                      setDynamicAttrs({});
                      setImages([]);
                      clearDraft();
                    }
                    setSelectedCategory(cat);
                    // Filter dynamicAttrs so only keys defined in the selected category are preserved
                    if (cat.fields && cat.fields.length > 0) {
                      const validKeys = new Set(cat.fields.map((f: any) => f.key));
                      const filteredAttrs: Record<string, any> = {};
                      Object.entries(dynamicAttrs).forEach(([k, v]) => {
                        if (validKeys.has(k)) filteredAttrs[k] = v;
                      });
                      setDynamicAttrs(filteredAttrs);
                    } else {
                      setDynamicAttrs({});
                    }
                    setStep(2);
                  }}
                >
                  <View style={styles.categoryImageContainer}>
                    {imgSource ? (
                      <Image
                        source={typeof imgSource === 'string' ? { uri: imgSource } : imgSource}
                        style={styles.categoryImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.categoryIconCircle, { backgroundColor: iconMeta.color + '15' }]}>
                        <MaterialCommunityIcons name={(cat.icon || iconMeta.icon) as any} size={32} color={iconMeta.color} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Dynamic Category Attributes & Title */}
        {step === 2 && (
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
                  if (!price) {
                    Alert.alert('Required', 'Please enter the price for your listing');
                    return;
                  }
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
              {images.map((uri, idx) => {
                const isLocal = uri.startsWith('data:') || uri.startsWith('blob:') || uri.startsWith('file:');
                const imageSrc = isLocal ? uri : getFullImageUrl(uri);
                return (
                  <View key={idx} style={styles.photoThumb}>
                    <Image
                      source={{ uri: imageSrc }}
                      style={styles.photoImg}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.deletePhoto}
                      onPress={() => setImages(images.filter((_, i) => i !== idx))}
                    >
                      <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
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
                <Text style={styles.nextButtonText}>Next: Location & Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Location & Contact */}
        {step === 4 && (
          <View>
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

            {/* Free Ads usage badge below Post Ad Now */}
            <View style={styles.freeAdsCounterBox}>
              <MaterialCommunityIcons name="tag-outline" size={14} color="#6B7280" />
              <Text style={styles.freeAdsCounterText}>
                {Math.min(activeMyAdsCount, 5)}/5 Free Ads
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* OLX-Style "Sell Faster Now" Highlight Upsell Screen */}
      {isSuccessModalVisible && (
        <View style={styles.sellFasterContainer}>
          {/* Header */}
          <View style={styles.sellFasterHeader}>
            <TouchableOpacity
              style={styles.sellFasterBackBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                setStep(1);
                setTitle('');
                setDescription('');
                setPrice('');
                setImages([]);
                navigation.navigate('MyAdsTab', { tab: 'pending' });
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#0F2942" />
            </TouchableOpacity>
            <Text style={styles.sellFasterHeaderTitle}>Sell Faster Now</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Help & Support', 'Highlighting your ad gives it a verified HIGHLIGHTED badge, 3x larger visual presence, and keeps it at the top of search & browse results for maximum buyers.');
              }}
            >
              <Text style={styles.sellFasterHelpText}>Help</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sellFasterScroll} contentContainerStyle={styles.sellFasterScrollContent}>
            {/* Success Banner */}
            <View style={styles.sellFasterSuccessRow}>
              <View style={styles.sellFasterSuccessCircle}>
                <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellFasterCongratsTitle}>Congratulations!</Text>
                <Text style={styles.sellFasterCongratsSubtitle}>Your ad will be live soon.</Text>
              </View>
              {createdAdData?._id && (
                <TouchableOpacity
                  style={styles.previewAdBtn}
                  onPress={() => {
                    setIsSuccessModalVisible(false);
                    navigation.navigate('AdDetail', { id: createdAdData._id });
                  }}
                >
                  <Text style={styles.previewAdText}>Preview Ad</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#005CA8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Promo Card */}
            <View style={styles.sellFasterPromoCard}>
              <View style={styles.promoTagIconBox}>
                <MaterialCommunityIcons name="sale" size={26} color="#D9480F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoCardHeading}>Want to reach more buyers & Sell faster?</Text>
              </View>
            </View>

            {/* Feature your Ad / Highlight Your Ad Card */}
            <View style={styles.highlightAdCard}>
              <Text style={styles.highlightAdHeading}>Highlight your Ad</Text>

              <View style={styles.highlightBenefitRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10B981" />
                <Text style={styles.highlightBenefitText}>
                  Get <Text style={{ fontWeight: '700' }}>'HIGHLIGHTED'</Text> tag
                </Text>
              </View>

              <View style={styles.highlightBenefitRow}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#10B981" />
                <Text style={styles.highlightBenefitText}>
                  Stand out with a 3X larger listing
                </Text>
              </View>

              {/* Mock visual preview of Highlighted listing */}
              <View style={styles.adVisualPreviewBox}>
                <View style={styles.adVisualMockFeatured}>
                  <View style={styles.adMockImgBox}>
                    <MaterialCommunityIcons name="image-outline" size={20} color="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.adMockBadge}>
                      <Text style={styles.adMockBadgeText}>HIGHLIGHTED</Text>
                    </View>
                    <View style={styles.adMockLineLong} />
                    <Text style={styles.adMockYourAdText}>Your Ad</Text>
                  </View>
                </View>
                <View style={styles.adVisualMockRegular}>
                  <View style={[styles.adMockImgBox, { width: 34, height: 26 }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={[styles.adMockLineLong, { width: '80%' }]} />
                    <Text style={styles.adMockOthersText}>Others ad</Text>
                  </View>
                </View>
                <View style={styles.adVisualMockRegular}>
                  <View style={[styles.adMockImgBox, { width: 34, height: 26 }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={[styles.adMockLineLong, { width: '60%' }]} />
                    <Text style={styles.adMockOthersText}>Others ad</Text>
                  </View>
                </View>
              </View>

              {/* Plan 1: Highlighted Ad 30 Days */}
              <TouchableOpacity
                style={[
                  styles.planOptionCard,
                  styles.planOptionCardActive,
                ]}
                activeOpacity={0.85}
              >
                <View style={styles.planRibbonRow}>
                  <View style={[styles.planRibbon, { backgroundColor: '#2563EB' }]}>
                    <MaterialCommunityIcons name="star" size={11} color="#FFFFFF" />
                    <Text style={styles.planRibbonText}>Top Visibility</Text>
                  </View>
                </View>

                <View style={styles.planMainRow}>
                  <MaterialCommunityIcons
                    name="radiobox-marked"
                    size={22}
                    color="#005CA8"
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.planNameText}>
                      Boost Ad : 30 Days - Highlight Tag
                    </Text>
                    <Text style={styles.planSubnoteText}>Get up to 10x more buyer responses</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planPriceText}>₹99</Text>
                    <Text style={styles.planPriceCrossed}>₹299</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sticky Bottom Pay CTA & Skip */}
          <View style={styles.sellFasterFooter}>
            <TouchableOpacity
              style={styles.sellFasterPayBtn}
              onPress={() => {
                if (!createdAdData?._id) {
                  Alert.alert('Error', 'Ad ID missing. Please view ad in My Ads.');
                  return;
                }
                initiateRazorpayPayment({
                  type: 'highlight_ad',
                  adId: createdAdData._id,
                  userName: user?.name,
                  userEmail: user?.email,
                  userPhone: user?.phone,
                  onSuccess: () => {
                    Alert.alert('Success!', '₹99 received! Your ad is now HIGHLIGHTED for 30 days.');
                    queryClient.invalidateQueries({ queryKey: ['ads'] });
                    queryClient.invalidateQueries({ queryKey: ['myAds'] });
                    setIsSuccessModalVisible(false);
                    setStep(1);
                    setTitle('');
                    setDescription('');
                    setPrice('');
                    setImages([]);
                    navigation.navigate('MyAdsTab', { tab: 'pending' });
                  },
                  onFailure: (pErr) => {
                    if (pErr?.message !== 'Payment cancelled by user') {
                      Alert.alert('Payment Incomplete', pErr?.message || 'Could not complete payment.');
                    }
                  },
                });
              }}
            >
              <Text style={styles.sellFasterPayBtnText}>Pay ₹99</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sellFasterSkipBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                setStep(1);
                setTitle('');
                setDescription('');
                setPrice('');
                setImages([]);
                navigation.navigate('MyAdsTab', { tab: 'pending' });
              }}
            >
              <Text style={styles.sellFasterSkipBtnText}>Skip for now (Continue with Free Listing)</Text>
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
  categoriesScroll: {
    padding: 0,
    backgroundColor: '#FFFFFF',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  categoryCard: {
    width: '50%',
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  categoryImageContainer: {
    width: 68,
    height: 68,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  categoryImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  categoryIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
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
    fontWeight: '600',
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
    fontWeight: '600',
    fontSize: theme.typography.size.body,
  },
  freeAdsCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 4,
  },
  freeAdsCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Sell Faster Full Screen View
  sellFasterContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    zIndex: 9999,
  },
  sellFasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sellFasterBackBtn: {
    padding: 4,
  },
  sellFasterHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2942',
  },
  sellFasterHelpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#005CA8',
  },
  sellFasterScroll: {
    flex: 1,
  },
  sellFasterScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sellFasterSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sellFasterSuccessCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellFasterCongratsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellFasterCongratsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  previewAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  previewAdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005CA8',
  },
  sellFasterPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  promoTagIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promoCardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 20,
  },
  highlightAdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightAdHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  highlightBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightBenefitText: {
    fontSize: 13,
    color: '#334155',
  },
  adVisualPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  adVisualMockFeatured: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  adMockImgBox: {
    width: 48,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adMockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  adMockBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#854D0E',
  },
  adMockLineLong: {
    height: 6,
    width: '90%',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
  },
  adMockYourAdText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
  },
  adVisualMockRegular: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 10,
  },
  adMockOthersText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  planOptionCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  planOptionCardActive: {
    borderColor: '#005CA8',
    backgroundColor: '#F0F9FF',
  },
  planRibbonRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planRibbonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  planSubnoteText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  planPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  planPriceCrossed: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  sellFasterFooter: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sellFasterPayBtn: {
    backgroundColor: '#005CA8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellFasterPayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sellFasterSkipBtn: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
  },
  sellFasterSkipBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});
