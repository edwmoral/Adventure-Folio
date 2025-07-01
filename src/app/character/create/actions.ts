'use server';

import { z } from 'zod';
import { generateCharacterBackground, GenerateCharacterBackgroundInput } from '@/ai/flows/character-background-generator';
import { generateCharacterPortrait, GenerateCharacterPortraitInput } from '@/ai/flows/generate-character-portrait-flow';

const BackgroundSchema = z.object({
  characterName: z.string().min(1, { message: 'Character name is required.' }),
  characterRace: z.string().min(1, { message: 'Character race is required.' }),
  characterClass: z.string().min(1, { message: 'Character class is required.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  armorPreference: z.array(z.string()).min(1, { message: 'Armor preference is required.' }),
  colorPreference: z.string().min(1, { message: 'Color preference is required.' }),
  desiredTone: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export async function generateBackgroundAction(input: GenerateCharacterBackgroundInput) {
  const validation = BackgroundSchema.safeParse(input);

  if (!validation.success) {
    // Taking the first error from the first field that has one.
    const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'A validation error occurred.',
    };
  }

  try {
    const result = await generateCharacterBackground(validation.data);
    return {
      success: true,
      background: result.backgroundStory,
    };
  } catch (error) {
    console.error('Error generating background:', error);
    return {
      success: false,
      error: 'Failed to generate background. Please try again.',
    };
  }
}


const PortraitSchema = z.object({
  characterRace: z.string().min(1, { message: 'Character race is required.' }),
  characterClass: z.string().min(1, { message: 'Character class is required.' }),
  gender: z.string().min(1, { message: 'Gender is required.' }),
  armorPreference: z.array(z.string()).min(1, { message: 'Armor preference is required.' }),
  colorPreference: z.string().min(1, { message: 'Color preference is required.' }),
  characterDescription: z.string().min(1, { message: 'Backstory or description is required for portrait generation.' }),
});

export async function generatePortraitAction(input: GenerateCharacterPortraitInput) {
  const validation = PortraitSchema.safeParse(input);

  if (!validation.success) {
    const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'A validation error occurred.',
    };
  }

  try {
    const result = await generateCharacterPortrait(validation.data);
    return {
      success: true,
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    console.error('Error generating portrait:', error);
    return {
      success: false,
      error: 'Failed to generate portrait. Please try again.',
    };
  }
}
