import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { auth } from '../config/firebaseConfig';
import { saveUserProfile } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { NEUMORPHIC, AURORA_GRADIENT, THEME } from '../config';
import GradientBackground from '../components/GradientBackground';
import type {
  UserProfile,
  Gender,
  Style,
  Occasion,
  AgeGroup,
  BodyType,
} from '../types/auth';

const GENDERS: Gender[] = ['Male', 'Female', 'Unisex', 'Kids'];
const STYLES: Style[] = ['American', 'Indian', 'Fusion', 'Other'];
const OCCASIONS: Occasion[] = [
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
const AGE_GROUPS: AgeGroup[] = [
  'Teen (13-17)',
  'Young Adult (18-25)',
  'Adult (26-35)',
  'Middle-Aged (36-45)',
  'Senior (46+)',
];
const BODY_TYPES: BodyType[] = [
  'Rectangle',
  'Triangle',
  'Inverted Triangle',
  'Hourglass',
  'Oval',
];

const FAVORITE_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Black',
  'White',
  'Pink',
  'Yellow',
  'Purple',
  'Orange',
  'Brown',
];

const ProfileCreationScreen = () => {
  const { user, checkUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.displayName || '',
    age: undefined,
    gender: undefined,
    bodyType: undefined,
    fashionIcons: '',
    preferredOccasions: [],
    preferredStyles: [],
    favoriteColors: [],
    preferredFabrics: [],
  });

  const totalSteps = 5;

  // Toggle selection for arrays
  const toggleArraySelection = (
    field: keyof UserProfile,
    value: string
  ) => {
    const currentArray = (profile[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    
    setProfile({ ...profile, [field]: newArray });
  };

  // Handle next step
  const handleNext = () => {
    // Validation for current step
    if (currentStep === 1 && !profile.name) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (currentStep === 2 && !profile.age) {
      Alert.alert('Required', 'Please select your age group');
      return;
    }
    if (currentStep === 3 && !profile.gender) {
      Alert.alert('Required', 'Please select your gender');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Final validation
    if (!profile.name || !profile.age || !profile.gender) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    setIsLoading(true);

    try {
      await saveUserProfile(user.uid, profile);
      await checkUserProfile(); // Refresh profile status
      console.log('✅ Profile created successfully');
      
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1(); // Name
      case 2:
        return renderStep2(); // Age
      case 3:
        return renderStep3(); // Gender & Body Type
      case 4:
        return renderStep4(); // Occasions & Styles
      case 5:
        return renderStep5(); // Colors & Fashion Icons
      default:
        return null;
    }
  };

  // STEP 1: Name
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name? 👋</Text>
      <Text style={styles.stepSubtitle}>
        Let's personalize your FitFX experience
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter your full name"
        placeholderTextColor={NEUMORPHIC.textTertiary}
        value={profile.name}
        onChangeText={(text) => setProfile({ ...profile, name: text })}
        autoCapitalize="words"
      />
    </View>
  );

  // STEP 2: Age
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select your age group 📅</Text>
      <Text style={styles.stepSubtitle}>
        This helps us suggest age-appropriate styles
      </Text>
      <View style={styles.optionsGrid}>
        {AGE_GROUPS.map((age) => (
          <TouchableOpacity
            key={age}
            style={[
              styles.option,
              profile.age === age && styles.optionSelected,
            ]}
            onPress={() => setProfile({ ...profile, age })}
          >
            <Text
              style={[
                styles.optionText,
                profile.age === age && styles.optionTextSelected,
              ]}
            >
              {age}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // STEP 3: Gender & Body Type
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself 👤</Text>
      
      {/* Gender Selection */}
      <Text style={styles.sectionLabel}>Gender</Text>
      <View style={styles.optionsRow}>
        {GENDERS.map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.smallOption,
              profile.gender === gender && styles.optionSelected,
            ]}
            onPress={() => setProfile({ ...profile, gender })}
          >
            <Text
              style={[
                styles.optionText,
                profile.gender === gender && styles.optionTextSelected,
              ]}
            >
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body Type Selection */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
        Body Type (Optional)
      </Text>
      <View style={styles.optionsGrid}>
        {BODY_TYPES.map((bodyType) => (
          <TouchableOpacity
            key={bodyType}
            style={[
              styles.option,
              profile.bodyType === bodyType && styles.optionSelected,
            ]}
            onPress={() => setProfile({ ...profile, bodyType })}
          >
            <Text
              style={[
                styles.optionText,
                profile.bodyType === bodyType && styles.optionTextSelected,
              ]}
            >
              {bodyType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // STEP 4: Occasions & Styles
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your style preferences ✨</Text>
      
      {/* Preferred Occasions */}
      <Text style={styles.sectionLabel}>Occasions (Select multiple)</Text>
      <View style={styles.optionsGrid}>
        {OCCASIONS.map((occasion) => (
          <TouchableOpacity
            key={occasion}
            style={[
              styles.option,
              profile.preferredOccasions?.includes(occasion) &&
                styles.optionSelected,
            ]}
            onPress={() => toggleArraySelection('preferredOccasions', occasion)}
          >
            <Text
              style={[
                styles.optionText,
                profile.preferredOccasions?.includes(occasion) &&
                  styles.optionTextSelected,
              ]}
            >
              {occasion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preferred Styles */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
        Style Preferences
      </Text>
      <View style={styles.optionsRow}>
        {STYLES.map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.smallOption,
              profile.preferredStyles?.includes(style) && styles.optionSelected,
            ]}
            onPress={() => toggleArraySelection('preferredStyles', style)}
          >
            <Text
              style={[
                styles.optionText,
                profile.preferredStyles?.includes(style) &&
                  styles.optionTextSelected,
              ]}
            >
              {style}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // STEP 5: Colors & Fashion Icons
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Final touches 🎨</Text>
      
      {/* Favorite Colors */}
      <Text style={styles.sectionLabel}>Favorite Colors</Text>
      <View style={styles.optionsGrid}>
        {FAVORITE_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              profile.favoriteColors?.includes(color) && styles.optionSelected,
            ]}
            onPress={() => toggleArraySelection('favoriteColors', color)}
          >
            <View
              style={[
                styles.colorDot,
                { backgroundColor: color.toLowerCase() },
              ]}
            />
            <Text
              style={[
                styles.optionText,
                profile.favoriteColors?.includes(color) &&
                  styles.optionTextSelected,
              ]}
            >
              {color}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fashion Icons */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
        Fashion Icons (Optional)
      </Text>
      <Text style={styles.helperText}>
        Who inspires your style? (e.g., "Ranveer Singh, Emma Watson")
      </Text>
      <TextInput
        style={[styles.textInput, { height: 80 }]}
        placeholder="Enter fashion icons..."
        placeholderTextColor={NEUMORPHIC.textTertiary}
        value={profile.fashionIcons}
        onChangeText={(text) =>
          setProfile({ ...profile, fashionIcons: text })
        }
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStep / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < totalSteps ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                currentStep === 1 && styles.nextButtonFull,
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.nextButton,
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={NEUMORPHIC.bg} />
              ) : (
                <Text style={styles.nextButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: THEME.spacing.xl,
    paddingTop: THEME.spacing.xxl,
    paddingBottom: THEME.spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: AURORA_GRADIENT.cyan,
  },
  progressText: {
    fontSize: 12,
    color: NEUMORPHIC.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.xl,
  },
  stepContainer: {
    flex: 1,
    paddingVertical: THEME.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: NEUMORPHIC.textTertiary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: THEME.radius.medium,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: NEUMORPHIC.textPrimary,
    minHeight: 50,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: THEME.radius.medium,
    borderWidth: 1.5,
    borderColor: NEUMORPHIC.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 100,
  },
  smallOption: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: THEME.radius.medium,
    borderWidth: 1.5,
    borderColor: NEUMORPHIC.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: AURORA_GRADIENT.cyan,
    borderColor: AURORA_GRADIENT.cyan,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: NEUMORPHIC.bg,
  },
  colorOption: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: THEME.radius.medium,
    borderWidth: 1.5,
    borderColor: NEUMORPHIC.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxl,
  },
  backButton: {
    flex: 1,
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: THEME.radius.medium,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
  },
  backButtonText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: AURORA_GRADIENT.cyan,
    borderRadius: THEME.radius.medium,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: NEUMORPHIC.bg,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileCreationScreen;
