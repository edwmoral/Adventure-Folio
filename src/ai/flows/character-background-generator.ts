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

const prompt = ai.definePrompt({
  name: 'generateCharacterBackgroundPrompt',
  input: {schema: GenerateCharacterBackgroundInputSchema},
  output: {schema: GenerateCharacterBackgroundOutputSchema},
  prompt: `You are a creative storyteller specializing in D&D character backgrounds.

  Given the following information, craft a compelling and detailed background story for the character.

  Character Name: {{{characterName}}}
  Race: {{{characterRace}}}
  Class: {{{characterClass}}}
  Desired Tone: {{#if desiredTone}}{{{desiredTone}}}{{else}}No specific tone.{{/if}}
  Additional Details: {{#if additionalDetails}}{{{additionalDetails}}}{{else}}None.{{/if}}

  Consider the character's potential motivations, flaws, and key events that shaped their past.
  The background story should be engaging and provide a solid foundation for roleplaying.
  Write in a narrative style, bringing the character to life.
  Do not include any introductory or concluding remarks.
  Focus solely on the character's background story.

  Background Story:`,
});

const generateCharacterBackgroundFlow = ai.defineFlow(
  {
    name: 'generateCharacterBackgroundFlow',
    inputSchema: GenerateCharacterBackgroundInputSchema,
    outputSchema: GenerateCharacterBackgroundOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
