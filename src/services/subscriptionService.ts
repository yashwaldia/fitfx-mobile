// ============================================
// Subscription Service - Mobile App
// Matching website structure exactly
// ============================================

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { SUBSCRIPTION_LIMITS } from '../constants/subscriptionPlans';
import type { Subscription, SubscriptionTier, UserProfile } from '../types';

/**
 * Initialize subscription for new user (Free tier)
 */
export async function initializeSubscription(uid: string): Promise<Subscription> {
  const subscription: Subscription = {
    tier: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: subscription,
      hasSeenPlanModal: false,
    });
    console.log(`✅ Subscription initialized for user ${uid}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error initializing subscription:', error);
    throw error;
  }
}

/**
 * Get user subscription
 */
export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      return data.subscription || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Update subscription tier after Razorpay payment
 */
export async function updateSubscriptionTier(
  uid: string,
  tier: SubscriptionTier,
  razorpayData?: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    endDate?: string;
  }
): Promise<Subscription> {
  const subscription: Subscription = {
    tier,
    status: 'active',
    razorpayPaymentId: razorpayData?.razorpayPaymentId,
    razorpayOrderId: razorpayData?.razorpayOrderId,
    startDate: new Date().toISOString(),
    endDate: razorpayData?.endDate,
  };

  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: subscription,
      hasSeenPlanModal: true,
    });
    console.log(`✅ Subscription updated to ${tier} for user ${uid}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

/**
 * Mark plan modal as seen
 */
export async function markPlanModalSeen(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      hasSeenPlanModal: true,
    });
    console.log(`✅ Plan modal marked as seen for user ${uid}`);
  } catch (error) {
    console.error('❌ Error marking plan modal as seen:', error);
    throw error;
  }
}

/**
 * Cancel subscription (downgrade to free)
 */
export async function cancelSubscription(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: {
        tier: 'free',
        status: 'cancelled',
        startDate: new Date().toISOString(),
      },
    });
    console.log(`✅ Subscription cancelled for user ${uid}`);
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  uid: string,
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      'subscription.status': status,
    });
    console.log(`✅ Subscription status updated to ${status} for user ${uid}`);
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
    throw error;
  }
}

/**
 * Handle Razorpay Payment Webhook - Payment Successful
 */
export async function handleRazorpayPaymentSuccess(
  uid: string,
  paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    tier: SubscriptionTier;
    endDate?: string;
  }
): Promise<void> {
  try {
    await updateSubscriptionTier(uid, paymentData.tier, {
      razorpayPaymentId: paymentData.razorpayPaymentId,
      razorpayOrderId: paymentData.razorpayOrderId,
      endDate: paymentData.endDate,
    });
    console.log(`✅ Razorpay payment processed for user ${uid}`);
  } catch (error) {
    console.error('❌ Error handling Razorpay payment webhook:', error);
    throw error;
  }
}

/**
 * Handle Razorpay Subscription Update Webhook
 */
export async function handleRazorpaySubscriptionUpdated(
  uid: string,
  subscriptionData: {
    razorpayOrderId: string;
    tier: SubscriptionTier;
    status: 'active' | 'cancelled' | 'past_due' | 'expired';
  }
): Promise<void> {
  try {
    const currentSubscription = await getSubscription(uid);
    if (currentSubscription) {
      const updatedSubscription: Subscription = {
        ...currentSubscription,
        tier: subscriptionData.tier,
        status: subscriptionData.status,
        razorpayOrderId: subscriptionData.razorpayOrderId,
      };

      await updateDoc(doc(db, 'users', uid), {
        subscription: updatedSubscription,
      });
      console.log(`✅ Subscription updated via Razorpay webhook for user ${uid}`);
    }
  } catch (error) {
    console.error('❌ Error handling Razorpay subscription update:', error);
    throw error;
  }
}

/**
 * Handle Razorpay Subscription Cancelled Webhook
 */
export async function handleRazorpayCancelled(uid: string): Promise<void> {
  try {
    await updateSubscriptionStatus(uid, 'cancelled');
    console.log(`✅ Razorpay subscription cancelled for user ${uid}`);
  } catch (error) {
    console.error('❌ Error handling Razorpay cancellation:', error);
    throw error;
  }
}

/**
 * Check if subscription is still active
 */
export async function isSubscriptionActive(uid: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(uid);
    return subscription?.status === 'active' && subscription?.tier !== 'free';
  } catch (error) {
    console.error('❌ Error checking subscription active status:', error);
    return false;
  }
}

/**
 * Get subscription tier for user
 */
export async function getUserSubscriptionTier(uid: string): Promise<SubscriptionTier> {
  try {
    const subscription = await getSubscription(uid);
    return subscription?.tier || 'free';
  } catch (error) {
    console.error('❌ Error getting user subscription tier:', error);
    return 'free';
  }
}

/**
 * Get feature limits based on subscription tier
 */
export async function getUserSubscriptionLimits(uid: string) {
  try {
    const tier = await getUserSubscriptionTier(uid);
    return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
  } catch (error) {
    console.error('❌ Error getting subscription limits:', error);
    return SUBSCRIPTION_LIMITS.free;
  }
}

/**
 * Get all subscription limits (for reference)
 */
export function getAllSubscriptionLimits() {
  return SUBSCRIPTION_LIMITS;
}

/**
 * Check if user has specific feature access
 */
export async function hasFeatureAccess(
  uid: string,
  feature: keyof typeof SUBSCRIPTION_LIMITS.free
): Promise<boolean> {
  try {
    const limits = await getUserSubscriptionLimits(uid);
    return !!limits[feature];
  } catch (error) {
    console.error(`❌ Error checking feature access for ${feature}:`, error);
    return false;
  }
}

/**
 * Check subscription validity
 */
export async function isSubscriptionValid(uid: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(uid);
    if (!subscription) return false;

    if (subscription.status !== 'active') return false;

    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      if (endDate < new Date()) {
        console.warn(`⚠️ Subscription expired for user ${uid}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking subscription validity:', error);
    return false;
  }
}

/**
 * Get days remaining in subscription
 */
export async function getDaysRemaining(uid: string): Promise<number | null> {
  try {
    const subscription = await getSubscription(uid);
    if (!subscription || !subscription.endDate) return null;

    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.error('❌ Error getting days remaining:', error);
    return null;
  }
}

/**
 * Export limits for external usage
 */
export const SubscriptionLimits = SUBSCRIPTION_LIMITS;
