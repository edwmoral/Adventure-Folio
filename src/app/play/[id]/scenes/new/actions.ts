'use server';

import {generateMap} from '@/ai/flows/generate-map-flow';

export async function generateMapAction(description: string) {
  if (!description) {
    return {
      success: false,
      error: 'A description is required to generate a map.',
    };
  }

  try {
    const result = await generateMap(description);
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
