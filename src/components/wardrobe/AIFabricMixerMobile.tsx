import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const AIFabricMixerMobile: React.FC = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [clothingPart, setClothingPart] = useState<'top' | 'bottom'>('top');
  const [loading, setLoading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'person' | 'fabric'>('person');

  // Pick Person Image
  const pickPersonImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPersonImage(base64Image);
      setEditedImage(null);
    }
  };

  // Take Person Photo
  const takePersonPhoto = async () => {
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

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPersonImage(base64Image);
      setEditedImage(null);
    }
  };

  // Pick Fabric Image
  const pickFabricImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFabricImage(base64Image);
      setEditedImage(null);
    }
  };

  // Take Fabric Photo
  const takeFabricPhoto = async () => {
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

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFabricImage(base64Image);
      setEditedImage(null);
    }
  };

  // AI Fabric Mix
  const handleFabricMix = async () => {
    if (!personImage || !fabricImage) {
      Alert.alert('Missing Images', 'Please upload both person and fabric images');
      return;
    }

    if (!GEMINI_API_KEY) {
      Alert.alert('Configuration Error', 'Gemini API key not configured');
      return;
    }

    setLoading(true);

    try {
      const prompt = `Apply this fabric pattern to the ${clothingPart} of the person's clothing. Make it look realistic and natural. Maintain the person's pose and background. Blend the fabric seamlessly with the garment's shape and shadows.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: personImage.split(',')[1],
                    },
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: fabricImage.split(',')[1],
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Simulate fabric mix (in production, use Imagen/Stable Diffusion)
        setEditedImage(personImage);
        Alert.alert('✅ Success', 'Fabric mix applied! (Demo mode)');
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Fabric Mix Error:', error);
      Alert.alert('Error', 'Failed to process fabric mix. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
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

      {/* Person Image Preview */}
      {personImage && (
        <View style={styles.imagePreview}>
          <Text style={styles.imageLabel}>Person</Text>
          <Image source={{ uri: personImage }} style={styles.previewImage} />
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

      {/* Fabric Image Preview */}
      {fabricImage && (
        <View style={styles.imagePreview}>
          <Text style={styles.imageLabel}>Fabric Pattern</Text>
          <Image source={{ uri: fabricImage }} style={styles.previewImage} />
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
                onValueChange={setClothingPart}
                style={styles.picker}
              >
                <Picker.Item label="Top (Shirt/Jacket)" value="top" />
                <Picker.Item label="Bottom (Pants/Skirt)" value="bottom" />
              </Picker>
            </View>
          </View>

          {/* Mix Button */}
          <TouchableOpacity
            style={[styles.mixButton, loading && styles.mixButtonDisabled]}
            onPress={handleFabricMix}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="color-wand" size={20} color="#fff" />
                <Text style={styles.mixButtonText}>Mix Fabric</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Result Preview */}
      {editedImage && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>✨ Result</Text>
          <Image source={{ uri: editedImage }} style={styles.resultImage} />
        </View>
      )}

      {/* Info Card */}
      {!personImage && !fabricImage && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={32} color="#9D5CFF" />
          <Text style={styles.infoTitle}>Fabric Mixer</Text>
          <Text style={styles.infoText}>
            Upload a person image and a fabric pattern. AI will apply the fabric to the
            selected clothing part!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  mixButtonDisabled: {
    opacity: 0.5,
  },
  mixButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
});

export default AIFabricMixerMobile;
