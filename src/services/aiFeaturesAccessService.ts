import { getAuth } from 'firebase/auth';
import { getEffectiveSubscriptionTier } from './wardrobeSubscriptionService';
import type { SubscriptionTier, AIFeature, AIFeaturesStatus } from '../types';

/**
 * Get the required subscription tier for an AI feature
 */
export function getFeatureRequirement(feature: AIFeature): {
  tier: SubscriptionTier;
  tierName: string;
} {
  const requirements = {
    'ai-edit': { tier: 'free' as SubscriptionTier, tierName: 'Free' },
    'virtual-tryon': { tier: 'style_plus' as SubscriptionTier, tierName: 'Style+' },
    'fabric-mixer': { tier: 'style_x' as SubscriptionTier, tierName: 'StyleX' },
  };

  return requirements[feature];
}

/**
 * Check if user can access a specific AI feature
 */
export async function canAccessAIFeature(
  userId: string,
  feature: AIFeature
): Promise<boolean> {
  try {
    const currentTier = await getEffectiveSubscriptionTier(userId);
    const { tier: requiredTier } = getFeatureRequirement(feature);

    // Tier hierarchy: free < style_plus < style_x
    const tierRank: Record<SubscriptionTier, number> = {
      free: 0,
      style_plus: 1,
      style_x: 2,
    };

    return tierRank[currentTier] >= tierRank[requiredTier];
  } catch (error) {
    console.error('❌ Error checking AI feature access:', error);
    return false;
  }
}

/**
 * Get full AI features access status for user
 */
export async function getAIFeaturesStatus(
  userId: string
): Promise<AIFeaturesStatus> {
  try {
    const currentTier = await getEffectiveSubscriptionTier(userId);

    const aiEditReq = getFeatureRequirement('ai-edit');
    const virtualTryOnReq = getFeatureRequirement('virtual-tryon');
    const fabricMixerReq = getFeatureRequirement('fabric-mixer');

    const tierRank: Record<SubscriptionTier, number> = {
      free: 0,
      style_plus: 1,
      style_x: 2,
    };

    return {
      aiEdit: {
        accessible: tierRank[currentTier] >= tierRank[aiEditReq.tier],
        requiredTier: aiEditReq.tier,
        tierName: aiEditReq.tierName,
      },
      virtualTryOn: {
        accessible: tierRank[currentTier] >= tierRank[virtualTryOnReq.tier],
        requiredTier: virtualTryOnReq.tier,
        tierName: virtualTryOnReq.tierName,
      },
      fabricMixer: {
        accessible: tierRank[currentTier] >= tierRank[fabricMixerReq.tier],
        requiredTier: fabricMixerReq.tier,
        tierName: fabricMixerReq.tierName,
      },
      currentTier,
    };
  } catch (error) {
    console.error('❌ Error getting AI features status:', error);
    // Return locked state on error
    return {
      aiEdit: {
        accessible: true,
        requiredTier: 'free',
        tierName: 'Free',
      },
      virtualTryOn: {
        accessible: false,
        requiredTier: 'style_plus',
        tierName: 'Style+',
      },
      fabricMixer: {
        accessible: false,
        requiredTier: 'style_x',
        tierName: 'StyleX',
      },
      currentTier: 'free',
    };
  }
}
