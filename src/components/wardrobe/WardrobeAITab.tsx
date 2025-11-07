import React, { useState, useEffect } from 'react';
import {
  View, // ✅ FIX: Changed from ScrollView
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';

import GlassmorphicCard from '../GlassmorphicCard';
import { THEME, NEUMORPHIC } from '../../config';
import { getAIFeaturesStatus } from '../../services/aiFeaturesAccessService';
import type { AIFeature, AIFeaturesStatus, Garment } from '../../types';

// Import AI Feature Components
import AIEditMobile from './AIEditMobile';
import AITryOnMobile from './AITryOnMobile';
import AIFabricMixerMobile from './AIFabricMixerMobile';

interface WardrobeAITabProps {
  wardrobe?: Garment[];
  onNavigate: (screen: string) => void;
}

type AIFeatureType = AIFeature | null;

const WardrobeAITab: React.FC<WardrobeAITabProps> = ({ wardrobe, onNavigate }) => {
  const [featuresStatus, setFeaturesStatus] = useState<AIFeaturesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<AIFeatureType>(null);

  const auth = getAuth();
  const userId = auth.currentUser?.uid || '';

  useEffect(() => {
    loadFeatures();
  }, [userId]);

  const loadFeatures = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await getAIFeaturesStatus(userId);
      setFeaturesStatus(status);
    } catch (error) {
      console.error('❌ Error loading AI features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature: AIFeatureType, accessible: boolean, requiredTier: string) => {
    if (!accessible) {
      Alert.alert(
        '🔒 Upgrade Required',
        `This feature requires ${requiredTier} subscription. Upgrade to unlock!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade Now',
            onPress: () => onNavigate('upgrade'),
            style: 'default',
          },
        ]
      );
      return;
    }

    setSelectedFeature(selectedFeature === feature ? null : feature);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00CED1" />
        <Text style={styles.loadingText}>Loading AI Features...</Text>
      </View>
    );
  }

  if (!featuresStatus) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={NEUMORPHIC.textSecondary} />
        <Text style={styles.errorText}>Failed to load AI features</Text>
      </View>
    );
  }

  const features = [
    {
      id: 'ai-edit' as AIFeature,
      title: 'AI Edit',
      icon: '🎨',
      description: 'Transform your style with AI-powered edits',
      accessible: featuresStatus.aiEdit.accessible,
      requiredTier: featuresStatus.aiEdit.tierName,
      color: '#00CED1',
    },
    {
      id: 'virtual-tryon' as AIFeature,
      title: 'Virtual Try-On',
      icon: '👗',
      description: 'See how clothes look on you virtually',
      accessible: featuresStatus.virtualTryOn.accessible,
      requiredTier: featuresStatus.virtualTryOn.tierName,
      color: '#FFA500',
    },
    {
      id: 'fabric-mixer' as AIFeature,
      title: 'Fabric Mixer',
      icon: '🧵',
      description: 'Mix and match fabrics with AI creativity',
      accessible: featuresStatus.fabricMixer.accessible,
      requiredTier: featuresStatus.fabricMixer.tierName,
      color: '#9D5CFF',
    },
  ];

  return (
    // ✅ FIX: Changed from <ScrollView> to <View> to prevent gesture conflict
    <View style={styles.container}>
      {/* Feature Cards with Dropdown */}
      {features.map((feature) => (
        <View key={feature.id}>
          {/* Feature Card */}
          <TouchableOpacity
            style={[
              styles.featureCard,
              !feature.accessible && styles.featureCardLocked,
              selectedFeature === feature.id && styles.featureCardActive,
            ]}
            onPress={() => handleFeatureClick(feature.id, feature.accessible, feature.requiredTier)}
            activeOpacity={0.7}
          >
            <View style={styles.featureHeader}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>

              <View style={styles.featureStatus}>
                {feature.accessible ? (
                  <View style={[styles.statusBadge, { backgroundColor: `${feature.color}20`, borderColor: `${feature.color}50` }]}>
                    <Text style={[styles.statusText, { color: feature.color }]}>
                      {selectedFeature === feature.id ? '▼' : '▶'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={16} color="#FFA500" />
                    <Text style={styles.lockText}>{feature.requiredTier}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
          {selectedFeature === feature.id && feature.accessible && (
            <View style={styles.expandedContent}>
              {feature.id === 'ai-edit' && <AIEditMobile wardrobe={wardrobe} />}
              {feature.id === 'virtual-tryon' && <AITryOnMobile />}
              {feature.id === 'fabric-mixer' && <AIFabricMixerMobile />}
            </View>
          )}
        </View>
      ))}

      {/* Upgrade Banner */}
      {(!featuresStatus.virtualTryOn.accessible || !featuresStatus.fabricMixer.accessible) && (
        <GlassmorphicCard style={styles.upgradeBanner} intensity="dark">
          <Ionicons name="star-outline" size={32} color="#FFD700" />
          <Text style={styles.upgradeTitle}>Unlock More AI Features</Text>
          <Text style={styles.upgradeSubtitle}>
            Upgrade to access Virtual Try-On and Fabric Mixer
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => onNavigate('upgrade')}
          >
            <Text style={styles.upgradeButtonText}>View Plans</Text>
          </TouchableOpacity>
        </GlassmorphicCard>
      )}

      <View style={{ height: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1, // We can keep this, or remove it. It's fine.
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 14,
    marginTop: THEME.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  errorText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 16,
    marginTop: THEME.spacing.md,
  },
  featureCard: {
    backgroundColor: 'rgba(20, 22, 25, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureCardLocked: {
    opacity: 0.7,
  },
  featureCardActive: {
    borderColor: 'rgba(0, 206, 209, 0.4)',
    backgroundColor: 'rgba(0, 206, 209, 0.05)',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  featureStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    gap: 4,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFA500',
  },
  expandedContent: {
    marginTop: -8,
    marginBottom: 12,
    backgroundColor: 'rgba(20, 22, 25, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.2)',
  },
  upgradeBanner: {
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 6,
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#00CED1',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default WardrobeAITab;