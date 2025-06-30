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

const GenerateMapInputSchema = z
  .string()
  .describe('A description of the fantasy map to generate.');
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
  async description => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A top-down, high-fantasy battle map suitable for a tabletop roleplaying game. Do not include any text, labels, or grid lines on the map. Description: ${description}`,
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
