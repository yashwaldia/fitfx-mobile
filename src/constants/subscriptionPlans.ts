// src/constants/subscriptionPlans.ts
//
// ✅ UPDATED: Renamed 'FEATURE_LIMITS' to 'SUBSCRIPTION_LIMITS'
// inside the 'SUBSCRIPTION_PLANS' array to fix the error.

import type { SubscriptionTier } from '../types';

// ============================================
// Feature Limits (from your current file)
// ============================================

/**
 * Wardrobe limits by tier
 */
export const WARDROBE_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  style_plus: 50,
  style_x: -1, // Unlimited
};

/**
 * Get wardrobe limit for a tier
 */
export function getWardrobeLimit(tier: SubscriptionTier): number {
  return WARDROBE_LIMITS[tier] || WARDROBE_LIMITS.free;
}

/**
 * Define the shape of a feature limit object
 */
export interface FeatureLimits {
  colorSuggestions: number;
  outfitPreviews: number;
  wardrobeLimit: number; // -1 for unlimited
  imageEditorAccess: boolean;
  batchGeneration: boolean;
  chatbotAccess: 'basic' | 'standard' | 'premium';
}

/**
 * Complete subscription limits for all features
 */
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    colorSuggestions: 999,
    outfitPreviews: 3,
    wardrobeLimit: 5, // Matches WARDROBE_LIMITS
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic',
  },
  style_plus: {
    colorSuggestions: 999,
    outfitPreviews: 10,
    wardrobeLimit: 50, // Matches WARDROBE_LIMITS
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'standard',
  },
  style_x: {
    colorSuggestions: 999,
    outfitPreviews: 999,
    wardrobeLimit: -1, // Matches WARDROBE_LIMITS
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'premium',
  },
};

/**
 * Get all subscription limits
 */
export function getAllSubscriptionLimits() {
  return SUBSCRIPTION_LIMITS;
}

// ============================================
// Plan Configurations (from website reference)
// ============================================

/**
 * Define the shape of a plan
 */
export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month';
  features: string[];
  limits: FeatureLimits;
  popular?: boolean;
  razorpayPaymentLinkId?: string;
}

/**
 * RAZORPAY SUBSCRIPTION PLANS
 */
export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'month',
    features: [
      'Basic profile creation',
      '1 selfie analysis',
      'Up to 5 color suggestions',
      '3 outfit previews',
      'Basic chatbot access',
      '5 wardrobe items', // Uses limit
    ],
    limits: SUBSCRIPTION_LIMITS.free, // ✅ FIXED
  },
  {
    tier: 'style_plus',
    name: 'Style+',
    price: 49,
    currency: 'INR',
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free ✓',
      'Unlimited selfie analyses',
      'Up to 10 color suggestions',
      'AI Image Editor access',
      '10 outfit previews per request',
      'Wardrobe management (50 items)', // Uses limit
      'Standard chatbot support',
    ],
    limits: SUBSCRIPTION_LIMITS.style_plus, // ✅ FIXED
    // ✅ Use the mobile app's .env variable
    razorpayPaymentLinkId: process.env.EXPO_PUBLIC_RAZORPAY_PLUS_LINK || '',
  },
  {
    tier: 'style_x',
    name: 'StyleX',
    price: 99,
    currency: 'INR',
    interval: 'month',
    features: [
      'Everything in Style+ ✓',
      'Unlimited color suggestions',
      'Batch image generation',
      'Unlimited outfit previews', // Uses limit
      'Unlimited wardrobe items', // Uses limit
      'Premium AI models',
      'Priority support (24/7)',
    ],
    limits: SUBSCRIPTION_LIMITS.style_x, // ✅ FIXED
    // ✅ Use the mobile app's .env variable
    razorpayPaymentLinkId: process.env.EXPO_PUBLIC_RAZORPAY_X_LINK || '',
  },
];

/**
 * Get plan by tier
 */
export function getPlanByTier(
  tier: SubscriptionTier
): PlanConfig | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier);
}

/**
 * Get Razorpay payment link for tier
 */
export function getRazorpayPaymentLink(
  tier: 'style_plus' | 'style_x'
): string {
  const plan = getPlanByTier(tier);
  if (!plan || !plan.razorpayPaymentLinkId) {
    console.warn(`⚠️ No payment link found for tier: ${tier}`);
    return '';
  }
  return plan.razorpayPaymentLinkId;
}