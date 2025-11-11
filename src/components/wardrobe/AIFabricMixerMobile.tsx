import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const AIFabricMixerMobile: React.FC = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [clothingPart, setClothingPart] = useState<'top' | 'bottom'>('top');
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ FIX 1: AbortController
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // ✅ FIX 2: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setLoading(false);
      setElapsedTime(0);
      setModalVisible(false);
      setPersonImage(null);
      setFabricImage(null);
      setEditedImage(null);
      console.log('🧹 AIFabricMixerMobile unmounted - cleaned up resources');
    };
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    let interval: any; // ✅ FIX 3: Changed type
    if (loading) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [loading]);

  // Format elapsed time to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pick Person Image
  const pickPersonImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPersonImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Pick person image error:', error);
    }
  };

  // Take Person Photo
  const takePersonPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPersonImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Camera error:', error);
    }
  };

  // Pick Fabric Image
  const pickFabricImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFabricImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick fabric image');
      console.error('Pick fabric image error:', error);
    }
  };

  // Take Fabric Photo
  const takeFabricPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFabricImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture fabric photo');
      console.error('Camera error:', error);
    }
  };

  // ✅ FIX 4: AI Fabric Mix with AbortController
  const handleFabricMix = async () => {
    // ✅ FIX 5: Prevent multiple requests
    if (loading) {
      Alert.alert('Processing', 'Please wait for current request to complete');
      return;
    }

    if (!personImage || !fabricImage) {
      Alert.alert('Missing Images', 'Please upload both person and fabric images');
      return;
    }

    if (!GEMINI_API_KEY) {
      Alert.alert('Configuration Error', 'Gemini API key not configured');
      console.error('API Key:', GEMINI_API_KEY);
      return;
    }

    setLoading(true);

    // ✅ FIX 6: Create AbortController
    abortControllerRef.current = new AbortController();

    try {
      // Build detailed prompt for fabric mixing
      const prompt = `You are an expert fashion AI specializing in fabric pattern application and virtual wardrobe styling.

TASK: Apply the provided fabric pattern/texture to the ${clothingPart} of the person's clothing in the image.

FABRIC APPLICATION REQUIREMENTS:
1. Apply the fabric pattern ONLY to the ${clothingPart === 'top' ? 'shirt, jacket, or upper garment' : 'pants, skirt, or lower garment'}
2. Preserve the garment's original shape, cut, and style
3. Maintain realistic fabric draping, folds, and shadows
4. Match lighting conditions with the original photo
5. Keep the fabric pattern aligned with the garment's contours
6. DO NOT change: Person's face, hair, body, pose, or background
7. DO NOT change: The other clothing items (keep ${clothingPart === 'top' ? 'bottom' : 'top'} unchanged)
8. The result should look professionally tailored, not edited

IMPORTANT NOTES:
- The fabric should blend naturally with the garment's shape
- Maintain realistic texture and material appearance
- Preserve wrinkles and natural clothing movement
- Keep shadows and highlights consistent

OUTPUT: Return ONLY the edited image. Do NOT include text, explanations, or descriptions.`;

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

      // Extract base64 data from both images
      const personBase64 = personImage.split(',')[1];
      const fabricBase64 = fabricImage.split(',')[1];

      console.log('🚀 Sending fabric mix request to Gemini API...');

      // Send BOTH images to Gemini
      const response = await model.generateContent([
        {
          inlineData: {
            data: personBase64,
            mimeType: 'image/jpeg',
          },
        },
        {
          inlineData: {
            data: fabricBase64,
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ]);

      console.log('📡 Gemini Response received');

      // Parse response
      const result = response.response;
      if (!result) throw new Error('No response from Gemini API');

      const candidate = result.candidates?.[0];
      if (!candidate) throw new Error('No candidates in response');

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Request blocked by safety filters. Please try again.');
      }

      const part = candidate.content?.parts?.[0];

      // Handle image data from response
      if (part && 'inlineData' in part && part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/jpeg';
        const imageUrl = `data:${mimeType};base64,${imageData}`;
        setEditedImage(imageUrl);
        console.log('✅ Fabric mix generated successfully!');
        Alert.alert('✅ Success', 'Fabric pattern has been applied!');
      } else if (part && 'text' in part) {
        const text = part.text as string;
        if (text.includes('data:image')) {
          setEditedImage(text);
          Alert.alert('✅ Success', 'Fabric pattern has been applied!');
        } else {
          console.warn('AI returned text instead of image:', text);
          throw new Error('AI returned a text response. Please try again.');
        }
      } else {
        throw new Error('Unexpected response format. Expected image data.');
      }
    } catch (error: any) {
      // ✅ FIX 7: Handle abort errors
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Fabric Mix Error:', errorMessage);
      Alert.alert('Error', `Failed to process fabric mix.\n\n${errorMessage}`);
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // ✅ FIX 8: Clear controller
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Person Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧍 Upload Person Image</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickPersonImage}>
              <Ionicons name="image-outline" size={24} color="#9D5CFF" />
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePersonPhoto}>
              <Ionicons name="camera-outline" size={24} color="#9D5CFF" />
              <Text style={styles.uploadButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Person Image Preview with Modal */}
        {personImage && (
          <View style={styles.imagePreview}>
            <Text style={styles.imageLabel}>Person</Text>
            <TouchableOpacity
              onPress={() => {
                setPreviewImage(personImage);
                setModalVisible(true);
              }}
            >
              <Image source={{ uri: personImage }} style={styles.previewImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Fabric Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧵 Upload Fabric Pattern</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickFabricImage}>
              <Ionicons name="image-outline" size={24} color="#9D5CFF" />
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takeFabricPhoto}>
              <Ionicons name="camera-outline" size={24} color="#9D5CFF" />
              <Text style={styles.uploadButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fabric Image Preview with Modal */}
        {fabricImage && (
          <View style={styles.imagePreview}>
            <Text style={styles.imageLabel}>Fabric Pattern</Text>
            <TouchableOpacity
              onPress={() => {
                setPreviewImage(fabricImage);
                setModalVisible(true);
              }}
            >
              <Image source={{ uri: fabricImage }} style={styles.previewImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Clothing Part Selection */}
        {personImage && fabricImage && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👕 Apply Fabric To</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={clothingPart}
                  onValueChange={(value) => {
                    setClothingPart(value);
                    setEditedImage(null);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Top (Shirt/Jacket)" value="top" />
                  <Picker.Item label="Bottom (Pants/Skirt)" value="bottom" />
                </Picker>
              </View>
            </View>

            {/* Mix Button with Timer */}
            <TouchableOpacity
              style={[styles.mixButton, loading && styles.mixButtonDisabled]}
              onPress={handleFabricMix}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.mixButtonText}>
                    Mixing... {formatTime(elapsedTime)}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="color-wand" size={20} color="#fff" />
                  <Text style={styles.mixButtonText}>Mix Fabric</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Result Preview with Modal */}
        {editedImage && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>✨ Result</Text>
            <TouchableOpacity
              onPress={() => {
                setPreviewImage(editedImage);
                setModalVisible(true);
              }}
            >
              <Image source={{ uri: editedImage }} style={styles.resultImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Card */}
        {!personImage && !fabricImage && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={48} color="#9D5CFF" />
            <Text style={styles.infoTitle}>Fabric Mixer</Text>
            <Text style={styles.infoText}>
              Upload a person image and a fabric pattern. AI will apply the fabric to
              the selected clothing part!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal for Full-Screen Image Preview */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(157, 92, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(157, 92, 255, 0.3)',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9D5CFF',
  },
  imagePreview: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  mixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D5CFF',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
    minHeight: 50,
  },
  mixButtonDisabled: {
    opacity: 0.5,
  },
  mixButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    height: 20,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  infoCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(157, 92, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(157, 92, 255, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(157, 92, 255, 0.3)',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default AIFabricMixerMobile;
