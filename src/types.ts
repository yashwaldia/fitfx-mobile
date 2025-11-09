// ============================================
// FitFX Mobile - Complete Type Definitions (UPDATED)
// ============================================

/**
 * Subscription Tier Type
 */
export type SubscriptionTier = 'free' | 'style_plus' | 'style_x';

/**
 * Garment Interface - MOBILE APP VERSION
 */
export interface Garment {
  id?: string;
  image?: string; 
  imageUrl?: string; 
  material?: string; 
  type?: string;
  color: string; 
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

// ============================================
// PROFILE CREATION TYPES (From Website)
// ============================================

export type ProfileGender = 'Male' | 'Female' | 'Unisex' | 'Kids';
export type Style = 'American' | 'Indian' | 'Fusion' | 'Other';
export type ProfileOccasion = 
  | 'Traditional'
  | 'Cultural'
  | 'Modern'
  | 'Casual'
  | 'Festive'
  | 'Wedding'
  | 'Formal'
  | 'Business'
  | 'Street Fusion';
export type AgeGroup = 
  | 'Teen (13-17)'
  | 'Young Adult (18-25)'
  | 'Adult (26-35)'
  | 'Middle-Aged (36-45)'
  | 'Senior (46+)';
export type BodyType = 
  | 'Rectangle'
  | 'Triangle'
  | 'Inverted Triangle'
  | 'Hourglass'
  | 'Oval'; // ... and others from website

/**
 * User Profile Interface (Consolidated and Corrected)
 */
export interface UserProfile {
  name: string;
  age?: AgeGroup | string; // ✅ ADDED AgeGroup
  gender?: ProfileGender; // ✅ Use ProfileGender
  bodyType?: BodyType; // ✅ ADDED BodyType
  fashionIcons?: string;
  preferredOccasions?: ProfileOccasion[]; // ✅ Use ProfileOccasion
  preferredStyles?: Style[]; // ✅ Use Style
  favoriteColors?: string[]; // ✅ FIXED: Changed from string to string[]
  preferredFabrics?: string[]; // ✅ ADDED
  hasSeenPlanModal?: boolean;
  subscription?: Subscription;
  wardrobe?: Garment[];
}

// ============================================
// STYLIST (getStyleAdvice) TYPES (From Website)
// ============================================

export interface ColorPaletteItem {
  colorName: string;
  hexCode: string;
  description: string;
}

export interface OutfitIdea {
  outfitName: string;
  colorName: string;
  fabricType: string;
  idealOccasion: string;
  whyItWorks: string;
  suggestedPairingItems: string;
}

export interface AIGeneratedDressRow {
  country: string;
  gender: string;
  dressName: string;
  description: string;
  occasion: string;
  notes: string;
}

export interface StyleAdvice {
  fashionSummary: string;
  colorPalette: ColorPaletteItem[];
  outfitIdeas: OutfitIdea[];
  wardrobeOutfitIdeas: OutfitIdea[];
  generatedDressMatrix: AIGeneratedDressRow[];
  materialAdvice: string;
  motivationalNote: string;
}

// ============================================
// AI Features Types
// ============================================

/**
 * AI Feature Type
 */
export type AIFeature =
  | 'ai-edit'
  | 'virtual-tryon'
  | 'fabric-mixer'
  | 'color-suggestion';

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
  colorSuggestion: AIFeatureAccess;
  currentTier: SubscriptionTier;
}

// ============================================
// COLOR SUGGESTION TYPES (Separate from Profile)
// ============================================

/**
 * Occasion Type - When to wear the color
 */
export type ColorOccasion =
  | 'casual'
  | 'formal'
  | 'party'
  | 'business'
  | 'wedding'
  | 'all';

/**
 * Country Type - User's location for cultural context
 */
export type Country = 'USA' | 'India' | 'UK' | 'Canada' | 'Australia' | string;

/**
 * Gender Type - For personalized styling
 */
export type ColorGender = 'male' | 'female' | 'non-binary';

/**
 * Color Suggestion Interface
 */
export interface ColorSuggestion {
  colorName: string;
  hexCode: string;
  occasion: ColorOccasion; // ✅ Use ColorOccasion
  description: string;
  stylingTips?: string;
  bestFor?: string;
}

/**
 * Color Palette Interface
 */
export interface ColorPalette {
  userId: string;
  occasion: ColorOccasion;
  country: Country;
  gender: ColorGender;
  age: string;
  colors: ColorSuggestion[];
  generatedAt: Date;
  fashionSummary?: string;
  materialAdvice?: string;
  motivationalNote?: string;
}

/**
 * Color Matrix Item (alias for ColorSuggestion in matrix)
 */
export type ColorMatrixItem = ColorSuggestion & {
  id?: string;
  index?: number;
};

// ============================================
// Utility Types & Constants
// ============================================

/**
 * Available Countries for Color Suggestion
 */
export const AVAILABLE_COUNTRIES: Country[] = [
  'USA',
  'India',
  'UK',
  'Canada',
  'Australia',
];

/**
 * Available Occasions for Color Suggestion
 */
export const AVAILABLE_OCCASIONS: ColorOccasion[] = [
  'casual',
  'formal',
  'party',
  'business',
  'wedding',
  'all',
];

/**
 * Subscription Tier Feature Limits
 */
export const COLOR_SUGGESTION_LIMITS: Record<SubscriptionTier, number> = {
  free: 999,
  style_plus: 999,
  style_x: 999,
};