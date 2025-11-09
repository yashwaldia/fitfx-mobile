// src/screens/ProfileEditScreen.tsx
//
// ✅ NEW FILE: This is the "Edit Profile Preferences" screen.
// It loads your existing data and lets you save changes.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';

import GradientBackground from '../components/GradientBackground';
import { saveUserProfile, loadUserProfile } from '../services/firestoreService';
import { NEUMORPHIC, AURORA_GRADIENT, STATUS_COLORS } from '../config/colors';
import type {
  UserProfile,
  ProfileOccasion,
  Style,
  ProfileGender,
  AgeGroup,
} from '../types';

// --- Data from your website code ---
const stylesData: Style[] = ['American', 'Indian', 'Fusion', 'Other'];
const genders: ProfileGender[] = ['Male', 'Female', 'Unisex', 'Kids'];
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

// --- Helper Components (Translated) ---
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

// --- Main Edit Screen ---
const ProfileEditScreen: React.FC = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile State
  const [name, setName] = useState('');
  const [age, setAge] = useState<AgeGroup | ''>('');
  const [gender, setGender] = useState<ProfileGender>('Female');
  const [preferredOccasions, setPreferredOccasions] = useState<ProfileOccasion[]>([]);
  const [preferredStyles, setPreferredStyles] = useState<Style[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  
  // ✅ Load existing profile data on mount
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const profile = await loadUserProfile(user.uid);
          if (profile) {
            setName(profile.name || '');
            setAge((profile.age as AgeGroup) || '');
            setGender(profile.gender || 'Female');
            setPreferredOccasions(profile.preferredOccasions || []);
            setPreferredStyles(profile.preferredStyles || []);
            setFavoriteColors(profile.favoriteColors || []);
          }
        } catch (err) {
          setError('Failed to load your profile data.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [user]);

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

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You are not logged in.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);

    const profile: UserProfile = {
      name,
      age: age || undefined,
      gender: gender || undefined,
      preferredOccasions,
      preferredStyles,
      favoriteColors,
    };

    try {
      await saveUserProfile(user.uid, profile);
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError('Failed to save profile. Please try again.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <ActivityIndicator
          size="large"
          color={AURORA_GRADIENT.cyan}
          style={{ flex: 1 }}
        />
      </GradientBackground>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Preferences</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Card 1: Basic Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Info</Text>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Alex Doe"
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

          {/* Card 2: Styles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Style</Text>
            <View style={styles.gridContainer}>
              {stylesData.map((s) => (
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

          {/* Card 3: Occasions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Occasions</Text>
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

          {/* Card 4: Colors */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Favorite Colors</Text>
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

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={NEUMORPHIC.bgDarker} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
    height: 60,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 16,
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
    marginBottom: 8,
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
    color: STATUS_COLORS.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: AURORA_GRADIENT.cyan,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: NEUMORPHIC.bgDarker,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProfileEditScreen;