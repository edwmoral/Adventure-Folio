'use server';

import { generateNarration, GenerateNarrationInput, GenerateNarrationOutput } from '@/ai/flows/generate-narration-flow';

export type GenerateNarrationActionResult = {
    success: boolean;
    error?: string;
    narration?: { plotSummary: string, audioUrl: string };
};

export async function generateNarrationAction(input: GenerateNarrationInput): Promise<GenerateNarrationActionResult> {
  if (!input.plotSummary) {
    return {
      success: false,
      error: 'A plot summary is required to generate a narration.',
    };
  }

  try {
    const result: GenerateNarrationOutput = await generateNarration(input);
    return {
      success: true,
      narration: {
        plotSummary: result.plotSummary,
        audioUrl: result.audioUrl,
      }
    };
  } catch (error) {
    console.error('Error generating narration:', error);
    return {
      success: false,
      error: 'Failed to generate narration. Please try again.',
    };
  }
}
