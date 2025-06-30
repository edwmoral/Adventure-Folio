'use server';

/**
 * @fileOverview A character background generation AI agent.
 *
 * - generateCharacterBackground - A function that handles the character background generation process.
 * - GenerateCharacterBackgroundInput - The input type for the generateCharacterBackground function.
 * - GenerateCharacterBackgroundOutput - The return type for the generateCharacterBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterBackgroundInputSchema = z.object({
  characterRace: z.string().describe('The race of the character.'),
  characterClass: z.string().describe('The class of the character.'),
  characterName: z.string().describe('The name of the character.'),
  desiredTone: z
    .string()
    .optional()
    .describe(
      'The desired tone of the background story, e.g., mysterious, heroic, tragic.'
    ),
  additionalDetails: z
    .string()
    .optional()
    .describe('Any additional details or preferences for the background.'),
});
export type GenerateCharacterBackgroundInput = z.infer<
  typeof GenerateCharacterBackgroundInputSchema
>;

const GenerateCharacterBackgroundOutputSchema = z.object({
  backgroundStory: z.string().describe('The generated background story.'),
});
export type GenerateCharacterBackgroundOutput = z.infer<
  typeof GenerateCharacterBackgroundOutputSchema
>;

export async function generateCharacterBackground(
  input: GenerateCharacterBackgroundInput
): Promise<GenerateCharacterBackgroundOutput> {
  return generateCharacterBackgroundFlow(input);
}

const generateCharacterBackgroundFlow = ai.defineFlow(
  {
    name: 'generateCharacterBackgroundFlow',
    inputSchema: GenerateCharacterBackgroundInputSchema,
    outputSchema: GenerateCharacterBackgroundOutputSchema,
  },
  async ({
    characterName,
    characterRace,
    characterClass,
    desiredTone,
    additionalDetails,
  }) => {
    // Step 1: Generate an outline/story points to guide the narrative.
    const {text: storyOutline} = await ai.generate({
      prompt: `You are a master D&D storyteller. Based on the following character concept, generate a list of 3-5 key bullet points for a compelling background story. These points should include a core motivation, a significant past event, and a personal connection or secret.

      Character Name: ${characterName}
      Race: ${characterRace}
      Class: ${characterClass}
      Desired Tone: ${desiredTone || 'Not specified'}
      Additional Details: ${additionalDetails || 'None'}

      Return ONLY the bullet points.`,
    });

    // Step 2: Use the outline to write the full, narrative story.
    const {output} = await ai.generate({
      prompt: `You are a creative storyteller specializing in D&D character backgrounds.
      Given the following character information and key story points, craft a compelling and detailed background story.
      Write in a rich, narrative style, bringing the character to life.
      Do not include any introductory or concluding remarks. Focus solely on the character's background story.

      Character Name: ${characterName}
      Race: ${characterRace}
      Class: ${characterClass}
      Desired Tone: ${desiredTone || 'Not specified'}

      Key Story Points to use as inspiration:
      ${storyOutline}

      Generate the background story now.`,
      output: {
        schema: GenerateCharacterBackgroundOutputSchema,
      },
    });

    return output!;
  }
);
