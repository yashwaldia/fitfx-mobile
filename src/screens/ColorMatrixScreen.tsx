// src/screens/ColorMatrixScreen.tsx
//
// ✅ UPDATED:
// 1. Matched layout to WardrobeScreen (GradientBackground > SafeAreaView).
// 2. Added a matching Header with a "back" button.
// 3. Changed all colors to the sleek, modern theme (cyan/white).

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// ✅ Import from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; // ✅ Import router for the back button
import { getAuth } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import { AURORA_GRADIENT, NEUMORPHIC, STATUS_COLORS } from '../config/colors';
import { loadUserProfile, loadWardrobe } from '../services/firestoreService';
import {
  generatePersonalizedOutfits,
  PersonalizedOutfit,
} from '../services/outfitSuggestionService';
import type { Garment, UserProfile } from '../types';
import { getColorHex } from '../utilis/colorUtils';

const ColorMatrixScreen: React.FC = () => {
  const [outfits, setOutfits] = useState<PersonalizedOutfit[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      loadSuggestions(user.uid);
    } else {
      setIsLoading(false);
      setError('You must be logged in to get suggestions.');
    }
  }, []);

  const loadSuggestions = async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await loadUserProfile(userId);
      if (!profile) {
        setError('Please complete your profile to get suggestions.');
        setIsLoading(false);
        return;
      }
      if (!profile.name || !profile.age || !profile.gender) {
        setError(
          'Profile is incomplete. Please provide your name, age, and gender in your profile settings.'
        );
        setIsLoading(false);
        return;
      }

      const wardrobeItems = await loadWardrobe(userId);
      setUserProfile(profile);
      setWardrobe(wardrobeItems);

      const suggestions = await generatePersonalizedOutfits(
        profile,
        wardrobeItems
      );
      setOutfits(suggestions);
    } catch (err: any) {
      console.error('Error loading suggestions:', err);
      setError('Failed to generate personalized suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={AURORA_GRADIENT.cyan} />
      <Text style={styles.loadingText}>
        Generating Your Personalized Outfit Suggestions...
      </Text>
      <Text style={styles.subtleText}>This may take a few moments</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={STATUS_COLORS.error}
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: AURORA_GRADIENT.cyan }]}
        onPress={() => {
          const user = getAuth().currentUser;
          if (user) loadSuggestions(user.uid);
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOutfitCard = (outfit: PersonalizedOutfit, index: number) => (
    <View key={index} style={styles.outfitCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.outfitName}>{outfit.outfitName}</Text>
        <Text style={styles.badge}>{outfit.styleCategory}</Text>
      </View>
      <Text style={styles.badgeOccasion}>{outfit.occasion}</Text>

      {/* Color Palette */}
      <View style={styles.colorPalette}>
        {outfit.colorCombination.map((color, idx) => (
          <View key={idx} style={styles.colorChip}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: getColorHex(color) },
              ]}
            />
            <Text style={styles.colorChipText}>{color}</Text>
          </View>
        ))}
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailLabel}>Top:</Text>
        <Text style={styles.detailText}>{outfit.topWear}</Text>

        <Text style={styles.detailLabel}>Bottom:</Text>
        <Text style={styles.detailText}>{outfit.bottomWear}</Text>

        {outfit.layering && (
          <>
            <Text style={styles.detailLabel}>Layer:</Text>
            <Text style={styles.detailText}>{outfit.layering}</Text>
          </>
        )}

        <Text style={styles.detailLabel}>Footwear:</Text>
        <Text style={styles.detailText}>{outfit.footwear}</Text>

        <Text style={styles.detailLabel}>Accessories:</Text>
        <Text style={styles.detailText}>{outfit.accessories}</Text>
      </View>

      {/* Why it works */}
      <View style={styles.whyContainer}>
        <Text style={styles.whyText}>💡 {outfit.whyItWorks}</Text>
      </View>
    </View>
  );

  return (
    // ✅ FIXED: Layout matches WardrobeScreen
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ✅ ADDED: Header with Back Button */}
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
          <Text style={styles.headerTitle}>AI Style Guide</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.subtleText}>
            {outfits.length} personalized outfits for you
          </Text>

          {isLoading
            ? renderLoading()
            : error
            ? renderError()
            : outfits.length === 0
            ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorText}>No outfits generated.</Text>
              </View>
            )
            : (
              outfits.map(renderOutfitCard)
            )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // No background color here, lets the GradientBackground show through
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  // ✅ ADDED: Header styles from WardrobeScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12, // For status bar height
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
  // End of Header styles
  subtleText: {
    color: NEUMORPHIC.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    color: NEUMORPHIC.textSecondary, // ✅ FIXED: Changed color
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
  retryButton: {
    backgroundColor: AURORA_GRADIENT.cyan, // ✅ FIXED: Changed color
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: NEUMORPHIC.textPrimary, // ✅ FIXED: Changed color
    fontWeight: 'bold',
  },
  outfitCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: NEUMORPHIC.textPrimary, // ✅ FIXED: Changed color
    flex: 1,
  },
  badge: {
    backgroundColor: NEUMORPHIC.bgDarker,
    color: NEUMORPHIC.textSecondary,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  badgeOccasion: {
    backgroundColor: 'rgba(0, 206, 209, 0.15)', // ✅ FIXED: Changed color
    color: AURORA_GRADIENT.cyan, // ✅ FIXED: Changed color
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
    overflow: 'hidden',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEUMORPHIC.bgDarker,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  colorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    marginRight: 6,
  },
  colorChipText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 10,
  },
  detailsContainer: {
    gap: 8,
  },
  detailLabel: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  detailText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 13,
    marginTop: -4,
  },
  whyContainer: {
    borderTopWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    marginTop: 12,
    paddingTop: 12,
  },
  whyText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default ColorMatrixScreen;