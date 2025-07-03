'use server';

/**
 * @fileOverview An AI flow for generating epic narrations from plot summaries.
 *
 * - generateNarration - A function that takes a plot summary and a voice,
 *   rewrites the summary for dramatic effect, and generates a spoken version.
 * - GenerateNarrationInput - The input type for the generateNarration function.
 * - GenerateNarrationOutput - The return type for the generateNarration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateNarrationInputSchema = z.object({
  plotSummary: z.string().describe('A summary of the plot to be narrated.'),
  voice: z.string().describe('The selected voice for the narration.'),
});
export type GenerateNarrationInput = z.infer<typeof GenerateNarrationInputSchema>;

const GenerateNarrationOutputSchema = z.object({
  audioUrl: z
    .string()
    .describe('The generated narration audio as a data URI.'),
});
export type GenerateNarrationOutput = z.infer<typeof GenerateNarrationOutputSchema>;


export async function generateNarration(
  input: GenerateNarrationInput
): Promise<GenerateNarrationOutput> {
  return generateNarrationFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateNarrationFlow = ai.defineFlow(
  {
    name: 'generateNarrationFlow',
    inputSchema: GenerateNarrationInputSchema,
    outputSchema: GenerateNarrationOutputSchema,
  },
  async ({ plotSummary, voice }) => {

    const { text: epicNarration } = await ai.generate({
        prompt: `You are a world-class dungeon master and storyteller. Your task is to transform a simple plot summary into a vivid, epic, and dramatic narration suitable for a Dungeons & Dragons session. Use evocative language, build suspense, and describe scenes with rich detail.

        Plot Summary: "${plotSummary}"
        
        Rewrite this summary into an epic narration. Return only the narration text.`,
    });

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
      prompt: epicNarration,
    });
    
    if (!media) {
      throw new Error('Text-to-speech generation failed to return audio.');
    }
    
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return { audioUrl: 'data:audio/wav;base64,' + wavBase64 };
  }
);
