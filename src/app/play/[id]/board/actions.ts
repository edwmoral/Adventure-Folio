
'use server';

import {
  generateNarrationAudio,
  GenerateNarrationAudioInput,
  generateNarrationText,
  GenerateNarrationTextInput,
} from '@/ai/flows/generate-narration-flow';

// Text Generation Action
export type GenerateNarrationTextActionResult = {
  success: boolean;
  error?: string;
  narrationText?: string;
};

export async function generateNarrationTextAction(
  input: GenerateNarrationTextInput
): Promise<GenerateNarrationTextActionResult> {
  if (!input.plotSummary) {
    return {
      success: false,
      error: 'A plot summary is required to generate narration text.',
    };
  }

  try {
    const result = await generateNarrationText(input);
    return {
      success: true,
      narrationText: result.narrationText,
    };
  } catch (error) {
    console.error('Error generating narration text:', error);
    return {
      success: false,
      error: 'Failed to generate narration text. Please try again.',
    };
  }
}

// Audio Generation Action
export type GenerateNarrationAudioActionResult = {
  success: boolean;
  error?: string;
  audioUrl?: string;
};

export async function generateNarrationAudioAction(
  input: GenerateNarrationAudioInput
): Promise<GenerateNarrationAudioActionResult> {
  if (!input.narrationText) {
    return {
      success: false,
      error: 'Narration text is required to generate audio.',
    };
  }

  try {
    const result = await generateNarrationAudio(input);
    return {
      success: true,
      audioUrl: result.audioUrl,
    };
  } catch (error) {
    console.error('Error generating narration audio:', error);
    return {
      success: false,
      error: 'Failed to generate audio. Please try again.',
    };
  }
}
