import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Garment } from '../../types';

// Get Gemini API key from expo config (.env or app.json)
const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.geminiApiKey ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface AIEditMobileProps {
  wardrobe?: Garment[];
}

const AIEditMobile: React.FC<AIEditMobileProps> = ({ wardrobe }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // ✅ FIX 1: AbortController to cancel requests on unmount
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // ✅ FIX 2: Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setLoading(false);
      setElapsedTime(0);
      setModalVisible(false);
      setOriginalImage(null);
      setEditedImage(null);
      console.log('🧹 Component unmounted - cleaned up resources');
    };
  }, []);

  // Timer for elapsed time during processing
  useEffect(() => {
    let interval: any; // ✅ FIX 3: Changed type to 'any'
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

  // Pick image from gallery
  const pickImage = async () => {
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
        setOriginalImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Pick image error:', error);
    }
  };

  // Capture image via camera
  const takePhoto = async () => {
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
        setOriginalImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Camera error:', error);
    }
  };

  // ✅ FIX 4: Generate with AbortController support
  const handleAIEdit = async () => {
    // ✅ FIX 5: Prevent multiple simultaneous requests
    if (loading) {
      Alert.alert('Processing', 'Please wait for current request to complete');
      return;
    }

    if (!originalImage) {
      Alert.alert('No Image', 'Please upload an image first');
      return;
    }
    if (!userInput.trim()) {
      Alert.alert('No Instructions', 'Please enter editing instructions');
      return;
    }
    if (!GEMINI_API_KEY) {
      Alert.alert('Configuration Error', 'Gemini API key not configured');
      console.error('API Key:', GEMINI_API_KEY);
      return;
    }

    setLoading(true);

    // ✅ FIX 6: Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const prompt = `You are an expert fashion image editor specializing in AI-powered virtual try-on and outfit styling.

IMPORTANT INSTRUCTIONS:
1. The user provides a REAL photo of themselves wearing clothes
2. They want you to EDIT the clothing in the image based on their specific request
3. You must ONLY modify the clothing as requested - do NOT change the person's body, face, or pose
4. The edited clothing must look REALISTIC and properly fitted on the person
5. Maintain consistent lighting, shadows, and colors with the original photo
6. Make sure the clothing changes blend naturally with the rest of the image

USER'S CLOTHING EDIT REQUEST: ${userInput}

IMPORTANT: Return ONLY the edited image. Do NOT include any text, explanations, or descriptions.`;

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
      const base64Image = originalImage.split(',')[1];

      console.log('🚀 Sending request to Gemini API...');

      const response = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        prompt,
      ]);

      console.log('📡 Gemini Response received');

      const result = response.response;
      if (!result) throw new Error('No response from Gemini API');
      const candidate = result.candidates?.[0];
      if (!candidate) throw new Error('No candidates in response');
      if (candidate.finishReason === 'SAFETY')
        throw new Error('Request blocked by safety filters. Please adjust your prompt.');
      const part = candidate.content?.parts?.[0];

      if (part && 'inlineData' in part && part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/jpeg';
        const imageUrl = `data:${mimeType};base64,${imageData}`;
        setEditedImage(imageUrl);
        console.log('✅ Image edited successfully!');
        Alert.alert('✅ Success', 'Your image has been edited successfully!');
      } else if (part && 'text' in part) {
        const text = part.text as string;
        if (text.includes('data:image')) {
          setEditedImage(text);
          Alert.alert('✅ Success', 'Your image has been edited successfully!');
        } else {
          console.warn('AI returned text instead of image:', text);
          throw new Error('AI returned a text response instead of an image. Please try again.');
        }
      } else {
        throw new Error('Unexpected response format. Expected image data.');
      }
    } catch (error: any) {
      // ✅ FIX 7: Handle cancellation gracefully
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ AI Edit Error:', errorMessage);
      Alert.alert('Error', `Failed to process AI edit.\n\n${errorMessage}`);
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // ✅ FIX 8: Clear controller
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>📸 Upload Image</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={20} color="#00CED1" />
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color="#00CED1" />
              <Text style={styles.uploadButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        {originalImage && (
          <View style={styles.imagePreview}>
            <View style={styles.imageColumn}>
              <Text style={styles.imageLabel}>Original</Text>
              <TouchableOpacity
                onPress={() => {
                  setPreviewImage(originalImage);
                  setModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: originalImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {editedImage && (
              <View style={styles.imageColumn}>
                <Text style={styles.imageLabel}>Edited</Text>
                <TouchableOpacity
                  onPress={() => {
                    setPreviewImage(editedImage);
                    setModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: editedImage }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Edit Instructions */}
        {originalImage && (
          <>
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>✏️ Edit Instructions</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the changes you want to make..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={userInput}
                onChangeText={setUserInput}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Generate Button with Timer */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleAIEdit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateButtonText}>
                    Editing... {formatTime(elapsedTime)}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Edit</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Info Card */}
        {!originalImage && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={48} color="#00CED1" />
            <Text style={styles.infoTitle}>AI Image Editor</Text>
            <Text style={styles.infoText}>
              Upload a clothing item and describe your edits. AI will transform
              your image!
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
  uploadSection: {
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
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00CED1',
  },
  imagePreview: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageColumn: {
    flex: 1,
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
  inputSection: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00CED1',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
    minHeight: 50,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    height: 20,
  },
  infoCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 206, 209, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.2)',
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
    backgroundColor: 'rgba(0, 206, 209, 0.3)',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default AIEditMobile;
