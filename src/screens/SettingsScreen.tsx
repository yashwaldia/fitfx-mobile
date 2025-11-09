// src/screens/SettingsScreen.tsx
//
// This is the new Settings page, which acts as a hub for
// managing the user's account, subscription, and preferences.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';

import GradientBackground from '../components/GradientBackground';
import { loadUserProfile } from '../services/firestoreService';
import { getPlanByTier, PlanConfig } from '../constants/subscriptionPlans';
import { NEUMORPHIC, AURORA_GRADIENT, STATUS_COLORS } from '../config/colors';
import type { UserProfile } from '../types';

const SettingsScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const userProfile = await loadUserProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error('Failed to load settings data:', error);
          Alert.alert('Error', 'Failed to load your profile.');
        } finally {
          setLoading(false);
        }
      } else {
        router.replace('/login'); // Not logged in
      }
    };
    loadData();
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditPreferences = () => {
    // We will create this page in the next step
    router.push('/profile-edit');
  };

  const handleManageSubscription = () => {
    router.push('/upgrade');
  };

  const currentTier = profile?.subscription?.tier || 'free';
  const currentPlan = getPlanByTier(currentTier);

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator
            size="large"
            color={AURORA_GRADIENT.cyan}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Account Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{profile?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          {/* Subscription Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Plan</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      currentPlan?.tier === 'free'
                        ? NEUMORPHIC.textSecondary
                        : AURORA_GRADIENT.cyan,
                    fontWeight: '700',
                  },
                ]}
              >
                {currentPlan?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, styles.statusActive]}>
                {profile?.subscription?.status || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleManageSubscription}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={NEUMORPHIC.bgDarker}
              />
              <Text style={styles.buttonPrimaryText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            <Text style={styles.infoSubtitle}>
              Update your preferred styles, colors, and other details to
              personalize your AI suggestions.
            </Text>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleEditPreferences}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={NEUMORPHIC.textPrimary}
              />
              <Text style={styles.buttonSecondaryText}>
                Edit Profile Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={STATUS_COLORS.error}
            />
            <Text style={styles.logoutButtonText}>Log Out</Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 20,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: NEUMORPHIC.borderDark,
  },
  infoLabel: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
    maxWidth: '60%',
  },
  statusActive: {
    color: STATUS_COLORS.success,
  },
  infoSubtitle: {
    fontSize: 13,
    color: NEUMORPHIC.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AURORA_GRADIENT.cyan,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonPrimaryText: {
    color: NEUMORPHIC.bgDarker,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NEUMORPHIC.bgLight,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonSecondaryText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: STATUS_COLORS.error,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  logoutButtonText: {
    color: STATUS_COLORS.error,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsScreen;