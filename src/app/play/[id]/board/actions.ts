'use server';

import { generateNarration, GenerateNarrationInput } from '@/ai/flows/generate-narration-flow';

export async function generateNarrationAction(input: GenerateNarrationInput) {
  if (!input.plotSummary) {
    return {
      success: false,
      error: 'A plot summary is required to generate a narration.',
    };
  }

  try {
    const result = await generateNarration(input);
    return {
      success: true,
      audioUrl: result.audioUrl,
    };
  } catch (error) {
    console.error('Error generating narration:', error);
    return {
      success: false,
      error: 'Failed to generate narration. Please try again.',
    };
  }
}
