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

// Import dress data
import { dressData } from '../../data/dressData';

// Get Gemini API Key from environment variables
const GEMINI_API_KEY =
  Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const AITryOnMobile: React.FC = () => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [country, setCountry] = useState('India');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [dressName, setDressName] = useState('');
  const [dressColor, setDressColor] = useState('');
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
      setSelfieImage(null);
      setEditedImage(null);
      console.log('🧹 AITryOnMobile unmounted - cleaned up resources');
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

  // Get unique countries from dress data
  const countries = Array.from(new Set(dressData.map((d) => d.country)));

  // Filter dresses by country and gender
  const filteredDresses = dressData.filter(
    (d) => d.country === country && d.gender === gender
  );

  // Get unique dress names
  const dressNames = Array.from(
    new Set(filteredDresses.map((d) => d.dress_name))
  );

  // Filter dress variants by name
  const selectedDressVariants = dressName
    ? filteredDresses.filter((d) => d.dress_name === dressName)
    : [];

  // Pick Selfie
  const pickSelfie = async () => {
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
        setSelfieImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Pick selfie error:', error);
    }
  };

  // Take Selfie with Camera
  const takeSelfie = async () => {
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
        setSelfieImage(base64Image);
        setEditedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
      console.error('Camera error:', error);
    }
  };

  // ✅ FIX 4: AI Try-On with AbortController
  const handleTryOn = async () => {
    // ✅ FIX 5: Prevent multiple requests
    if (loading) {
      Alert.alert('Processing', 'Please wait for current request to complete');
      return;
    }

    if (!selfieImage) {
      Alert.alert('No Selfie', 'Please upload a selfie first');
      return;
    }

    if (!dressName || !dressColor) {
      Alert.alert('Select Outfit', 'Please select dress and color');
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
      // Find selected dress details
      const selectedDress = selectedDressVariants[0];

      if (!selectedDress) {
        throw new Error('Dress information not found');
      }

      // Build detailed prompt for virtual try-on
      const prompt = `You are an expert AI fashion designer specializing in virtual try-on experiences.

TASK: Transform the person in this image to wear a traditional ${country} outfit.

OUTFIT DETAILS:
- Type: ${dressName}
- Color: ${dressColor}
- Style: ${selectedDress.description || 'Traditional'}
- Fabric: ${selectedDress.fabric_types?.join(', ') || 'Traditional fabric'}
- Gender: ${gender}

KEY REQUIREMENTS:
1. Replace the current clothing with the ${dressName} in ${dressColor} color
2. The garment should follow the traditional style and description provided
3. MUST preserve: The person's face, hair, facial features, and body shape
4. MUST preserve: The person's pose and stance
5. Make the traditional outfit look realistic and professionally tailored
6. Ensure proper draping, fit, and cultural authenticity
7. Match lighting and shadows with the original photo
8. The background can complement the new outfit style
9. The outfit should look professionally worn, not costume-like

IMPORTANT: Output ONLY the transformed image. Do NOT include text, explanations, or descriptions.`;

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
      const base64Image = selfieImage.split(',')[1];

      console.log('🚀 Sending virtual try-on request to Gemini API...');

      // Generate content using SDK
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
        console.log('✅ Virtual try-on generated successfully!');
        Alert.alert('✅ Success', 'Your virtual try-on has been created!');
      } else if (part && 'text' in part) {
        const text = part.text as string;
        if (text.includes('data:image')) {
          setEditedImage(text);
          Alert.alert('✅ Success', 'Your virtual try-on has been created!');
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
      console.error('❌ Try-On Error:', errorMessage);
      Alert.alert('Error', `Failed to process try-on.\n\n${errorMessage}`);
    } finally {
      setLoading(false);
      abortControllerRef.current = null; // ✅ FIX 8: Clear controller
    }
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Upload Selfie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Upload Selfie</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickSelfie}>
              <Ionicons name="image-outline" size={24} color="#FFA500" />
              <Text style={styles.uploadButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takeSelfie}>
              <Ionicons name="camera-outline" size={24} color="#FFA500" />
              <Text style={styles.uploadButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selfie Preview with Modal Click */}
        {selfieImage && (
          <View style={styles.imagePreview}>
            <View style={styles.imageColumn}>
              <Text style={styles.imageLabel}>Your Selfie</Text>
              <TouchableOpacity
                onPress={() => {
                  setPreviewImage(selfieImage);
                  setModalVisible(true);
                }}
              >
                <Image source={{ uri: selfieImage }} style={styles.previewImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="expand" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {editedImage && (
              <View style={styles.imageColumn}>
                <Text style={styles.imageLabel}>Try-On Result</Text>
                <TouchableOpacity
                  onPress={() => {
                    setPreviewImage(editedImage);
                    setModalVisible(true);
                  }}
                >
                  <Image source={{ uri: editedImage }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Outfit Selection */}
        {selfieImage && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👗 Select Outfit</Text>

              {/* Country */}
              <Text style={styles.label}>Country</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={country}
                  onValueChange={(value) => {
                    setCountry(value);
                    setDressName('');
                    setDressColor('');
                    setEditedImage(null);
                  }}
                  style={styles.picker}
                >
                  {countries.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
              </View>

              {/* Gender */}
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => {
                    setGender('female');
                    setDressName('');
                    setDressColor('');
                    setEditedImage(null);
                  }}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'female' && styles.genderTextActive,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => {
                    setGender('male');
                    setDressName('');
                    setDressColor('');
                    setEditedImage(null);
                  }}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === 'male' && styles.genderTextActive,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dress Name */}
              <Text style={styles.label}>Dress Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={dressName}
                  onValueChange={(value) => {
                    setDressName(value);
                    setDressColor('');
                    setEditedImage(null);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Dress" value="" />
                  {dressNames.map((name) => (
                    <Picker.Item key={name} label={name} value={name} />
                  ))}
                </Picker>
              </View>

              {/* Dress Description */}
              {dressName && selectedDressVariants.length > 0 && (
                <>
                  <Text style={styles.label}>Description</Text>
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                      {selectedDressVariants[0].description}
                    </Text>
                  </View>
                </>
              )}

              {/* Fabric Types */}
              {dressName && selectedDressVariants.length > 0 && (
                <>
                  <Text style={styles.label}>Fabric Types</Text>
                  <View style={styles.fabricGrid}>
                    {selectedDressVariants[0].fabric_types.map((fabric, idx) => (
                      <View key={idx} style={styles.fabricChip}>
                        <Text style={styles.fabricChipText}>{fabric}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Color / Variant Selection */}
              {dressName && (
                <>
                  <Text style={styles.label}>Select Variant</Text>
                  <TouchableOpacity
                    style={styles.variantButton}
                    onPress={() => setDressColor(dressName)}
                  >
                    <Text style={styles.variantButtonText}>Use {dressName}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Try-On Button with Timer */}
            <TouchableOpacity
              style={[styles.tryOnButton, loading && styles.tryOnButtonDisabled]}
              onPress={handleTryOn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.tryOnButtonText}>
                    Creating... {formatTime(elapsedTime)}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="shirt" size={20} color="#fff" />
                  <Text style={styles.tryOnButtonText}>Try On Outfit</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Info Card */}
        {!selfieImage && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={48} color="#FFA500" />
            <Text style={styles.infoTitle}>Virtual Try-On</Text>
            <Text style={styles.infoText}>
              Upload a selfie and select an outfit to see how it looks on you!
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
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA500',
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
    height: 250,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    marginTop: 12,
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
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  genderButtonActive: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#FFA500',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  genderTextActive: {
    color: '#FFA500',
  },
  descriptionBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  fabricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  fabricChip: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  fabricChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFA500',
  },
  variantButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    marginBottom: 12,
  },
  variantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA500',
    textAlign: 'center',
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
    minHeight: 50,
  },
  tryOnButtonDisabled: {
    opacity: 0.5,
  },
  tryOnButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    height: 20,
  },
  infoCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
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
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default AITryOnMobile;
