'use server';

import {generateMap, GenerateMapInput} from '@/ai/flows/generate-map-flow';

export async function generateMapAction(input: GenerateMapInput) {
  if (!input.description) {
    return {
      success: false,
      error: 'A description is required to generate a map.',
    };
  }

  try {
    const result = await generateMap(input);
    return {
      success: true,
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    console.error('Error generating map:', error);
    return {
      success: false,
      error: 'Failed to generate map image. Please try again.',
    };
  }
}
