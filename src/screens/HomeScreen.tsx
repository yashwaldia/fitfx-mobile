// src/screens/HomeScreen.tsx
//
// ✅ UPDATED:
// 1. No changes were needed!
// 2. The button `onPress={() => onNavigate('calendar')}` is already
//    correct and will work with the new CalendarScreen.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '../components/GradientBackground';
import GlassmorphicCard from '../components/GlassmorphicCard';
import NeuButton from '../components/NeuButton';
import IconGrid, { IconGridItem } from '../components/IconGrid';
import { THEME, NEUMORPHIC, AURORA_GRADIENT } from '../config';
import { getUserSubscriptionTier } from '../services/subscriptionService';
import { getAuth } from 'firebase/auth';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  currentTab?: 'home' | 'selfie' | 'calendar' | 'upgrade' | 'settings';
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  currentTab = 'home',
}) => {
  const [userTier, setUserTier] = useState<'free' | 'style_plus' | 'style_x'>(
    'free'
  );
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUserTier = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const tier = await getUserSubscriptionTier(user.uid);
          setUserTier(tier);
        }
      } catch (error) {
        console.error('Error loading user tier:', error);
      }
    };

    loadUserTier();
  }, []);

  const handleTakePhoto = async () => {
    setSelfieModalVisible(false); // Close modal first
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your camera.');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        router.push({
          pathname: '/stylist',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleUploadFromGallery = async () => {
    setSelfieModalVisible(false); // Close modal first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your photos.');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        router.push({
          pathname: '/stylist',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const navigationItems: IconGridItem[] = [
    {
      id: 'wardrobe',
      icon: 'wardrobe-outline',
      label: 'Wardrobe',
      onPress: () => router.push('/wardrobe'),
    },
    {
      id: 'editor',
      icon: 'auto-fix',
      label: 'Editor',
      onPress: () => router.push({ pathname: '/wardrobe', params: { tab: 'ai' } }),
    },
    {
      id: 'color',
      icon: 'palette',
      label: 'Color',
      onPress: () => onNavigate('color'),
    },
  ];

  const getTierBadge = () => {
    switch (userTier) {
      case 'style_plus':
        return ' Style+';
      case 'style_x':
        return ' StyleX';
      default:
        return '';
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.wrapper}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo, Welcome Card, etc. (all unchanged) */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <GlassmorphicCard style={styles.welcomeCard} intensity="medium">
              <Text style={styles.welcomeTitle}>
                Welcome to FitFX{getTierBadge()}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Elevate Your Style with AI-Powered Suggestions
              </Text>
            </GlassmorphicCard>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
            <IconGrid items={navigationItems} columns={3} />
            <Text style={styles.sectionTitle}>Featured</Text>
            <GlassmorphicCard style={styles.featuredCard} intensity="medium">
              <Text style={styles.featuredTitle}>Today's Suggestion</Text>
              <Text style={styles.featuredDescription}>
                Navy Blue Chinos + White Cotton Shirt + Light Grey Blazer
              </Text>
              <NeuButton
                title="View Details"
                onPress={() => onNavigate('suggestions')}
                size="medium"
                style={styles.button}
              />
            </GlassmorphicCard>
            {userTier === 'free' && (
              <GlassmorphicCard style={styles.ctaCard} intensity="medium">
                <Text style={styles.ctaTitle}>Ready to upgrade?</Text>
                <Text style={styles.ctaDescription}>
                  Unlock unlimited outfits and premium AI features
                </Text>
                <NeuButton
                  title="Upgrade Now"
                  onPress={() => onNavigate('upgrade')}
                  size="medium"
                  style={styles.button}
                />
              </GlassmorphicCard>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* BOTTOM NAVIGATION BAR */}
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 8 }]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('home')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'home' ? 'home' : 'home-outline'}
                size={22}
                color={
                  currentTab === 'home'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'home' && styles.navLabelActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setSelfieModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'selfie' ? 'camera' : 'camera-outline'}
                size={22}
                color={
                  currentTab === 'selfie'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'selfie' && styles.navLabelActive,
                ]}
              >
                Selfie
              </Text>
            </TouchableOpacity>

            {/* This button is already correct! */}
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('calendar')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  currentTab === 'calendar' ? 'calendar' : 'calendar-outline'
                }
                size={22}
                color={
                  currentTab === 'calendar'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'calendar' && styles.navLabelActive,
                ]}
              >
                Calendar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('upgrade')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'upgrade' ? 'rocket' : 'rocket-outline'}
                size={22}
                color={
                  currentTab === 'upgrade'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'upgrade' && styles.navLabelActive,
                ]}
              >
                Upgrade
              </Text>
            </TouchableOpacity>

            {/* ✅ FIXED: Changed to "Profile" */}
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('settings')} // Still navigates to 'settings' page
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  currentTab === 'settings' ? 'person' : 'person-outline' // ✅ Changed icon
                }
                size={22}
                color={
                  currentTab === 'settings'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'settings' && styles.navLabelActive,
                ]}
              >
                Profile {/* ✅ Changed label */}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* The Selfie Picker Modal (Unchanged) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={selfieModalVisible}
          onRequestClose={() => {
            setSelfieModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Upload Selfie</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleTakePhoto}
              >
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={AURORA_GRADIENT.cyan}
                />
                <Text style={styles.modalButtonText}>Take a Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUploadFromGallery}
              >
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={AURORA_GRADIENT.cyan}
                />
                <Text style={styles.modalButtonText}>Upload from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSelfieModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    height: 70,
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  welcomeCard: {
    marginBottom: 24,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    color: NEUMORPHIC.textPrimary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: NEUMORPHIC.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: NEUMORPHIC.textPrimary,
    marginVertical: 16,
  },
  featuredCard: {
    marginBottom: 16,
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: NEUMORPHIC.textPrimary,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: NEUMORPHIC.textSecondary,
    marginBottom: 16,
  },
  ctaCard: {
    marginBottom: 24,
    padding: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: NEUMORPHIC.textPrimary,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: NEUMORPHIC.textSecondary,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 22, 31, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 10,
    color: NEUMORPHIC.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: AURORA_GRADIENT.cyan,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEUMORPHIC.bgDarker,
    padding: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  modalButtonText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    marginLeft: 12,
  },
  modalCancelButton: {
    marginTop: 8,
    padding: 10,
  },
  modalCancelButtonText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;