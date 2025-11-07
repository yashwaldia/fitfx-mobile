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

  // ✅ CORRECTED - Use dress_name instead of name
  const countries = Array.from(new Set(dressData.map((d) => d.country)));
  const filteredDresses = dressData.filter(
    (d) => d.country === country && d.gender === gender
  );
  const dressNames = Array.from(
    new Set(filteredDresses.map((d) => d.dress_name))
  );

  // Filter dress variants by name
  const selectedDressVariants = dressName
    ? filteredDresses.filter((d) => d.dress_name === dressName)
    : [];

  // Pick Selfie
  const pickSelfie = async () => {
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
      setSelfieImage(base64Image);
      setEditedImage(null);
    }
  };

  // Take Selfie with Camera
  const takeSelfie = async () => {
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
      setSelfieImage(base64Image);
      setEditedImage(null);
    }
  };

  // AI Try-On
  const handleTryOn = async () => {
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
      return;
    }

    setLoading(true);

    try {
      const prompt = `Apply virtual try-on: Put ${dressColor} ${dressName} on this person. Make it look realistic and natural. Maintain person's pose and background.`;

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
                      data: selfieImage.split(',')[1],
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
        // Simulate try-on (in production, use Imagen/Stable Diffusion)
        setEditedImage(selfieImage);
        Alert.alert('✅ Success', 'Virtual try-on applied! (Demo mode)');
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Try-On Error:', error);
      Alert.alert('Error', 'Failed to process try-on. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

      {/* Selfie Preview */}
      {selfieImage && (
        <View style={styles.imagePreview}>
          <View style={styles.imageColumn}>
            <Text style={styles.imageLabel}>Your Selfie</Text>
            <Image source={{ uri: selfieImage }} style={styles.previewImage} />
          </View>
          {editedImage && (
            <View style={styles.imageColumn}>
              <Text style={styles.imageLabel}>Try-On Result</Text>
              <Image source={{ uri: editedImage }} style={styles.previewImage} />
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

          {/* Try-On Button */}
          <TouchableOpacity
            style={[styles.tryOnButton, loading && styles.tryOnButtonDisabled]}
            onPress={handleTryOn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
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
          <Ionicons name="information-circle-outline" size={32} color="#FFA500" />
          <Text style={styles.infoTitle}>Virtual Try-On</Text>
          <Text style={styles.infoText}>
            Upload a selfie and select an outfit to see how it looks on you!
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
  },
  tryOnButtonDisabled: {
    opacity: 0.5,
  },
  tryOnButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
});

export default AITryOnMobile;
