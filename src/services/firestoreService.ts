import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type {
  Subscription,
  Garment,
  SubscriptionTier,
  UserProfile, // ✅ CORRECTED: Import UserProfile from main types
} from '../types';

/**
 * ✨ Define subscription limits
 */
const SUBSCRIPTION_LIMITS = {
  free: {
    colorSuggestions: 999,
    outfitPreviews: 3,
    wardrobeLimit: 1, // ✅ FIXED: Free = 1 item (matching website)
    imageEditorAccess: false,
    batchGeneration: false,
    chatbotAccess: 'basic',
  },
  style_plus: {
    // ✅ FIXED: Changed from style_plus
    colorSuggestions: 999,
    outfitPreviews: 10,
    wardrobeLimit: 10, // ✅ FIXED: Style+ = 10 items (matching website)
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'standard',
  },
  style_x: {
    // ✅ FIXED: Changed from style_x
    colorSuggestions: 999,
    outfitPreviews: 999,
    wardrobeLimit: -1, // ✅ Unlimited
    imageEditorAccess: true,
    batchGeneration: true,
    chatbotAccess: 'premium',
  },
};

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Clean profile data - remove undefined fields
 */
const cleanProfile = (profile: UserProfile) => {
  const cleaned: any = {};
  if (profile.name) cleaned.name = profile.name;
  if (profile.age) cleaned.age = profile.age;
  if (profile.gender) cleaned.gender = profile.gender;
  if (profile.bodyType) cleaned.bodyType = profile.bodyType;
  if (profile.fashionIcons) cleaned.fashionIcons = profile.fashionIcons;
  if (profile.preferredOccasions)
    cleaned.preferredOccasions = profile.preferredOccasions;
  if (profile.preferredStyles)
    cleaned.preferredStyles = profile.preferredStyles;
  if (profile.favoriteColors)
    cleaned.favoriteColors = profile.favoriteColors;
  if (profile.preferredFabrics)
    cleaned.preferredFabrics = profile.preferredFabrics;
  return cleaned;
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.profile || null;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

/**
 * Save user profile to Firestore
 */
export const saveUserProfile = async (
  userId: string,
  profile: UserProfile
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const cleanedProfile = cleanProfile(profile);

    await setDoc(
      userRef,
      {
        profile: cleanedProfile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Profile saved successfully');
  } catch (error) {
    console.error('❌ Error saving profile:', error);
    throw new Error('Failed to save profile. Please try again.');
  }
};

/**
 * Load user profile from Firestore
 */
export const loadUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.profile || null;
    }

    return null;
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    throw new Error('Failed to load profile.');
  }
};

/**
 * Check if user has completed profile
 */
export const hasCompletedProfile = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return !!data.profile && !!data.profile.name;
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking profile:', error);
    return false;
  }
};

// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================

/**
 * Initialize subscription for new user
 */
export const initializeSubscription = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const subscription: Subscription = {
      tier: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
    };

    await setDoc(
      userRef,
      {
        subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Subscription initialized');
  } catch (error) {
    console.error('❌ Error initializing subscription:', error);
    throw new Error('Failed to initialize subscription.');
  }
};

/**
 * Get user subscription
 */
export async function getSubscription(
  uid: string
): Promise<Subscription | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.subscription || null;
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Update subscription tier
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
    });
    console.log(`✅ Subscription updated to ${tier} for user ${uid}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
}

/**
 * Get subscription tier
 */
export async function getUserSubscriptionTier(
  uid: string
): Promise<SubscriptionTier> {
  try {
    const subscription = await getSubscription(uid);
    return subscription?.tier || 'free';
  } catch (error) {
    console.error('❌ Error getting subscription tier:', error);
    return 'free';
  }
}

/**
 * Get subscription limits
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
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking subscription validity:', error);
    return false;
  }
}

export const SubscriptionLimits = SUBSCRIPTION_LIMITS;

// ============================================
// WARDROBE FUNCTIONS
// ============================================

/**
 * Load wardrobe from Firestore
 */
export const loadWardrobe = async (userId: string): Promise<Garment[]> => {
  try {
    if (!userId) {
      console.warn('⚠️ No userId provided to loadWardrobe');
      return [];
    }

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const wardrobe = (data.wardrobe || []) as Garment[];
      console.log(`✅ Loaded ${wardrobe.length} wardrobe items`);
      return wardrobe;
    } else {
      console.log('📭 No wardrobe data found for user');
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading wardrobe:', error);
    return []; // ✅ Return empty array instead of throwing
  }
};

/**
 * Add wardrobe item to Firestore
 */
export const addWardrobeItem = async (
  userId: string,
  garment: Garment
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('No userId provided');
    }

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    const garmentWithMeta: Garment = {
      ...garment,
      id: garment.id || `garment-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };

    if (!docSnap.exists()) {
      // ✅ Create new user document with wardrobe
      await setDoc(docRef, {
        wardrobe: [garmentWithMeta],
        subscription: {
          tier: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Created new user document with wardrobe item');
    } else {
      // ✅ Add to existing wardrobe
      await updateDoc(docRef, {
        wardrobe: arrayUnion(garmentWithMeta),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Added wardrobe item to existing user');
    }
  } catch (error) {
    console.error('❌ Error adding wardrobe item:', error);
    throw new Error('Failed to add wardrobe item. Please try again.');
  }
};

/**
 * Update wardrobe item in Firestore
 */
export const updateWardrobeItem = async (
  userId: string,
  index: number,
  updatedGarment: Garment,
  allGarments: Garment[]
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('No userId provided');
    }

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User document does not exist');
    }

    const updatedWardrobe = [...allGarments];
    const existingGarment = allGarments[index];

    updatedWardrobe[index] = {
      ...updatedGarment,
      id: existingGarment?.id || `garment-${Date.now()}`,
      uploadedAt: existingGarment?.uploadedAt || new Date().toISOString(),
    };

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Wardrobe item updated');
  } catch (error) {
    console.error('❌ Error updating wardrobe item:', error);
    throw new Error('Failed to update wardrobe item. Please try again.');
  }
};

/**
 * Delete wardrobe item from Firestore
 */
export const deleteWardrobeItem = async (
  userId: string,
  index: number,
  allGarments: Garment[]
): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('No userId provided');
    }

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('User document does not exist');
    }

    const updatedWardrobe = allGarments.filter((_, i) => i !== index);

    await updateDoc(docRef, {
      wardrobe: updatedWardrobe,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Wardrobe item deleted');
  } catch (error) {
    console.error('❌ Error deleting wardrobe item:', error);
    throw new Error('Failed to delete wardrobe item. Please try again.');
  }
};