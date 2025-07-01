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
  gender: z.string().describe('The gender of the character.'),
  armorPreference: z
    .array(z.string())
    .describe('A list of preferred armor types.'),
  colorPreference: z.string().describe("The character's preferred color."),
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
  async ({
    characterRace,
    characterClass,
    gender,
    armorPreference,
    colorPreference,
    characterDescription,
  }) => {
    // Step 1: Generate an optimized, keyword-based prompt for the image model.
    const {text: optimizedPrompt} = await ai.generate({
      prompt: `You are an expert prompt engineer for a fantasy character portrait generation AI.
      Your task is to refine a user's request into a vivid, detailed, and effective prompt.
      The final output should be a single, comma-separated list of keywords and phrases.
      Example: "fantasy art, painterly, intricate detail, head and shoulders portrait, male elf wizard, silver hair, glowing blue eyes, holding a gnarled wooden staff, wearing dark blue robes with silver trim, mysterious, magical aura, dramatic lighting"

      Style Guidelines:
      - Art Style: Painterly, realistic fantasy art, detailed, atmospheric.
      - Framing: "Head and shoulders portrait" or "upper body portrait". Avoid full-body descriptions.
      - Detail: Add specific, evocative details about clothing, expression, and mood based on the provided character information.
      - Lighting: Suggest dramatic or cinematic lighting.

      Use the following details to craft the prompt:
      - Race: ${characterRace}
      - Class: ${characterClass}
      - Gender: ${gender}
      - Armor Style: ${armorPreference.join(', ')}
      - Color Palette: Emphasize the color ${colorPreference} in clothing, magic, or accents.
      - Description/Backstory: ${characterDescription}

      Return ONLY the comma-separated list of keywords and nothing else.`,
    });

    // Step 2: Use the optimized prompt to generate the image.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt:
        optimizedPrompt ||
        `A painterly, realistic fantasy art portrait of a ${gender} ${characterRace} ${characterClass} wearing ${armorPreference.join(
          ', '
        )}. ${characterDescription}`,
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
