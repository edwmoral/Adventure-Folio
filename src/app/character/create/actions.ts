'use server';

import { z } from 'zod';
import { generateCharacterBackground } from '@/ai/flows/character-background-generator';
import { generateCharacterPortrait } from '@/ai/flows/generate-character-portrait-flow';

const BackgroundSchema = z.object({
  characterName: z.string().min(1, { message: 'Character name is required.' }),
  characterRace: z.string().min(1, { message: 'Character race is required.' }),
  characterClass: z.string().min(1, { message: 'Character class is required.' }),
  desiredTone: z.string().optional(),
  additionalDetails: z.string().optional(),
});

export async function generateBackgroundAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const validation = BackgroundSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors,
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
      error: { _form: ['Failed to generate background. Please try again.'] },
    };
  }
}


const PortraitSchema = z.object({
  characterRace: z.string().min(1, { message: 'Character race is required.' }),
  characterClass: z.string().min(1, { message: 'Character class is required.' }),
  characterDescription: z.string().min(1, { message: 'Backstory or description is required for portrait generation.' }),
});

export async function generatePortraitAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const validation = PortraitSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.flatten().fieldErrors,
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
      error: { _form: ['Failed to generate portrait. Please try again.'] },
    };
  }
}
