// src/screens/CalendarScreen.tsx
//
// ✅ TYPESCRIPT FIX:
// 1. In `useEffect` (line 128):
//    Changed `let customSuggestions = {}`
//    TO `let customSuggestions: Record<string, CalendarSuggestion> = {}`
// 2. In `handleSave` (line 181):
//    Changed `let customSuggestions = {}`
//    TO `let customSuggestions: Record<string, CalendarSuggestion> = {}`
//
// This explicitly tells TypeScript that 'customSuggestions' is an object
// that can be indexed by strings, resolving the TS(7053) error.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

import GradientBackground from '../components/GradientBackground';
import { THEME, NEUMORPHIC, AURORA_GRADIENT } from '../config';

// Import the outfit database
import suggestionsData from '../../assets/suggestionsData.json';

// --- Type Definitions (from your web app) ---
type OutfitData = {
  'Colour Combination': string;
  'T-Shirt/Shirt': string;
  'Trousers/Bottom': string;
  'Jacket/Layer': string;
  'Shoes & Accessories': string;
};
type Occasion = 'Professional' | 'Party' | 'Casual' | 'Other';
type Style = 'American' | 'Indian' | 'Fusion' | 'Other';
type OccasionCamelCase = 'professional' | 'party' | 'casual';
type StyleCamelCase = 'american' | 'indian';

interface SuggestionsData {
  professional: { american: OutfitData[]; indian: OutfitData[] };
  party: { american: OutfitData[]; indian: OutfitData[] };
  casual: { american: OutfitData[]; indian: OutfitData[] };
}

interface CalendarSuggestion extends OutfitData {
  occasion: Occasion;
  style: Style;
  dateString: string;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LOCAL_STORAGE_KEY = 'fitfx-calendar-custom'; // Same key as web

// Helper to get a color from a string for the badge
const colorNameToHex = (colorName: string = '') => {
  const lowerColor = colorName.toLowerCase().trim();
  const colorMap: { [key: string]: string } = {
    navy: '#000080', white: '#FFFFFF', tan: '#D2B48C', grey: '#808080',
    black: '#000000', blue: '#4169E1', green: '#50C878', pink: '#FF69B4',
    red: '#FF0000', ivory: '#FFFFF0', sage: '#B2AC88', burgundy: '#800020',
    gold: '#FFD700', silver: '#C0C0C0', purple: '#800080', orange: '#FFA500',
    yellow: '#FFDB58', brown: '#A52A2A', denim: '#1560BD', olive: '#808000',
    maroon: '#800000', cream: '#FFFDD0',
  };
  for (const key in colorMap) {
    if (lowerColor.includes(key)) return colorMap[key];
  }
  return '#4B5563'; // gray-600 fallback
};

// --- Main Calendar Screen Component ---
interface CalendarScreenProps {
  onNavigate: (screen: string) => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, CalendarSuggestion>>({});
  const [selectedSuggestion, setSelectedSuggestion] = useState<CalendarSuggestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableSuggestion, setEditableSuggestion] = useState<CalendarSuggestion | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const insets = useSafeAreaInsets();

  // --- Logic Functions (Ported from web) ---

  const generateMonthlySuggestions = useCallback((year: number, month: number, data: SuggestionsData): Record<string, CalendarSuggestion> => {
    const suggestions: Record<string, CalendarSuggestion> = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let usedIndices: { [key: string]: number[] } = {
      'professional-american': [], 'professional-indian': [],
      'party-american': [], 'party-indian': [],
      'casual-american': [], 'casual-indian': [],
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      let occasionCamel: OccasionCamelCase = 'casual';
      if (dayOfWeek >= 1 && dayOfWeek <= 5) occasionCamel = 'professional';
      if (dayOfWeek === 6) occasionCamel = 'party';

      const styleCamel: StyleCamelCase = Math.random() > 0.5 ? 'american' : 'indian';
      const key = `${occasionCamel}-${styleCamel}`;

      const possibleOutfits = data[occasionCamel][styleCamel];
      if (!possibleOutfits || possibleOutfits.length === 0) continue;

      if (usedIndices[key].length >= possibleOutfits.length) {
        usedIndices[key] = []; // Reset if we've used all options
      }

      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * possibleOutfits.length);
      } while (usedIndices[key].includes(randomIndex));

      usedIndices[key].push(randomIndex);

      const occasionTitleCase = (occasionCamel.charAt(0).toUpperCase() + occasionCamel.slice(1)) as Occasion;
      const styleTitleCase = (styleCamel.charAt(0).toUpperCase() + styleCamel.slice(1)) as Style;

      suggestions[dateString] = {
        ...possibleOutfits[randomIndex],
        occasion: occasionTitleCase,
        style: styleTitleCase,
        dateString,
      };
    }
    return suggestions;
  }, []);

  // Main data loading effect
  useEffect(() => {
    const loadCalendarData = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // 1. Generate the base suggestions from the imported JSON
      const baseSuggestions = generateMonthlySuggestions(year, month, suggestionsData as SuggestionsData);

      // 2. Load custom edits from AsyncStorage
      // ✅ FIX: Explicitly type customSuggestions
      let customSuggestions: Record<string, CalendarSuggestion> = {};
      try {
        const customSuggestionsRaw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (customSuggestionsRaw) {
          customSuggestions = JSON.parse(customSuggestionsRaw);
        }
      } catch (e) {
        console.error("Failed to load custom suggestions", e);
      }
      
      // 3. Merge them, with custom edits winning
      const mergedSuggestions = { ...baseSuggestions, ...customSuggestions };
      setCalendarData(mergedSuggestions);
    };

    loadCalendarData();
  }, [currentDate, generateMonthlySuggestions]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleDayPress = (suggestion: CalendarSuggestion) => {
    setSelectedSuggestion(suggestion);
    setEditableSuggestion(suggestion); // Pre-fill for editing
    setIsModalVisible(true);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    // Reset editable suggestion to the original selected one
    setEditableSuggestion(selectedSuggestion);
  };
  
  const handleInputChange = (field: keyof CalendarSuggestion, value: string) => {
    if (!editableSuggestion) return;
    setEditableSuggestion({
      ...editableSuggestion,
      [field]: value,
    });
  };

  const handleSave = async () => {
    if (!editableSuggestion) return;
    
    const { dateString } = editableSuggestion;
    // ✅ FIX: Explicitly type customSuggestions
    let customSuggestions: Record<string, CalendarSuggestion> = {};
    
    try {
      // 1. Get existing custom suggestions
      const customSuggestionsRaw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (customSuggestionsRaw) {
        customSuggestions = JSON.parse(customSuggestionsRaw);
      }
      
      // 2. Add/update the new edit (This line no longer causes an error)
      customSuggestions[dateString] = editableSuggestion;
      
      // 3. Save back to AsyncStorage
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customSuggestions));
      
      // 4. Update the live calendar data and modal
      setCalendarData(prev => ({ ...prev, [dateString]: editableSuggestion }));
      setSelectedSuggestion(editableSuggestion);
      setIsEditing(false);
      
      Alert.alert("Success", "Your plan for this day has been saved.");

    } catch (e) {
      console.error("Failed to save custom suggestion", e);
      Alert.alert("Error", "Could not save your changes.");
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedSuggestion(null);
    setIsEditing(false);
    setEditableSuggestion(null);
  };

  // --- Render Functions (React Native) ---

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return [...blanks, ...days].map((day, index) => {
      if (!day) return <View key={`blank-${index}`} style={styles.dayCellBlank} />;
      
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const suggestion = calendarData[dateString];
      const firstColor = suggestion ? suggestion['Colour Combination'].split(/\s*[+,&]\s*/)[0] : '';

      return (
        <TouchableOpacity 
          key={day}
          onPress={() => suggestion && handleDayPress(suggestion)}
          style={styles.dayCell}
        >
          <Text style={styles.dayText}>{day}</Text>
          {suggestion && (
            <View style={styles.suggestionPreview}>
              <View style={styles.colorBadge}>
                <View style={[styles.colorDot, { backgroundColor: colorNameToHex(firstColor) }]} />
                <Text style={styles.colorText} numberOfLines={1}>{suggestion['Colour Combination']}</Text>
              </View>
              <View style={styles.occasionBadge}>
                <Text style={styles.occasionText}>{suggestion.occasion}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

  const renderModalContent = () => {
    const suggestion = isEditing ? editableSuggestion : selectedSuggestion;
    if (!suggestion) return null;

    if (isEditing) {
      return (
        <ScrollView style={styles.modalEditScroll}>
          {/* Occasion Picker */}
          <Text style={styles.modalLabel}>Occasion</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={suggestion.occasion}
              onValueChange={(itemValue) => handleInputChange('occasion', itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Professional" value="Professional" />
              <Picker.Item label="Party" value="Party" />
              <Picker.Item label="Casual" value="Casual" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
          
          {/* Style Picker */}
          <Text style={styles.modalLabel}>Style</Text>
           <View style={styles.pickerContainer}>
            <Picker
              selectedValue={suggestion.style}
              onValueChange={(itemValue) => handleInputChange('style', itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="American" value="American" />
              <Picker.Item label="Indian" value="Indian" />
              <Picker.Item label="Fusion" value="Fusion" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          {/* Text Inputs */}
          <Text style={styles.modalLabel}>Colour Combination</Text>
          <TextInput
            style={styles.modalInput}
            value={suggestion['Colour Combination']}
            onChangeText={(val) => handleInputChange('Colour Combination', val)}
            placeholderTextColor="#888"
          />
          <Text style={styles.modalLabel}>Top</Text>
          <TextInput
            style={styles.modalInput}
            value={suggestion['T-Shirt/Shirt']}
            onChangeText={(val) => handleInputChange('T-Shirt/Shirt', val)}
            placeholderTextColor="#888"
          />
          <Text style={styles.modalLabel}>Bottom</Text>
          <TextInput
            style={styles.modalInput}
            value={suggestion['Trousers/Bottom']}
            onChangeText={(val) => handleInputChange('Trousers/Bottom', val)}
            placeholderTextColor="#888"
          />
          <Text style={styles.modalLabel}>Layer</Text>
          <TextInput
            style={styles.modalInput}
            value={suggestion['Jacket/Layer']}
            onChangeText={(val) => handleInputChange('Jacket/Layer', val)}
            placeholderTextColor="#888"
          />
          <Text style={styles.modalLabel}>Shoes & Accessories</Text>
          <TextInput
            style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
            value={suggestion['Shoes & Accessories']}
            onChangeText={(val) => handleInputChange('Shoes & Accessories', val)}
            placeholderTextColor="#888"
            multiline
          />
        </ScrollView>
      );
    }

    // Read-only view
    return (
      <View style={styles.modalReadView}>
        <View style={styles.modalReadSection}>
          <Ionicons name="color-palette-outline" size={20} color={AURORA_GRADIENT.cyan} style={styles.modalReadIcon} />
          <View style={styles.modalReadContent}>
            <Text style={styles.modalReadTitle}>Color Palette</Text>
            {suggestion['Colour Combination'].split(/\s*[+,&]\s*/).map((color, index) => (
              <View key={index} style={styles.modalReadItem}>
                <View style={[styles.colorDot, { backgroundColor: colorNameToHex(color.trim()) }]} />
                <Text style={styles.modalReadText}>{color.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.modalReadSection}>
          <Ionicons name="shirt-outline" size={20} color={AURORA_GRADIENT.cyan} style={styles.modalReadIcon} />
          <View style={styles.modalReadContent}>
            <Text style={styles.modalReadTitle}>Outfit</Text>
            <Text style={styles.modalReadText}><Text style={styles.modalReadLabel}>Top: </Text>{suggestion['T-Shirt/Shirt']}</Text>
            <Text style={styles.modalReadText}><Text style={styles.modalReadLabel}>Bottom: </Text>{suggestion['Trousers/Bottom']}</Text>
            <Text style={styles.modalReadText}><Text style={styles.modalReadLabel}>Layer: </Text>{suggestion['Jacket/Layer']}</Text>
            <Text style={styles.modalReadText}><Text style={styles.modalReadLabel}>Shoes: </Text>{suggestion['Shoes & Accessories']}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => onNavigate('home')}>
             <Ionicons name="arrow-back" size={24} color={NEUMORPHIC.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar Plan</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Calendar */}
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.calendarContainer}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.chevron}>
                <Ionicons name="chevron-back" size={24} color={NEUMORPHIC.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.chevron}>
                <Ionicons name="chevron-forward" size={24} color={NEUMORPHIC.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekHeader}>
              {WEEK_DAYS.map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}
            </View>
            <View style={styles.grid}>
              {renderCalendarGrid()}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- Suggestion Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Your Plan' : `${selectedSuggestion?.occasion} Inspiration`}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedSuggestion?.dateString ? new Date(selectedSuggestion.dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
              </Text>
            </View>
            {renderModalContent()}
            <View style={styles.modalFooter}>
              {isEditing ? (
                <>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={handleCancel}>
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleSave}>
                    <Ionicons name="save-outline" size={18} color={NEUMORPHIC.bgDarker} />
                    <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={handleCloseModal}>
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={handleEdit}>
                    <Ionicons name="pencil-outline" size={18} color={AURORA_GRADIENT.cyan} />
                    <Text style={[styles.modalButtonText, {color: AURORA_GRADIENT.cyan}]}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
};

// --- Styles (React Native) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
  },
  calendarContainer: {
    margin: 16,
    backgroundColor: NEUMORPHIC.bgLight,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chevron: { padding: 8 },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AURORA_GRADIENT.cyan,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: NEUMORPHIC.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: '12.5%', // (100% - (6 * gap)) / 7
    aspectRatio: 1,
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    gap: 2,
  },
  dayCellBlank: {
    width: '12.5%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    gap: 6,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: NEUMORPHIC.textSecondary,
    textAlign: 'right',
  },
  suggestionPreview: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEUMORPHIC.bg,
    borderRadius: 4,
    padding: 2,
    overflow: 'hidden',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 3,
  },
  colorText: {
    flex: 1,
    fontSize: 8,
    color: NEUMORPHIC.textTertiary,
  },
  occasionBadge: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 4,
    paddingVertical: 1,
  },
  occasionText: {
    fontSize: 8,
    color: AURORA_GRADIENT.cyan,
    textAlign: 'center',
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: NEUMORPHIC.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderLight,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: NEUMORPHIC.borderDark,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEUMORPHIC.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: NEUMORPHIC.borderDark,
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonPrimary: {
    backgroundColor: AURORA_GRADIENT.cyan,
  },
  modalButtonSecondary: {
    backgroundColor: NEUMORPHIC.bg,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: NEUMORPHIC.bgDarker,
  },
  modalButtonTextSecondary: {
    color: NEUMORPHIC.textSecondary,
  },
  // Modal Read-Only View
  modalReadView: {
    padding: 20,
    gap: 16,
  },
  modalReadSection: {
    flexDirection: 'row',
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  modalReadIcon: {
    marginTop: 2,
  },
  modalReadContent: {
    flex: 1,
    gap: 6,
  },
  modalReadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
    marginBottom: 4,
  },
  modalReadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalReadText: {
    fontSize: 14,
    color: NEUMORPHIC.textSecondary,
    lineHeight: 20,
  },
  modalReadLabel: {
    fontWeight: '600',
    color: NEUMORPHIC.textPrimary,
  },
  // Modal Edit View
  modalEditScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: 400, // Limit height to allow scrolling
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: NEUMORPHIC.textTertiary,
    marginBottom: 4,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: NEUMORPHIC.textPrimary,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
  },
  pickerContainer: {
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NEUMORPHIC.borderDark,
    overflow: 'hidden',
  },
  picker: {
    color: NEUMORPHIC.textPrimary,
  },
  pickerItem: {
    color: NEUMORPHIC.textPrimary, // Note: color only works on iOS for items
  },
});

export default CalendarScreen;