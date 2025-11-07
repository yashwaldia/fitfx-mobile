// ============================================
// Subscription Plan Constants - Mobile App
// ============================================

import type { SubscriptionTier } from '../types';

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
 * Complete subscription limits for all features
 */
export const SUBSCRIPTION_LIMITS = {
  free: {
    colorSuggestions: 5,
    outfitPreviews: 3,
    wardrobeLimit: 5,
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic',
  },
  style_plus: {
    colorSuggestions: 10,
    outfitPreviews: 10,
    wardrobeLimit: 50,
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'standard',
  },
  style_x: {
    colorSuggestions: 999,
    outfitPreviews: 999,
    wardrobeLimit: -1, // Unlimited
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
