import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../components/GradientBackground';
import GlassmorphicCard from '../components/GlassmorphicCard';
import NeuButton from '../components/NeuButton';
import IconGrid, { IconGridItem } from '../components/IconGrid';
import { THEME, NEUMORPHIC } from '../config';
import { getUserSubscriptionTier } from '../services/subscriptionService';
import { getAuth } from 'firebase/auth';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  currentTab?: 'home' | 'selfie' | 'calendar' | 'upgrade' | 'settings';
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, currentTab = 'home' }) => {
  const [userTier, setUserTier] = useState<'free' | 'style_plus' | 'style_x'>('free');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUserTier = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const tier = await getUserSubscriptionTier(user.uid);
          setUserTier(tier);
        }
      } catch (error) {
        console.error('Error loading user tier:', error);
      }
    };

    loadUserTier();
  }, []);

// Change these lines in HomeScreen.tsx:
const navigationItems: IconGridItem[] = [
  {
    id: 'wardrobe',
    icon: 'hanger', // ✅ MaterialCommunityIcons name
    label: 'Wardrobe',
    onPress: () => onNavigate('wardrobe'),
  },
  {
    id: 'editor',
    icon: 'brush', // ✅ MaterialCommunityIcons name
    label: 'Editor',
    onPress: () => onNavigate('editor'),
  },
  {
    id: 'color',
    icon: 'palette', // ✅ MaterialCommunityIcons name
    label: 'Color',
    onPress: () => onNavigate('color'),
  },
];


  const getTierBadge = () => {
    switch (userTier) {
      case 'style_plus':
        return ' Style+';
      case 'style_x':
        return ' StyleX';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.wrapper}>
        <GradientBackground>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Welcome Card */}
            <GlassmorphicCard style={styles.welcomeCard} intensity="medium">
              <Text style={styles.welcomeTitle}>
                Welcome to FitFX{getTierBadge()}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Elevate Your Style with AI-Powered Suggestions
              </Text>
            </GlassmorphicCard>

            {/* Section Title */}
            <Text style={styles.sectionTitle}>What would you like to do?</Text>

            {/* Navigation Grid */}
            <IconGrid items={navigationItems} columns={3} />

            {/* Featured Section */}
            <Text style={styles.sectionTitle}>Featured</Text>
            <GlassmorphicCard style={styles.featuredCard} intensity="medium">
              <Text style={styles.featuredTitle}>Today's Suggestion</Text>
              <Text style={styles.featuredDescription}>
                Navy Blue Chinos + White Cotton Shirt + Light Grey Blazer
              </Text>
              <NeuButton
                title="View Details"
                onPress={() => onNavigate('suggestions')}
                size="medium"
                style={styles.button}
              />
            </GlassmorphicCard>

            {/* CTA Section */}
            {userTier === 'free' && (
              <GlassmorphicCard style={styles.ctaCard} intensity="medium">
                <Text style={styles.ctaTitle}>Ready to upgrade?</Text>
                <Text style={styles.ctaDescription}>
                  Unlock unlimited outfits and premium AI features
                </Text>
                <NeuButton
                  title="Upgrade Now"
                  onPress={() => onNavigate('upgrade')}
                  size="medium"
                  style={styles.button}
                />
              </GlassmorphicCard>
            )}

            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </GradientBackground>

        {/* BOTTOM NAVIGATION BAR */}
        <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 8 }]}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={currentTab === 'home' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text style={[styles.navLabel, currentTab === 'home' && styles.navLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('selfie')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'selfie' ? 'camera' : 'camera-outline'}
              size={22}
              color={currentTab === 'selfie' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text style={[styles.navLabel, currentTab === 'selfie' && styles.navLabelActive]}>
              Selfie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('calendar')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'calendar' ? 'calendar' : 'calendar-outline'}
              size={22}
              color={currentTab === 'calendar' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text style={[styles.navLabel, currentTab === 'calendar' && styles.navLabelActive]}>
              Calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('upgrade')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'upgrade' ? 'rocket' : 'rocket-outline'}
              size={22}
              color={currentTab === 'upgrade' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text style={[styles.navLabel, currentTab === 'upgrade' && styles.navLabelActive]}>
              Upgrade
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate('settings')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentTab === 'settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={currentTab === 'settings' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text style={[styles.navLabel, currentTab === 'settings' && styles.navLabelActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NEUMORPHIC.bgDarker,
  },
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: THEME.spacing.xxl,
    marginBottom: THEME.spacing.xl,
    height: 70,
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  welcomeCard: {
    marginBottom: THEME.spacing.xl,
    padding: THEME.spacing.lg,
  },
  welcomeTitle: {
    fontSize: THEME.typography.heading2.fontSize,
    fontWeight: THEME.typography.heading2.fontWeight,
    lineHeight: THEME.typography.heading2.lineHeight,
    color: NEUMORPHIC.textPrimary,
    marginBottom: THEME.spacing.sm,
    letterSpacing: THEME.typography.heading2.letterSpacing,
  },
  welcomeSubtitle: {
    fontSize: THEME.typography.body.fontSize,
    fontWeight: THEME.typography.body.fontWeight,
    lineHeight: THEME.typography.body.lineHeight,
    color: NEUMORPHIC.textSecondary,
    letterSpacing: THEME.typography.body.letterSpacing,
  },
  sectionTitle: {
    fontSize: THEME.typography.heading3.fontSize,
    fontWeight: THEME.typography.heading3.fontWeight,
    lineHeight: THEME.typography.heading3.lineHeight,
    color: NEUMORPHIC.textPrimary,
    marginVertical: THEME.spacing.lg,
    letterSpacing: THEME.typography.heading3.letterSpacing,
  },
  featuredCard: {
    marginBottom: THEME.spacing.lg,
    padding: THEME.spacing.lg,
  },
  featuredTitle: {
    fontSize: THEME.typography.heading3.fontSize,
    fontWeight: THEME.typography.heading3.fontWeight,
    lineHeight: THEME.typography.heading3.lineHeight,
    color: NEUMORPHIC.textPrimary,
    marginBottom: THEME.spacing.sm,
    letterSpacing: THEME.typography.heading3.letterSpacing,
  },
  featuredDescription: {
    fontSize: THEME.typography.body.fontSize,
    fontWeight: THEME.typography.body.fontWeight,
    lineHeight: THEME.typography.body.lineHeight,
    color: NEUMORPHIC.textSecondary,
    marginBottom: THEME.spacing.lg,
    letterSpacing: THEME.typography.body.letterSpacing,
  },
  ctaCard: {
    marginBottom: THEME.spacing.xl,
    padding: THEME.spacing.lg,
  },
  ctaTitle: {
    fontSize: THEME.typography.heading3.fontSize,
    fontWeight: THEME.typography.heading3.fontWeight,
    lineHeight: THEME.typography.heading3.lineHeight,
    color: NEUMORPHIC.textPrimary,
    marginBottom: THEME.spacing.sm,
    letterSpacing: THEME.typography.heading3.letterSpacing,
  },
  ctaDescription: {
    fontSize: THEME.typography.body.fontSize,
    fontWeight: THEME.typography.body.fontWeight,
    lineHeight: THEME.typography.body.lineHeight,
    color: NEUMORPHIC.textSecondary,
    marginBottom: THEME.spacing.lg,
    letterSpacing: THEME.typography.body.letterSpacing,
  },
  button: {
    width: '100%',
    paddingVertical: THEME.spacing.md,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(19, 22, 31, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 10,
    color: NEUMORPHIC.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#00CED1',
    fontWeight: '600',
  },
});

export default HomeScreen;
