'use server';

import { z } from 'zod';
import { generateCharacterBackground } from '@/ai/flows/character-background-generator';

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
