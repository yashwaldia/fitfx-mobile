import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import type { Garment } from '../../types';

// Get Gemini API Key from environment variables
const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || 
                       process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface AIEditMobileProps {
  wardrobe?: Garment[];
}

const AIEditMobile: React.FC<AIEditMobileProps> = ({ wardrobe }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const safeWardrobe = wardrobe ?? [];
  const uniqueColors = Array.from(new Set(safeWardrobe.map((item) => item.color).filter(Boolean)));
  const uniqueMaterials = Array.from(new Set(safeWardrobe.map((item) => item.material).filter(Boolean)));

  // Pick Image from Gallery
  const pickImage = async () => {
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
      setOriginalImage(base64Image);
      setEditedImage(null);
    }
  };

  // Take Photo with Camera
  const takePhoto = async () => {
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
      setOriginalImage(base64Image);
      setEditedImage(null);
    }
  };

  // AI Edit with Gemini
  const handleAIEdit = async () => {
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
      return;
    }

    setLoading(true);

    try {
      const prompt = `You are a fashion image editor. Edit the clothing item in this image based on this instruction: "${userInput}". 
Available wardrobe colors: ${uniqueColors.join(', ')}.
Available materials: ${uniqueMaterials.join(', ')}.
Return ONLY the edited image description for Imagen API.`;

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
                      data: originalImage.split(',')[1],
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
        // Simulate edited image (in production, use Imagen API)
        setEditedImage(originalImage);
        Alert.alert('✅ Success', 'AI edit applied! (Demo mode - showing original)');
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('AI Edit Error:', error);
      Alert.alert('Error', 'Failed to process AI edit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Actions
  const quickActions = [
    { label: 'Remove BG', prompt: 'Remove background completely' },
    { label: 'Change Color', prompt: `Change color to ${uniqueColors[0] || 'blue'}` },
    { label: 'Enhance', prompt: 'Enhance image quality and colors' },
    { label: 'Style Transfer', prompt: 'Apply modern fashion style' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>📸 Upload Image</Text>
        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color="#00CED1" />
            <Text style={styles.uploadButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color="#00CED1" />
            <Text style={styles.uploadButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview */}
      {originalImage && (
        <View style={styles.imagePreview}>
          <View style={styles.imageColumn}>
            <Text style={styles.imageLabel}>Original</Text>
            <Image source={{ uri: originalImage }} style={styles.previewImage} />
          </View>
          {editedImage && (
            <View style={styles.imageColumn}>
              <Text style={styles.imageLabel}>Edited</Text>
              <Image source={{ uri: editedImage }} style={styles.previewImage} />
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
              placeholder="E.g., Change color to red, remove wrinkles..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={userInput}
              onChangeText={setUserInput}
              multiline
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionButton}
                  onPress={() => setUserInput(action.prompt)}
                >
                  <Text style={styles.quickActionText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleAIEdit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
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
          <Ionicons name="information-circle-outline" size={32} color="#00CED1" />
          <Text style={styles.infoTitle}>AI Image Editor</Text>
          <Text style={styles.infoText}>
            Upload a clothing item and describe your edits. AI will transform your image!
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
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00CED1',
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
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
});

export default AIEditMobile;
