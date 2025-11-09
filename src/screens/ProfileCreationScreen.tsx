// src/screens/ProfileCreationScreen.tsx
//
// ✅ UPDATED: Fixed all type errors and navigation logic.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router'; // ✅ FIXED: Import router

import GradientBackground from '../components/GradientBackground';
import { saveUserProfile } from '../services/firestoreService';
// import { useAuth } from '../contexts/AuthContext'; // ✅ FIXED: Removed unused import
import { NEUMORPHIC, AURORA_GRADIENT } from '../config'; 
import type {
  UserProfile,
  ProfileOccasion, // ✅ FIXED: Use new ProfileOccasion type
  Style,
  ProfileGender, // ✅ FIXED: Use new ProfileGender type
  AgeGroup,
  BodyType,
} from '../types'; // ✅ FIXED: Import new types

// --- Data from your website code ---
const stylesData: Style[] = ['American', 'Indian', 'Fusion', 'Other']; // ✅ FIXED: Renamed to avoid conflict
const genders: ProfileGender[] = ['Male', 'Female', 'Unisex', 'Kids']; // ✅ FIXED: Use ProfileGender
const occasions: ProfileOccasion[] = [ // ✅ FIXED: Use ProfileOccasion
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
const ageGroups: AgeGroup[] = [
  'Teen (13-17)',
  'Young Adult (18-25)',
  'Adult (26-35)',
  'Middle-Aged (36-45)',
  'Senior (46+)',
];
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
const TOTAL_STEPS = 5; 

// --- Helper Components (Translated) ---

const Stepper: React.FC<{ step: number }> = ({ step }) => (
  <View style={styles.stepperContainer}>
    <Text style={styles.stepperText}>
      Step {step} of {TOTAL_STEPS}
    </Text>
    <View style={styles.stepperBar}>
      <View
        style={[
          styles.stepperProgress,
          { width: `${(step / TOTAL_STEPS) * 100}%` },
        ]}
      />
    </View>
  </View>
);

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

// --- Main Screen ---

const ProfileCreationScreen: React.FC = () => {
  const auth = getAuth();
  // const { refreshUser } = useAuth(); // ✅ FIXED: Removed, not in context
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [age, setAge] = useState<AgeGroup | ''>('');
  const [gender, setGender] = useState<ProfileGender>('Female'); // ✅ FIXED: Use ProfileGender
  const [preferredOccasions, setPreferredOccasions] = useState<ProfileOccasion[]>([]); // ✅ FIXED: Use ProfileOccasion
  const [preferredStyles, setPreferredStyles] = useState<Style[]>([]); // ✅ FIXED: Use Style
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]); // ✅ This is correct (string[])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your photos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, 
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setError(null);
    }
  };

  const handleMultiSelect = <T extends string>(
    item: T,
    state: T[],
    setState: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setState((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleColorSelect = (hex: string) => {
    setFavoriteColors((prev) => {
      const isSelected = prev.includes(hex);
      if (isSelected) return prev.filter((c) => c !== hex);
      if (prev.length < 20) return [...prev, hex];
      return prev;
    });
  };

  const nextStep = () => {
    setError(null);
    if (step === 1 && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (step === 2 && preferredStyles.length === 0) {
      setError('Please select at least one style.');
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You are not logged in.');
      return;
    }

    const profile: UserProfile = {
      name,
      age: age || undefined,
      gender: gender || undefined,
      preferredOccasions,
      preferredStyles,
      favoriteColors, // ✅ This now matches the new types.ts (string[])
    };

    try {
      await saveUserProfile(auth.currentUser.uid, profile);
      // ✅ FIXED: Manually navigate. _layout.tsx will see 'hasProfile'
      // on the *next* context load, but this gets the user off this screen.
      router.replace('/'); 
    } catch (e: any) {
      setError('Failed to save profile. Please try again.');
      console.error(e);
    }
  };

  // --- Step Renderer ---

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome to FitFX!</Text>
            <Text style={styles.subtitle}>
              Let's create your style profile.
            </Text>
            <TouchableOpacity
              style={styles.photoUploader}
              onPress={handlePhotoUpload}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={40}
                  color={NEUMORPHIC.textSecondary}
                />
              )}
            </TouchableOpacity>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Alex Doe"
              placeholderTextColor={NEUMORPHIC.textTertiary}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's Your Style?</Text>
            <Text style={styles.subtitle}>
              Select one or more. This helps us find your vibe.
            </Text>
            <View style={styles.gridContainer}>
              {stylesData.map((s) => ( // ✅ FIXED: Use stylesData
                <SelectionButton
                  key={s}
                  item={s}
                  selectedItems={preferredStyles}
                  onSelect={(item) =>
                    handleMultiSelect(item, preferredStyles, setPreferredStyles)
                  }
                  isMultiSelect
                />
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Your Fit</Text>
            <Text style={styles.subtitle}>
              This helps in personalizing silhouettes and cuts.
            </Text>
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
            <Text style={styles.label}>Your Age Group</Text>
            <View style={styles.gridContainer}>
              {ageGroups.map((ag) => (
                <SelectionButton
                  key={ag}
                  item={ag}
                  selectedItems={age}
                  onSelect={setAge}
                />
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Your Tastes</Text>
            <Text style={styles.subtitle}>
              What occasions do you usually dress for?
            </Text>
            <View style={styles.gridContainer}>
              {occasions.map((o) => (
                <SelectionButton
                  key={o}
                  item={o}
                  selectedItems={preferredOccasions}
                  onSelect={(item) =>
                    handleMultiSelect(
                      item,
                      preferredOccasions,
                      setPreferredOccasions
                    )
                  }
                  isMultiSelect
                />
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Favorite Colors</Text>
            <Text style={styles.subtitle}>
              Choose colors you love (up to 20).
            </Text>
            <View style={styles.colorGrid}>
              {FASHION_COLORS.map(({ name, hex }) => {
                const isSelected = favoriteColors.includes(hex);
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
                      <Ionicons name="checkmark" size={20} color={hex === '#000000' ? '#FFFFFF' : '#000000'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.headerTitle}>Create Your Profile</Text>
          <View style={styles.card}>
            <Stepper step={step} />
            <View style={styles.stepContentWrapper}>{renderStepContent()}</View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.footerButtons}>
              <TouchableOpacity
                onPress={prevStep}
                disabled={step === 1}
                style={[styles.navButton, step === 1 && styles.navButtonDisabled]}
              >
                <Text style={[styles.navButtonText, styles.navButtonBackText]}>Back</Text>
              </TouchableOpacity>
              {step < TOTAL_STEPS ? (
                <TouchableOpacity onPress={nextStep} style={[styles.navButton, styles.navButtonPrimary]}>
                  <Text style={styles.navButtonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSave} style={[styles.navButton, styles.navButtonPrimary]}>
                  <Text style={styles.navButtonText}>Finish & Explore</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  stepperContainer: {
    marginBottom: 20,
  },
  stepperText: {
    color: AURORA_GRADIENT.cyan,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepperBar: {
    height: 6,
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 3,
  },
  stepperProgress: {
    height: 6,
    backgroundColor: AURORA_GRADIENT.cyan,
    borderRadius: 3,
  },
  stepContentWrapper: {
    minHeight: 350,
    justifyContent: 'center',
  },
  stepContainer: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: NEUMORPHIC.textSecondary,
    marginBottom: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    padding: 12,
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
  photoUploader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: NEUMORPHIC.bgDarker,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
    margin: 4,
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
    justifyContent: 'center',
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
  errorText: {
    color: '#EF4444', 
    textAlign: 'center',
    marginTop: 16,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: NEUMORPHIC.borderDark,
    paddingTop: 16,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  navButtonPrimary: {
    backgroundColor: AURORA_GRADIENT.cyan,
  },
  navButtonText: {
    color: NEUMORPHIC.bgDarker,
    fontWeight: '700',
    fontSize: 16,
  },
  navButtonBackText: {
    color: NEUMORPHIC.textSecondary,
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
  },
});

export default ProfileCreationScreen;