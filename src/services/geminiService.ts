// src/services/geminiService.ts
//
// ✅ UPDATED: Fixed type imports to match the new types.ts

import Constants from 'expo-constants';
import type {
  ColorOccasion, // ✅ FIXED: Was 'Occasion'
  Country,
  ColorGender, // ✅ FIXED: Was 'Gender'
  ColorSuggestion,
  Garment,
} from '../types';
import { loadWardrobe } from './firestoreService'; // Import wardrobe loader

// ✅ Get API key from Expo's environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const IMAGE_API_KEY = process.env.EXPO_PUBLIC_GEMINI_IMAGE_API_KEY || API_KEY;

if (!IMAGE_API_KEY) {
  console.error(
    'Gemini API key is missing. Please add EXPO_PUBLIC_GEMINI_IMAGE_API_KEY to your .env file'
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert base64 to Gemini file part
 */
const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

/**
 * Extract MIME type from base64 string
 */
const getMimeTypeFromBase64 = (base64: string): string => {
  return base64.substring(base64.indexOf(':') + 1, base64.indexOf(';'));
};

// ============================================
// ✅ COLOR SUGGESTION FUNCTION (REWRITTEN FOR MOBILE)
// ============================================

/**
 * Generate personalized color suggestions using Gemini AI REST API
 * Analyzes user's selfie OR profile and generates 5-7 personalized colors
 */
export const generateColorSuggestions = async (
  selfieBase64: string | undefined,
  occasion: ColorOccasion, // ✅ FIXED: Use ColorOccasion
  country: Country,
  gender: ColorGender, // ✅ FIXED: Use ColorGender
  age: string,
  preferredColors: string[],
  userId: string
): Promise<ColorSuggestion[]> => {
  if (!IMAGE_API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  try {
    // ✅ 1. Fetch user's wardrobe for context
    const wardrobe: Garment[] = await loadWardrobe(userId);
    const wardrobeSummary =
      wardrobe.length > 0
        ? `They own ${wardrobe.length} items, including: ${wardrobe
            .map((g) => `${g.material} (${g.color})`)
            .slice(0, 5) // Limit summary
            .join(', ')}`
        : 'They have not added any items to their wardrobe yet.';

    // ✅ 2. Define schema for color suggestion response
    const colorSuggestionSchema = {
      type: 'OBJECT',
      properties: {
        colors: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              colorName: {
                type: 'STRING',
                description:
                  "Name of the color (e.g., 'Warm Terracotta', 'Sage Green')",
              },
              hexCode: {
                type: 'STRING',
                description: "Hex code of the color (e.g., '#8B4789')",
              },
              occasion: {
                type: 'STRING',
                description:
                  "Best occasion for this color (e.g., 'Casual', 'Formal', 'Party')",
              },
              description: {
                type: 'STRING',
                description:
                  "Why this color suits THIS specific user based on their skin tone (if selfie provided) or profile",
              },
              stylingTips: {
                type: 'STRING',
                description: 'How to wear this color effectively',
              },
              bestFor: {
                type: 'STRING',
                description: 'Types of clothing best in this color',
              },
            },
            required: [
              'colorName',
              'hexCode',
              'occasion',
              'description',
            ],
          },
        },
      },
      required: ['colors'],
    };

    // ✅ 3. Create detailed prompt for Gemini
    //    We will build the prompt and payload parts dynamically
    const payloadParts: any[] = [];
    let textPrompt = `You are FitFx, a world-class AI color consultant and fashion expert.

USER PROFILE:
- Gender: ${gender}
- Age: ${age}
- Location: ${country}
- Occasion: ${occasion}
- Preferred Colors: ${preferredColors.join(', ')}
- Current Wardrobe: ${wardrobeSummary}
`;

    // ✅ 4. Conditionally add selfie image and prompt
    if (selfieBase64) {
      // If we have a selfie, add the image part
      const imagePart = fileToGenerativePart(
        selfieBase64,
        getMimeTypeFromBase64(selfieBase64)
      );
      payloadParts.push(imagePart);

      // Add the selfie-specific task
      textPrompt += `
CRITICAL TASK (SELFIE ANALYSIS):
Analyze the user's selfie (their skin tone, complexion, and coloring) and suggest 5-7 personalized colors that:
1. MATCH their undertone (warm, cool, or neutral based on their appearance)
2. FLATTER their skin tone specifically
3. FIT the occasion, location, and user preferences
4. WORK with their existing wardrobe
5. Are trending and fashion-forward`;
    } else {
      // No selfie, use a profile-only task
      textPrompt += `
CRITICAL TASK (PROFILE ANALYSIS):
Analyze the user's *profile* (age, gender, location, preferences) and suggest 5-7 personalized colors that:
1. FIT their demographic (age, gender, location)
2. FIT the occasion they mentioned
3. ALIGN with their country/cultural context
4. WORK with their preferred colors and existing wardrobe
5. Are trending and fashion-forward`;
    }

    textPrompt += `

For EACH color:
- Provide a creative, memorable name
- Give the exact HEX code
- Explain WHY this color suits THEM specifically (reference their profile/skin tone)
- Suggest styling tips for that color
- List clothing types where this color works best

Format: Return exactly 5-7 colors. Make suggestions PERSONAL to this user, not generic.`;

    // Add the final text part to the payload
    payloadParts.push({ text: textPrompt });

    // ✅ 5. Call Gemini API using fetch
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${IMAGE_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: payloadParts, // Use the dynamic parts array
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: colorSuggestionSchema,
      },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();

    // ✅ 6. Parse and validate response
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('No valid response from AI.');
    }

    const parsed = JSON.parse(rawText);

    // ✅ 7. Return formatted color suggestions
    const suggestions: ColorSuggestion[] = parsed.colors.map(
      (color: any) => ({
        colorName: color.colorName || 'Unknown Color',
        hexCode: color.hexCode || '#000000',
        occasion: (color.occasion || 'casual') as ColorOccasion,
        description: color.description || '',
        stylingTips: color.stylingTips || '',
        bestFor: color.bestFor || '',
      })
    );

    console.log(`✅ Generated ${suggestions.length} color suggestions`);
    return suggestions;
  } catch (error) {
    console.error('❌ Error generating color suggestions:', error);
    throw new Error('Failed to generate color suggestions.');
  }
};