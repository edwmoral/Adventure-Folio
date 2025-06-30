'use server';
/**
 * @fileOverview A fantasy map generation AI agent.
 *
 * - generateMap - A function that handles the map generation process.
 * - GenerateMapInput - The input type for the generateMap function.
 * - GenerateMapOutput - The return type for the generateMap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMapInputSchema = z.object({
  campaignName: z.string().describe('The name of the campaign.'),
  sceneName: z.string().describe('The name of the scene.'),
  description: z
    .string()
    .describe('The user-provided description for the map.'),
});
export type GenerateMapInput = z.infer<typeof GenerateMapInputSchema>;

const GenerateMapOutputSchema = z.object({
  imageUrl: z.string().describe('The generated map image as a data URI.'),
});
export type GenerateMapOutput = z.infer<typeof GenerateMapOutputSchema>;

export async function generateMap(
  input: GenerateMapInput
): Promise<GenerateMapOutput> {
  return generateMapFlow(input);
}

const generateMapFlow = ai.defineFlow(
  {
    name: 'generateMapFlow',
    inputSchema: GenerateMapInputSchema,
    outputSchema: GenerateMapOutputSchema,
  },
  async ({campaignName, sceneName, description}) => {
    // Step 1: Generate an optimized prompt for image generation.
    const {text: optimizedPrompt} = await ai.generate({
      prompt: `You are an expert prompt engineer for a fantasy map image generation AI.
      Your task is to refine a user's request into a vivid, detailed, and effective prompt for a text-to-image model.
      The final output should be a single paragraph describing a top-down, high-fantasy battle map suitable for a tabletop roleplaying game.
      **Crucially, do not include any instructions for the AI to add text, labels, or grid lines to the map.**

      Use the following details to craft the prompt:
      - Campaign Name: ${campaignName}
      - Scene Name: ${sceneName}
      - User's Description: ${description}

      Return ONLY the optimized prompt paragraph and nothing else.`,
    });

    // Step 2: Use the optimized prompt to generate the image.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt:
        optimizedPrompt || `A top-down, high-fantasy battle map. ${description}`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid image.');
    }

    return {imageUrl: media.url};
  }
);
