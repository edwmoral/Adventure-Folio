'use server';
/**
 * @fileOverview A character portrait generation AI agent.
 *
 * - generateCharacterPortrait - A function that handles the portrait generation process.
 * - GenerateCharacterPortraitInput - The input type for the generateCharacterPortrait function.
 * - GenerateCharacterPortraitOutput - The return type for the generateCharacterPortrait function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterPortraitInputSchema = z.object({
  characterRace: z.string().describe('The race of the character.'),
  characterClass: z.string().describe('The class of the character.'),
  characterDescription: z
    .string()
    .describe('A physical description of the character or their backstory.'),
});
export type GenerateCharacterPortraitInput = z.infer<
  typeof GenerateCharacterPortraitInputSchema
>;

const GenerateCharacterPortraitOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated character portrait as a data URI.'),
});
export type GenerateCharacterPortraitOutput = z.infer<
  typeof GenerateCharacterPortraitOutputSchema
>;

export async function generateCharacterPortrait(
  input: GenerateCharacterPortraitInput
): Promise<GenerateCharacterPortraitOutput> {
  return generateCharacterPortraitFlow(input);
}

const generateCharacterPortraitFlow = ai.defineFlow(
  {
    name: 'generateCharacterPortraitFlow',
    inputSchema: GenerateCharacterPortraitInputSchema,
    outputSchema: GenerateCharacterPortraitOutputSchema,
  },
  async ({characterRace, characterClass, characterDescription}) => {
    // Step 1: Generate an optimized prompt for image generation.
    const {text: optimizedPrompt} = await ai.generate({
      prompt: `You are an expert prompt engineer for a fantasy character portrait generation AI.
      Your task is to refine a user's request into a vivid, detailed, and effective prompt for a text-to-image model.
      The final output should be a single paragraph describing a fantasy character portrait.
      Focus on a "head and shoulders" or "upper body" portrait style. Do not describe a full body pose unless specified.
      The style should be painterly and realistic fantasy art.

      Use the following details to craft the prompt:
      - Race: ${characterRace}
      - Class: ${characterClass}
      - Description/Backstory: ${characterDescription}

      Return ONLY the optimized prompt paragraph and nothing else.`,
    });

    // Step 2: Use the optimized prompt to generate the image.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt:
        optimizedPrompt ||
        `A painterly, realistic fantasy art portrait of a ${characterRace} ${characterClass}. ${characterDescription}`,
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
