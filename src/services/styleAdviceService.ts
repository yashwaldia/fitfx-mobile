// src/services/styleAdviceService.ts

import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import type {
  StyleAdvice,
  ProfileOccasion,
  Country,
  ProfileGender,
  Garment,
  UserProfile,
  SubscriptionTier,
} from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

// === Helper Functions ===
const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

const getMimeTypeFromBase64 = (base64: string): string => {
  return base64.substring(base64.indexOf(':') + 1, base64.indexOf(';'));
};

// === Schemas ===
const outfitIdeaSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    outfitName: { type: SchemaType.STRING },
    colorName: { type: SchemaType.STRING },
    fabricType: { type: SchemaType.STRING },
    idealOccasion: { type: SchemaType.STRING },
    whyItWorks: { type: SchemaType.STRING },
    suggestedPairingItems: { type: SchemaType.STRING },
  },
  required: [
    'outfitName',
    'colorName',
    'fabricType',
    'idealOccasion',
    'whyItWorks',
    'suggestedPairingItems',
  ],
};

const dressMatrixRowSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    country: { type: SchemaType.STRING },
    gender: { type: SchemaType.STRING },
    dressName: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    occasion: { type: SchemaType.STRING },
    notes: { type: SchemaType.STRING },
  },
  required: [
    'country',
    'gender',
    'dressName',
    'description',
    'occasion',
    'notes',
  ],
};

const styleAdviceSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    fashionSummary: { type: SchemaType.STRING },
    colorPalette: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          colorName: { type: SchemaType.STRING },
          hexCode: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ['colorName', 'hexCode', 'description'],
      },
    },
    outfitIdeas: {
      type: SchemaType.ARRAY,
      items: outfitIdeaSchema,
    },
    wardrobeOutfitIdeas: {
      type: SchemaType.ARRAY,
      items: outfitIdeaSchema,
    },
    generatedDressMatrix: {
      type: SchemaType.ARRAY,
      items: dressMatrixRowSchema,
    },
    materialAdvice: { type: SchemaType.STRING },
    motivationalNote: { type: SchemaType.STRING },
  },
  required: [
    'fashionSummary',
    'colorPalette',
    'outfitIdeas',
    'wardrobeOutfitIdeas',
    'generatedDressMatrix',
    'materialAdvice',
    'motivationalNote',
  ],
};

const getOutfitCount = (tier: SubscriptionTier): number => {
  switch (tier) {
    case 'free':
      return 3;
    case 'style_plus':
      return 10;
    case 'style_x':
      return -1; // -1 for unlimited
    default:
      return 3;
  }
};

export const getStyleAdvice = async (
  imageBase64: string,
  occasion: ProfileOccasion,
  country: Country,
  age: string,
  gender: ProfileGender,
  preferredColors: string[],
  wardrobe: Garment[],
  userProfile?: UserProfile | null,
  subscriptionTier: SubscriptionTier = 'free'
): Promise<StyleAdvice> => {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
  });

  const mimeType = getMimeTypeFromBase64(imageBase64);
  const imagePart = fileToGenerativePart(imageBase64, mimeType);

  const preferredColorsText =
    preferredColors.length > 0
      ? `- User's Preferred Colors (for this request): ${preferredColors.join(
          ', '
        )}`
      : '';

  const wardrobeText =
    wardrobe.length > 0
      ? `- User's Wardrobe Items: ${wardrobe
          .map((item) => `${item.color} ${item.material}`)
          .join(', ')}`
      : '';

  const profilePreferencesText = userProfile
    ? `
      - User's general preferences (for context, if available):
        - Preferred Occasions: ${userProfile.preferredOccasions?.join(', ')}
        ${userProfile.bodyType ? `- Body Type: ${userProfile.bodyType}` : ''}
        ${
          userProfile.preferredFabrics &&
          userProfile.preferredFabrics.length > 0
            ? `- Preferred Fabrics: ${userProfile.preferredFabrics.join(', ')}`
            : ''
        }
        ${
          userProfile.fashionIcons
            ? `- Admired Fashion Icons: ${userProfile.fashionIcons}`
            : ''
        }
    `
    : '';

  const outfitCount = getOutfitCount(subscriptionTier);
  const outfitDescription =
    outfitCount === -1
      ? 'as many distinct and complete as you can generate (at least 10)'
      : `${outfitCount} distinct and complete`;

  const textPart = {
    text: `
      You are FitFx, a world-class AI fashion stylist. Your goal is to provide personalized, visually descriptive, and inspiring fashion advice.

      Analyze the user in this selfie to determine their skin tone (warm, cool, neutral) and general vibe. Based on this analysis, provide fashion recommendations for the following user-selected criteria for this specific request:
      - Age: ${age}
      - Gender: ${gender}
      - Occasion: ${occasion}
      - Country/Region: ${country}
      ${preferredColorsText}
      ${wardrobeText}
      ${profilePreferencesText}

      Your response MUST be in JSON format and adhere to the provided schema.

      **CRITICAL INSTRUCTIONS:**
      1. **Analyze & Summarize:** In 'fashionSummary', write a warm, personalized paragraph about THIS user's best colors and styles based on their selfie, skin tone, age, gender, and body type.
      2. **Create Color Palette:** Create exactly 5 key colors with hex codes that are flattering for THIS specific user.
      3. **Create General Outfit Ideas:** Provide ${outfitDescription} outfit ideas appropriate for the user's age, gender, and body type.
      4. **Create Wardrobe Outfits:** If wardrobe is not empty, create 1-3 outfit ideas using those items. If empty, return empty array.
      5. **GENERATE PERSONALIZED DRESS MATRIX:** THIS IS CRITICAL!
         In 'generatedDressMatrix', create 5-10 dress recommendations that are:
         - COUNTRY SET: ${country}
         - GENDER SET: ${gender}
         - OCCASION SET: ${occasion}
         - HIGHLY PERSONALIZED to THIS user's selfie, skin tone, age, body type, and preferences
         - NOT generic or templated - each dress should feel custom-made for this person
         - Include creative dress names based on user's style
         - Write descriptions explaining WHY each dress suits THIS specific user
         - Add styling notes and cultural context
      6. **Give Material Advice:** Detailed fabric recommendations considering season and occasion.
      7. **End with Motivational Note:** Short, uplifting message.

      🎯 KEY: The dress matrix should feel PERSONALIZED, not like a generic template. Each dress should be selected specifically for THIS user.
    `,
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [imagePart, textPart] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: styleAdviceSchema,
      },
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Empty response from AI model');
    }
    return JSON.parse(responseText) as StyleAdvice;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('The AI returned an invalid response. Please try again.');
  }
};