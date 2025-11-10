import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import GradientBackground from '../components/GradientBackground';
import IconGrid, { IconGridItem } from '../components/IconGrid';

import { NEUMORPHIC, AURORA_GRADIENT, STATUS_COLORS } from '../config/colors';
import { THEME } from '../config/theme';

// --- TYPES ---
interface FashionPost {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
  timestamp: string;
}

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  currentTab?: 'home' | 'selfie' | 'calendar' | 'upgrade' | 'settings';
}

// --- NEWS CARD COMPONENT (IMAGE-ONLY) ---
const FashionPostCard: React.FC<{ post: FashionPost }> = ({ post }) => {
  const handlePress = () => {
    if (post.url) {
      Linking.openURL(post.url).catch(() =>
        Alert.alert('Error', 'Could not open this link.')
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
};

// --- HOME SCREEN ---
const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  currentTab = 'home',
}) => {
  const [selfieModalVisible, setSelfieModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<FashionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH FASHION CONTENT FROM PIXABAY API ---
  const fetchFashionContent = async () => {
    try {
      setError(null);
      const allPosts: FashionPost[] = [];

      // ============================================================
      // PRIMARY SOURCE: PIXABAY API - Fashion Images
      // ============================================================
      try {
        const pixabayKey = process.env.EXPO_PUBLIC_PIXABAY_API_KEY;

        // Updated array of fashion-related search terms for better visuals
        const fashionQueries = [
          'street style outfit',
          'fashion model editorial',
          'haute couture',
          'summer fashion trends',
          'winter fashion outfit',
          'fashion aesthetics',
          'minimalist fashion',
          'designer runway show',
          'vogue fashion',
          'fashion week street style',
        ];

        // Pick random query for variety on each refresh
        const randomQuery =
          fashionQueries[Math.floor(Math.random() * fashionQueries.length)];

        const pixabayUrl = `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(
          randomQuery
        )}&image_type=photo&order=popular&per_page=20&safesearch=true&category=fashion`;

        const pixabayResponse = await fetch(pixabayUrl);

        if (pixabayResponse.ok) {
          const pixabayData = await pixabayResponse.json();

          if (pixabayData.hits && Array.isArray(pixabayData.hits)) {
            pixabayData.hits.slice(0, 20).forEach((hit: any, idx: number) => {
              allPosts.push({
                id: `pixabay-${hit.id}-${idx}`,
                // We fetch this data even if not displayed, in case we need it later
                title: `Fashion Inspiration #${idx + 1}`,
                description: `Beautiful fashion photography by ${hit.user}`,
                image: hit.largeImageURL || hit.webformatURL,
                url: hit.pageURL,
                source: 'Pixabay',
                timestamp: new Date().toLocaleDateString(),
              });
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching from Pixabay API:', err);
      }

      // ============================================================
      // PROCESS & DISPLAY RESULTS
      // ============================================================

      if (allPosts.length > 0) {
        setPosts(allPosts);
        setError(null);
      } else {
        setError(
          'No fashion content available. Please check:\n1. Your Pixabay API key is valid\n2. Your internet connection'
        );
      }
    } catch (err: any) {
      console.error('Error fetching fashion content:', err);
      setError('Failed to load fashion content. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFashionContent();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFashionContent();
  };

  const handleTakePhoto = async () => {
    setSelfieModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'We need permission to access your camera.'
      );
      return;
    }
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0].uri) {
        router.push({
          pathname: '/stylist',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleUploadFromGallery = async () => {
    setSelfieModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'We need permission to access your photos.'
      );
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0].uri) {
        router.push({
          pathname: '/stylist',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const navigationItems: IconGridItem[] = [
    {
      id: 'wardrobe',
      icon: 'wardrobe-outline',
      label: 'Wardrobe',
      onPress: () => router.push('/wardrobe'),
    },
    {
      id: 'editor',
      icon: 'auto-fix',
      label: 'Editor',
      onPress: () =>
        router.push({ pathname: '/wardrobe', params: { tab: 'ai' } }),
    },
    {
      id: 'color',
      icon: 'palette',
      label: 'Color',
      onPress: () => onNavigate('color'),
    },
  ];

  const renderHeader = () => (
    <View>
      <View style={styles.logoSection}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.sectionTitle}>What would you like to do?</Text>
      <IconGrid items={navigationItems} columns={3} />

      <Text style={styles.feedTitle}>Latest Fashion Inspiration</Text>

      {loading && !refreshing && (
        <ActivityIndicator
          size="large"
          color={AURORA_GRADIENT.cyan}
          style={{ marginVertical: 40 }}
        />
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.wrapper}>
          <FlatList
            key={'two-column-grid'} // <-- HERE IS THE FIX
            data={posts}
            renderItem={({ item }) => <FashionPostCard post={item} />}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            numColumns={2} // Creates the 2-column grid
            columnWrapperStyle={styles.columnWrapper} // Adds spacing between columns
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={AURORA_GRADIENT.cyan}
              />
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
          />

          <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 8 }]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('home')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'home' ? 'home' : 'home-outline'}
                size={22}
                color={
                  currentTab === 'home'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'home' && styles.navLabelActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setSelfieModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'selfie' ? 'camera' : 'camera-outline'}
                size={22}
                color={
                  currentTab === 'selfie'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'selfie' && styles.navLabelActive,
                ]}
              >
                Selfie
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('calendar')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  currentTab === 'calendar' ? 'calendar' : 'calendar-outline'
                }
                size={22}
                color={
                  currentTab === 'calendar'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'calendar' && styles.navLabelActive,
                ]}
              >
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
                color={
                  currentTab === 'upgrade'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'upgrade' && styles.navLabelActive,
                ]}
              >
                Upgrade
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate('settings')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={currentTab === 'settings' ? 'person' : 'person-outline'}
                size={22}
                color={
                  currentTab === 'settings'
                    ? AURORA_GRADIENT.cyan
                    : NEUMORPHIC.textSecondary
                }
              />
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'settings' && styles.navLabelActive,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={selfieModalVisible}
          onRequestClose={() => {
            setSelfieModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Upload Selfie</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleTakePhoto}
              >
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={AURORA_GRADIENT.cyan}
                />
                <Text style={styles.modalButtonText}>Take a Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleUploadFromGallery}
              >
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={AURORA_GRADIENT.cyan}
                />
                <Text style={styles.modalButtonText}>Upload from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSelfieModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  wrapper: { flex: 1 },
  content: { paddingHorizontal: 16 },
  columnWrapper: {
    // Adds space between the two columns
    justifyContent: 'space-between',
  },

  logoSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    height: 60,
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: NEUMORPHIC.textPrimary,
    marginVertical: 16,
    marginTop: 24,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    color: NEUMORPHIC.textPrimary,
    marginVertical: 16,
    marginTop: 8,
  },

  card: {
    width: '48.5%', // <-- Creates 2 columns with a small gap
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    marginBottom: 12, // <-- Space between rows
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 4 / 5, // <-- Portrait 4:5 aspect ratio (taller than wide)
    backgroundColor: NEUMORPHIC.bgDarker,
  },

  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: 16,
    marginVertical: 20,
  },
  errorText: {
    color: STATUS_COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: AURORA_GRADIENT.cyan,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  errorButtonText: {
    color: NEUMORPHIC.bgDarker,
    fontWeight: '700',
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
    color: AURORA_GRADIENT.cyan,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEUMORPHIC.bgDarker,
    padding: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  modalButtonText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 16,
    marginLeft: 12,
  },
  modalCancelButton: {
    marginTop: 8,
    padding: 10,
  },
  modalCancelButtonText: {
    color: NEUMORPHIC.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;