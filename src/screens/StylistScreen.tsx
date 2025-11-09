// src/screens/StylistScreen.tsx
//
// ✅ UPDATED:
// 1. Fixed 'expo-file-system' import to use the 'legacy' build
//    to resolve the 'readAsStringAsync' deprecation error.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
// ✅ FIXED: Import from the 'legacy' build
import * as FileSystem from 'expo-file-system/legacy';

import GradientBackground from '../components/GradientBackground';
import { getStyleAdvice } from '../services/styleAdviceService';
import { loadUserProfile, loadWardrobe } from '../services/firestoreService';
import { getUserSubscriptionTier } from '../services/subscriptionService';
import { getColorHex } from '../utilis/colorUtils';
import { NEUMORPHIC, AURORA_GRADIENT, STATUS_COLORS } from '../config/colors';
import type {
  UserProfile,
  Garment,
  StyleAdvice,
  ProfileOccasion,
  Country,
  ProfileGender,
  SubscriptionTier,
} from '../types';

// --- Data from your website ---
const occasions: ProfileOccasion[] = [
  'Traditional',
  'Cultural',
  'Modern',
  'Casual',
  'Festive',
  'Wedding',
  'Formal',
  'Business',
  'Street Fusion',
];
const countries: Country[] = [
  'India',
  'USA',
  'Japan',
  'France',
  'Africa (Nigeria, Ghana, Kenya)',
  'Arab Region',
];
const genders: ProfileGender[] = ['Female', 'Male', 'Unisex', 'Kids'];
const FASHION_COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Charcoal', hex: '#36454F' }, { name: 'Grey', hex: '#808080' },
  { name: 'Navy', hex: '#000080' }, { name: 'Royal Blue', hex: '#4169E1' }, { name: 'Sky Blue', hex: '#87CEEB' }, { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Emerald', hex: '#50C878' }, { name: 'Olive', hex: '#808000' }, { name: 'Mint Green', hex: '#98FF98' }, { name: 'Sage', hex: '#B2AC88' },
  { name: 'Red', hex: '#FF0000' }, { name: 'Burgundy', hex: '#800020' }, { name: 'Maroon', hex: '#800000' }, { name: 'Hot Pink', hex: '#FF69B4' },
  { name: 'Fuchsia', hex: '#FF00FF' }, { name: 'Blush Pink', hex: '#DE5D83' }, { name: 'Lilac', hex: '#C8A2C8' }, { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Purple', hex: '#800080' }, { name: 'Plum', hex: '#8E4585' }, { name: 'Beige', hex: '#F5F5DC' }, { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Tan', hex: '#D2B48C' }, { name: 'Brown', hex: '#A52A2A' }, { name: 'Chocolate', hex: '#7B3F00' }, { name: 'Mustard', hex: '#FFDB58' },
  { name: 'Gold', hex: '#FFD700' }, { name: 'Orange', hex: '#FFA500' }, { name: 'Coral', hex: '#FF7F50' }, { name: 'Peach', hex: '#FFE5B4' },
];

// --- Re-usable Button Component ---
const SelectionButton = <T extends string>({
  item,
  selectedItems,
  onSelect,
  isMultiSelect = false,
}: {
  item: T;
  selectedItems: T | T[];
  onSelect: (item: T) => void;
  isMultiSelect?: boolean;
}) => {
  const isActive = isMultiSelect
    ? (selectedItems as T[]).includes(item)
    : selectedItems === item;
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[styles.button, isActive && styles.buttonActive]}
    >
      <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>
        {item}
      </Text>
    </TouchableOpacity>
  );
};

// --- Main Stylist Screen ---
const StylistScreen: React.FC = () => {
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const auth = getAuth();
  const user = auth.currentUser;

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [subscriptionTier, setSubscriptionTier] =
    useState<SubscriptionTier>('free');

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<ProfileOccasion>('Traditional');
  const [country, setCountry] = useState<Country>('India');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<ProfileGender>('Male');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [styleAdvice, setStyleAdvice] = useState<StyleAdvice | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setError('You must be logged in.');
        setIsLoading(false);
        return;
      }

      try {
        const profile = await loadUserProfile(user.uid);
        const wardrobeData = await loadWardrobe(user.uid);
        const tier = await getUserSubscriptionTier(user.uid);

        setUserProfile(profile);
        setWardrobe(wardrobeData);
        setSubscriptionTier(tier);

        // Pre-fill from profile
        if (profile) {
          if (profile.age) setAge(String(profile.age));
          if (profile.gender) setGender(profile.gender);
          if (profile.preferredOccasions && profile.preferredOccasions.length > 0)
            setOccasion(profile.preferredOccasions[0]);
          if (profile.favoriteColors) setSelectedColors(profile.favoriteColors);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Convert image URI to base64
  useEffect(() => {
    const convertImage = async () => {
      if (imageUri) {
        try {
          // This method is now imported from the 'legacy' build
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
          setImageBase64(`data:image/jpeg;base64,${base64}`);
        } catch (e) {
          console.error('Failed to read image file', e);
          setError('Failed to load image. Please go back and try again.');
        }
      } else {
        setError('No image was provided. Please go back and try again.');
      }
    };
    convertImage();
  }, [imageUri]);

  const handleColorSelect = (hex: string) => {
    setSelectedColors((prev) => {
      const isSelected = prev.includes(hex);
      if (isSelected) return prev.filter((c) => c !== hex);
      if (prev.length < 20) return [...prev, hex]; // 20 limit
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!imageBase64) {
      setError('Please upload a selfie first');
      return;
    }
    if (!age || !gender) {
      setError('Please fill in all details (Age and Gender)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStyleAdvice(null); // Clear previous results

    try {
      const advice = await getStyleAdvice(
        imageBase64,
        occasion,
        country,
        age,
        gender,
        selectedColors,
        wardrobe,
        userProfile,
        subscriptionTier
      );
      setStyleAdvice(advice);
    } catch (err: any) {
      console.error('❌ Error getting style advice:', err);
      setError(err.message || 'Failed to get style advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoading = (text = 'Loading...') => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={AURORA_GRADIENT.cyan} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );

  const renderError = (err: string) => (
    <View style={styles.centerContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={STATUS_COLORS.error}
      />
      <Text style={styles.errorText}>{err}</Text>
    </View>
  );

  // --- Render AI Result (Translated from AIResultDisplay.tsx) ---
  const renderResult = (advice: StyleAdvice) => (
    <View style={styles.resultContainer}>
      {/* Fashion Summary */}
      <View style={styles.infoBlock}>
        <Text style={styles.blockTitle}>Fashion Summary</Text>
        <Text style={styles.blockText}>{advice.fashionSummary}</Text>
      </View>

      {/* Dress Matrix */}
      <View style={styles.infoBlock}>
        <Text style={styles.blockTitle}>Your Personalized Dress Matrix</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, { width: 100 }]}>Country</Text>
              <Text style={[styles.tableHeader, { width: 80 }]}>Gender</Text>
              <Text style={[styles.tableHeader, { width: 150 }]}>Dress Name</Text>
              <Text style={[styles.tableHeader, { width: 250 }]}>Description</Text>
              <Text style={[styles.tableHeader, { width: 120 }]}>Occasion</Text>
              <Text style={[styles.tableHeader, { width: 200 }]}>Notes</Text>
            </View>
            {/* Data Rows */}
            {advice.generatedDressMatrix.map((dress, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, { width: 100 }]}>
                  {dress.country}
                </Text>
                <Text style={[styles.tableCell, { width: 80 }]}>
                  {dress.gender}
                </Text>
                <Text
                  style={[styles.tableCell, styles.tableCellHighlight, { width: 150 }]}
                >
                  {dress.dressName}
                </Text>
                <Text style={[styles.tableCell, { width: 250 }]}>
                  {dress.description}
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  {dress.occasion}
                </Text>
                <Text style={[styles.tableCell, { width: 200 }]}>
                  {dress.notes}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Material Advice */}
      <View style={styles.infoBlock}>
        <Text style={styles.blockTitle}>Material & Fabric Advice</Text>
        <Text style={styles.blockText}>{advice.materialAdvice}</Text>
      </View>

      {/* Motivational Note */}
      <Text style={styles.quoteText}>"{advice.motivationalNote}"</Text>
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={NEUMORPHIC.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Stylist</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* 1. Selfie Uploader */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="camera-outline"
                size={20}
                color={AURORA_GRADIENT.cyan}
              />
              <Text style={styles.cardTitle}>Your Selfie</Text>
            </View>
            <View style={styles.selfieContainer}>
              {imageBase64 ? (
                <Image source={{ uri: imageBase64 }} style={styles.selfieImage} />
              ) : (
                <View style={[styles.selfieImage, styles.selfiePlaceholder]}>
                  <ActivityIndicator color={AURORA_GRADIENT.cyan} />
                </View>
              )}
              <View style={styles.selfieText}>
                <Text style={styles.selfieTitle}>Style analysis ready</Text>
                <Text style={styles.selfieSubtitle}>
                  We'll analyze this photo to generate your style advice.
                </Text>
              </View>
            </View>
          </View>

          {/* Render selectors only if not loading and no result yet */}
          {!isLoading && !styleAdvice && (
            <>
              {/* 2. User Details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={AURORA_GRADIENT.cyan}
                  />
                  <Text style={styles.cardTitle}>Your Details</Text>
                </View>
                <Text style={styles.label}>Your Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g., 28 or 18-25"
                  placeholderTextColor={NEUMORPHIC.textTertiary}
                />
                <Text style={styles.label}>Your Gender</Text>
                <View style={styles.gridContainer}>
                  {genders.map((g) => (
                    <SelectionButton
                      key={g}
                      item={g}
                      selectedItems={gender}
                      onSelect={(item) => setGender(item)}
                    />
                  ))}
                </View>
              </View>

              {/* 3. Style Selector */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="earth-outline"
                    size={20}
                    color={AURORA_GRADIENT.cyan}
                  />
                  <Text style={styles.cardTitle}>Occasion & Country</Text>
                </View>
                <Text style={styles.label}>Occasion</Text>
                <View style={styles.gridContainer}>
                  {occasions.map((o) => (
                    <SelectionButton
                      key={o}
                      item={o}
                      selectedItems={occasion}
                      onSelect={(item) => setOccasion(item)}
                    />
                  ))}
                </View>
                <Text style={styles.label}>Country / Region</Text>
                <View style={styles.gridContainer}>
                  {countries.map((c) => (
                    <SelectionButton
                      key={c}
                      item={c}
                      selectedItems={country}
                      onSelect={(item) => setCountry(item)}
                    />
                  ))}
                </View>
              </View>

              {/* 4. Color Selector */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="color-palette-outline"
                    size={20}
                    color={AURORA_GRADIENT.cyan}
                  />
                  <Text style={styles.cardTitle}>Favorite Colors (Optional)</Text>
                </View>
                <View style={styles.colorGrid}>
                  {FASHION_COLORS.map(({ name, hex }) => {
                    const isSelected = selectedColors.includes(hex);
                    return (
                      <TouchableOpacity
                        key={hex}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: hex },
                          isSelected && styles.colorSwatchSelected,
                        ]}
                        onPress={() => handleColorSelect(hex)}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={hex === '#000000' ? '#FFFFFF' : '#000000'}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={22}
                  color={NEUMORPHIC.bgDarker}
                />
                <Text style={styles.submitButtonText}>
                  Get Style Advice
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* 6. Result */}
          {isLoading && renderLoading('Generating your style advice...')}
          {error && !isLoading && renderError(error)}
          {styleAdvice && !isLoading && renderResult(styleAdvice)}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: NEUMORPHIC.borderDark,
    paddingBottom: 8,
  },
  cardTitle: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  selfieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selfieImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: NEUMORPHIC.bgDarker,
  },
  selfiePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieText: {
    flex: 1,
  },
  selfieTitle: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  selfieSubtitle: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUMORPHIC.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    padding: 12,
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    margin: 2,
  },
  buttonActive: {
    backgroundColor: AURORA_GRADIENT.cyan,
    borderColor: AURORA_GRADIENT.cyan,
  },
  buttonText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: NEUMORPHIC.bgDarker,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderColor: AURORA_GRADIENT.cyan,
    borderWidth: 3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AURORA_GRADIENT.cyan,
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: NEUMORPHIC.bgDarker,
    fontSize: 18,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: STATUS_COLORS.error,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  // Result Styles
  resultContainer: {
    marginTop: 16,
  },
  infoBlock: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    marginBottom: 16,
  },
  blockTitle: {
    color: AURORA_GRADIENT.cyan,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  blockText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  quoteText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: NEUMORPHIC.borderDark,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tableHeader: {
    color: AURORA_GRADIENT.cyan,
    fontWeight: '600',
    padding: 8,
    fontSize: 13,
  },
  tableCell: {
    color: NEUMORPHIC.textSecondary,
    padding: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  tableCellHighlight: {
    color: NEUMORPHIC.textPrimary,
    fontWeight: '500',
  },
});

export default StylistScreen;