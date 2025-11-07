// ============================================
// FitFX Mobile - Complete Type Definitions
// ============================================

/**
 * Subscription Tier Type
 */
export type SubscriptionTier = 'free' | 'style_plus' | 'style_x';

/**
 * Garment Interface - MOBILE APP VERSION
 * Uses base64 images and material descriptions
 */
export interface Garment {
  id?: string;
  image?: string; // ✅ Base64 image string (mobile)
  imageUrl?: string; // Firebase Storage URL (website)
  material?: string; // ✅ "Cotton T-Shirt", "Denim Jeans", etc.
  type?: string; // T-shirt, Jeans, Dress, etc.
  color: string; // Required field
  size?: string;
  occasion?: string;
  season?: string;
  condition?: string;
  notes?: string;
  uploadedAt?: string;
}

/**
 * Wardrobe Status Interface
 */
export interface WardrobeStatus {
  accessible: number;
  total: number;
  limit: number;
  isUnlimited: boolean;
  isExpired: boolean;
  hiddenCount: number;
  tier: SubscriptionTier;
}

/**
 * Subscription Interface
 */
export interface Subscription {
  tier: SubscriptionTier;
  status: string;
  startDate: string;
  endDate?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  subscriptionId?: string;
  customerId?: string;
}

/**
 * User Profile Interface
 */
export interface UserProfile {
  name: string;
  age?: string;
  gender?: string;
  bodyType?: string;
  fashionIcons?: string;
  preferredOccasions?: string;
  preferredStyles?: string;
  favoriteColors?: string;
  preferredFabrics?: string;
  hasSeenPlanModal?: boolean;
  subscription?: Subscription;
  wardrobe?: Garment[];
}

/**
 * Outfit Suggestion Interface (Future)
 */
export interface OutfitSuggestion {
  id: string;
  userId: string;
  garmentIds: string[];
  occasion: string;
  season: string;
  suggestedAt: string;
  rating?: number;
}

/**
 * Color Analysis Result Interface (Future)
 */
export interface ColorAnalysis {
  userId: string;
  skinTone?: string;
  seasonType?: string;
  recommendedColors: string[];
  avoidColors: string[];
  analyzedAt: string;
}

// ============================================
// AI Features Types
// ============================================

/**
 * AI Feature Type
 */
export type AIFeature = 'ai-edit' | 'virtual-tryon' | 'fabric-mixer';

/**
 * AI Feature Access Information
 */
export interface AIFeatureAccess {
  accessible: boolean;
  requiredTier: SubscriptionTier;
  tierName: string;
}

/**
 * Complete AI Features Status
 */
export interface AIFeaturesStatus {
  aiEdit: AIFeatureAccess;
  virtualTryOn: AIFeatureAccess;
  fabricMixer: AIFeatureAccess;
  currentTier: SubscriptionTier;
}
