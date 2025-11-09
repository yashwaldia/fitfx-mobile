// src/screens/UpgradeScreen.tsx
//
// ✅ UPDATED:
// 1. Increased planImage size from 64x64 to 80x80 for
//    better visual prominence.
// 2. Increased planImage borderRadius to match.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';

import GradientBackground from '../components/GradientBackground';
import {
  SUBSCRIPTION_PLANS,
  PlanConfig,
} from '../constants/subscriptionPlans';
import { openPaymentLink } from '../services/paymentService';
import { getUserSubscriptionTier } from '../services/subscriptionService';
import { NEUMORPHIC, AURORA_GRADIENT, STATUS_COLORS } from '../config/colors';
import type { SubscriptionTier } from '../types';

// ✅ Image map for the plans
const planImages = {
  free: require('../../assets/images/plan_free.png'),
  style_plus: require('../../assets/images/plan_plus.jpg'), // Make sure this filename is correct!
  style_x: require('../../assets/images/plan_x.png'),
};
// -----------------------------------------------------------------
// 💡 NOTE: You will need to download the images I generated
// and place them in your 'assets/images/' folder as:
// - plan_free.png
// - plan_plus.jpg (or .png if you renamed it)
// - plan_x.png
// -----------------------------------------------------------------


// --- PlanCard Sub-Component (Redesigned) ---
interface PlanCardProps {
  plan: PlanConfig;
  isCurrent: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrent,
  onSelect,
  isLoading,
}) => {
  const displayPrice = plan.price === 0 ? '0' : plan.price.toString();
  const getButtonText = () => {
    if (isCurrent) return 'Your Current Plan';
    if (plan.tier === 'free') return 'Continue with Free';
    return `Choose ${plan.name}`;
  };

  const isPrimaryCta = !isCurrent && plan.tier !== 'free';

  const planImage =
    planImages[plan.tier as keyof typeof planImages] || planImages.free;

  return (
    <View
      style={[
        styles.planCard,
        isCurrent
          ? styles.planCardCurrent
          : isPrimaryCta
          ? styles.planCardPopular
          : styles.planCardDefault,
      ]}
    >
      {/* Badges */}
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current Plan</Text>
        </View>
      )}
      {plan.popular && !isCurrent && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}

      {/* MODIFIED: Header is now a Row */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>₹{displayPrice}</Text>
            {plan.price > 0 && (
              <Text style={styles.planInterval}>/month</Text>
            )}
          </View>
        </View>
        
        {/* ADDED: Plan Image */}
        <Image source={planImage} style={styles.planImage} />
      </View>


      {/* Features */}
      <View style={styles.featuresList}>
        {plan.features.map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={isPrimaryCta ? AURORA_GRADIENT.cyan : AURORA_GRADIENT.cyan}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.planButton,
          isPrimaryCta
            ? styles.planButtonPrimary
            : isCurrent
            ? styles.planButtonCurrent
            : styles.planButtonSecondary,
        ]}
        onPress={onSelect}
        disabled={isLoading || isCurrent}
      >
        {isLoading ? (
          <ActivityIndicator color={isPrimaryCta ? '#000' : '#FFF'} />
        ) : (
          <Text
            style={[
              styles.planButtonText,
              isPrimaryCta
                ? styles.planButtonTextPrimary
                : styles.planButtonTextSecondary,
            ]}
          >
            {getButtonText()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
// --- End of PlanCard ---

// --- Main Screen (Unchanged) ---
const UpgradeScreen: React.FC = () => {
  const [currentTier, setCurrentTier] =
    useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const loadTier = async () => {
      if (user) {
        const tier = await getUserSubscriptionTier(user.uid);
        setCurrentTier(tier);
      }
    };
    loadTier();
  }, [user]);

  const handlePlanSelect = async (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === currentTier) {
      return; // Do nothing for free or current plan
    }

    setIsLoading(true);
    try {
      await openPaymentLink(tier as 'style_plus' | 'style_x');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start payment.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Upgrade Your Plan</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {currentTier === null ? (
            <ActivityIndicator
              size="large"
              color={AURORA_GRADIENT.cyan}
              style={{ marginTop: 50 }}
            />
          ) : (
            SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                isCurrent={currentTier === plan.tier}
                onSelect={() => handlePlanSelect(plan.tier)}
                isLoading={isLoading}
              />
            ))
          )}
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>
              Payments are processed securely by Razorpay. You can manage or
              cancel your subscription anytime from your Settings.
            </Text>
          </View>
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
  planCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  planCardDefault: {
    borderColor: NEUMORPHIC.borderDark,
  },
  planCardPopular: {
    borderColor: AURORA_GRADIENT.cyan,
    shadowColor: AURORA_GRADIENT.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  planCardCurrent: {
    borderColor: AURORA_GRADIENT.cyan,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: AURORA_GRADIENT.cyan,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: NEUMORPHIC.bgDarker,
    fontSize: 12,
    fontWeight: '700',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: NEUMORPHIC.bgLight,
    borderColor: AURORA_GRADIENT.cyan,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: AURORA_GRADIENT.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: AURORA_GRADIENT.cyan,
  },
  planInterval: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
    marginLeft: 4,
  },
  // ✅ FIXED: Increased image size
  planImage: {
    width: 80,
    height: 80,
    borderRadius: 16, // Increased border radius
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  featuresList: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: NEUMORPHIC.borderDark,
    paddingTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  planButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  planButtonPrimary: {
    backgroundColor: AURORA_GRADIENT.cyan,
  },
  planButtonSecondary: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  planButtonCurrent: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AURORA_GRADIENT.cyan,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  planButtonTextPrimary: {
    color: NEUMORPHIC.bgDarker,
  },
  planButtonTextSecondary: {
    color: NEUMORPHIC.textPrimary,
  },
  footerTextContainer: {
    marginTop: 16,
    padding: 16,
  },
  footerText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default UpgradeScreen;