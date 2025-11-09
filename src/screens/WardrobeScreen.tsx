import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'; // ✅ ADDED: useLocalSearchParams
import { onAuthStateChanged } from 'firebase/auth';

// ✅ FIX: Correct imports
import { auth } from '../config/firebaseConfig';

// Components
import GradientBackground from '../components/GradientBackground';
import WardrobeItemsTab from '../components/wardrobe/WardrobeItemsTab';
import WardrobeAITab from '../components/wardrobe/WardrobeAITab';
import AddItemModal from '../components/wardrobe/AddItemModal';
import EditItemModal from '../components/wardrobe/EditItemModal';

// Config & Types
import { THEME, NEUMORPHIC } from '../config';
import type { Garment, WardrobeStatus } from '../types';

// Services
import {
  loadWardrobe,
  addWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
} from '../services/firestoreService';
import {
  getWardrobeStatus,
  canUserAddWardrobeItem,
  getEffectiveSubscriptionTier,
} from '../services/wardrobeSubscriptionService';
import {
  pickImageFromGallery,
  convertImageToBase64,
} from '../services/wardrobeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const WardrobeScreen: React.FC = () => {
  // ✅ ADDED: Get search parameters from router
  const { tab } = useLocalSearchParams<{ tab?: 'items' | 'ai' }>();

  // ✅ UPDATED: Use 'tab' param for initial state, default to 'items'
  const [activeTab, setActiveTab] = useState<'items' | 'ai'>(
    tab === 'ai' ? 'ai' : 'items'
  );
  const [wardrobe, setWardrobe] = useState<Garment[]>([]);
  const [status, setStatus] = useState<WardrobeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');

  // Edit Item Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Garment | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  // Options Menu State
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);

  // Success Toast State
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpacity] = useState(new Animated.Value(0));

  // Swipe Animation
  const translateX = useRef(new Animated.Value(0)).current;

  // ✅ FIX: COMPLETE bi-directional Pan Responder with onPanResponderMove
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (not vertical scrolling)
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // ✅ CRITICAL: This provides visual feedback during swipe
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldSwitch = Math.abs(gestureState.dx) > SWIPE_THRESHOLD;

        if (shouldSwitch) {
          // ✅ Swipe RIGHT (positive dx) → Go to Items
          if (gestureState.dx > 0 && activeTab === 'ai') {
            switchTab('items');
          }
          // ✅ Swipe LEFT (negative dx) → Go to AI
          else if (gestureState.dx < 0 && activeTab === 'items') {
            switchTab('ai');
          } else {
            resetSwipe();
          }
        } else {
          resetSwipe();
        }
      },
    })
  ).current;

  const switchTab = (tab: 'items' | 'ai') => {
    setActiveTab(tab);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // ✅ Auth & Wardrobe Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadWardrobeData(user.uid);
      } else {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ ADDED: Listen for changes to 'tab' param and switch tab if needed
  useEffect(() => {
    if (tab === 'ai' && activeTab !== 'ai') {
      switchTab('ai');
    } else if (tab === 'items' && activeTab !== 'items') {
      switchTab('items');
    }
  }, [tab]);

  // Load wardrobe data
  const loadWardrobeData = async (uid: string) => {
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await loadWardrobe(uid);
      setWardrobe(items);

      const wardrobeStatus = await getWardrobeStatus(uid, items);
      setStatus(wardrobeStatus);

      console.log('✅ Wardrobe loaded:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error loading wardrobe:', error);
      Alert.alert('Error', 'Failed to load wardrobe items');
    } finally {
      setLoading(false);
    }
  };

  // Show Success Toast Animation
  const showSuccessToastMessage = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessToast(false);
    });
  };

  // Refresh handler
  const onRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await loadWardrobeData(userId);
    setRefreshing(false);
  };

  // ✅ Navigation handler
  const handleNavigate = (screen: string) => {
    switch (screen) {
      case 'home':
        router.push('/');
        break;
      case 'wardrobe':
        // Already on wardrobe
        break;
      case 'upgrade':
        console.log('Upgrade - coming soon');
        // TODO: Navigate to subscription screen
        break;
      default:
        console.log(`Navigation to ${screen} - coming soon`);
    }
  };

  // Add item handler
  const handleAddItem = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please log in to add items');
      return;
    }

    const canAdd = await canUserAddWardrobeItem(userId, wardrobe.length);

    if (!canAdd) {
      const tier = await getEffectiveSubscriptionTier(userId);

      Alert.alert(
        '🔒 Upgrade Required',
        tier === 'free'
          ? 'Free plan allows 1 wardrobe item. Upgrade to Style+ for 10 items or StyleX for unlimited!'
          : "You've reached your wardrobe limit. Upgrade to StyleX for unlimited items!",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade Now',
            onPress: () => handleNavigate('upgrade'),
            style: 'default',
          },
        ]
      );
      return;
    }

    const imageUri = await pickImageFromGallery();

    if (imageUri) {
      setNewImage(imageUri);
      setShowAddModal(true);
    }
  };

  // Confirm add item
  const confirmAddItem = async () => {
    if (!userId || !newImage) return;

    if (!material.trim() || !color.trim()) {
      Alert.alert('Error', 'Please fill in all fields (Material and Color)');
      return;
    }

    setUploading(true);

    try {
      const base64Image = await convertImageToBase64(newImage);

      const newGarment: Garment = {
        image: base64Image,
        material: material.trim(),
        color: color.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await addWardrobeItem(userId, newGarment);
      await loadWardrobeData(userId);

      setNewImage(null);
      setMaterial('');
      setColor('');
      setShowAddModal(false);

      showSuccessToastMessage('Item added to wardrobe!');
    } catch (error) {
      console.error('❌ Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Open edit modal
  const openEditModal = (item: Garment, index: number) => {
    setEditingItem(item);
    setEditingIndex(index);
    setShowEditModal(true);
    setShowOptionsMenu(null);
  };

  // Confirm edit item
  const confirmEditItem = async (editMaterial: string, editColor: string) => {
    if (!userId || !editingItem) return;

    setUploading(true);

    try {
      const updatedItem: Garment = {
        ...editingItem,
        material: editMaterial.trim(),
        color: editColor.trim(),
      };

      await updateWardrobeItem(userId, editingIndex, updatedItem, wardrobe);
      await loadWardrobeData(userId);

      setShowEditModal(false);
      setEditingItem(null);
      setEditingIndex(-1);

      showSuccessToastMessage('Item updated successfully!');
    } catch (error) {
      console.error('❌ Error updating item:', error);
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setUploading(false);
    }
  };

  // Delete item handler
  const handleDelete = (index: number) => {
    if (!userId) return;

    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWardrobeItem(userId, index, wardrobe);
            await loadWardrobeData(userId);
            setShowOptionsMenu(null);
            showSuccessToastMessage('Item deleted successfully!');
          } catch (error) {
            console.error('❌ Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00CED1" />
            <Text style={styles.loadingText}>Loading wardrobe...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={NEUMORPHIC.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wardrobe</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'items' && styles.tabActive]}
            onPress={() => switchTab('items')}
          >
            <Ionicons
              name="shirt-outline"
              size={20}
              color={activeTab === 'items' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}
            >
              Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'ai' && styles.tabActive]}
            onPress={() => switchTab('ai')}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={activeTab === 'ai' ? '#00CED1' : NEUMORPHIC.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}
            >
              AI Looks
            </Text>
          </TouchableOpacity>
        </View>

        {/*  FIX: Swipeable Content Container - PanResponder on outer View */}
        <View style={styles.contentWrapper} {...panResponder.panHandlers}>
          <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {/* Tab Content */}
              {activeTab === 'items' && (
                <WardrobeItemsTab
                  wardrobe={wardrobe}
                  status={status}
                  showOptionsMenu={showOptionsMenu}
                  setShowOptionsMenu={setShowOptionsMenu}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onAddItem={handleAddItem}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'ai' && (
                <WardrobeAITab wardrobe={wardrobe} onNavigate={handleNavigate} />
              )}

              {/* Bottom Padding */}
              <View style={{ height: 100 }} />
            </ScrollView>
          </Animated.View>
        </View>

        {/* FIX: ONLY ONE FAB - Bottom Right, Above Nav Bar, ONLY on Items Tab */}
        {activeTab === 'items' && (
          <TouchableOpacity style={styles.floatingAddButton} onPress={handleAddItem}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Add Item Modal */}
      <AddItemModal
        visible={showAddModal}
        image={newImage}
        material={material}
        color={color}
        uploading={uploading}
        onMaterialChange={setMaterial}
        onColorChange={setColor}
        onConfirm={confirmAddItem}
        onCancel={() => {
          setShowAddModal(false);
          setNewImage(null);
          setMaterial('');
          setColor('');
        }}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        visible={showEditModal}
        item={editingItem}
        uploading={uploading}
        onConfirm={confirmEditItem}
        onCancel={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setEditingIndex(-1);
        }}
      />

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <Animated.View style={[styles.successToast, { opacity: toastOpacity }]}>
          <View style={styles.toastContent}>
            <View style={styles.toastIconContainer}>
              <View style={styles.toastCheckmark} />
            </View>
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>Success!</Text>
              <Text style={styles.toastMessage}>{toastMessage}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: NEUMORPHIC.textPrimary,
    fontSize: THEME.typography.body.fontSize,
    marginTop: THEME.spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: THEME.typography.heading2.fontSize,
    fontWeight: THEME.typography.heading2.fontWeight,
    color: NEUMORPHIC.textPrimary,
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 22, 25, 0.6)',
    borderRadius: 12,
    padding: 4,
    marginBottom: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 206, 209, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: NEUMORPHIC.textSecondary,
  },
  tabTextActive: {
    color: '#00CED1',
  },

  // ✅ FIX: Floating Add Button - Bottom Right, Above Navigation
  floatingAddButton: {
    position: 'absolute',
    bottom: 90, // Above bottom navigation bar
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00CED1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },

  // Success Toast Styles
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 22, 25, 0.95)',
    borderRadius: 16,
    padding: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 206, 209, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00CED1',
    position: 'relative',
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  toastMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
});

export default WardrobeScreen;