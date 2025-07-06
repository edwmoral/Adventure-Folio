
'use server';

/**
 * @fileOverview An AI flow for generating epic narrations from plot summaries.
 *
 * - generateNarrationText - A function that rewrites a plot summary for dramatic effect.
 * - generateNarrationAudio - A function that converts text to speech.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// --- TEXT GENERATION ---

export const GenerateNarrationTextInputSchema = z.object({
  plotSummary: z.string().describe('A summary of the plot to be narrated.'),
  characters: z.array(z.object({
    name: z.string(),
    race: z.string(),
    className: z.string(),
  })).describe('An array of player characters in the scene.'),
});
export type GenerateNarrationTextInput = z.infer<typeof GenerateNarrationTextInputSchema>;

export const GenerateNarrationTextOutputSchema = z.object({
  narrationText: z.string().describe('The rewritten, epic narration text.'),
});
export type GenerateNarrationTextOutput = z.infer<typeof GenerateNarrationTextOutputSchema>;


export async function generateNarrationText(
  input: GenerateNarrationTextInput
): Promise<GenerateNarrationTextOutput> {
  return generateNarrationTextFlow(input);
}

const generateNarrationTextFlow = ai.defineFlow(
  {
    name: 'generateNarrationTextFlow',
    inputSchema: GenerateNarrationTextInputSchema,
    outputSchema: GenerateNarrationTextOutputSchema,
  },
  async ({ plotSummary, characters }) => {
    const characterDescriptions = characters.map(c => `- ${c.name} the ${c.race} ${c.className}`).join('\n');

    const { output } = await ai.generate({
        prompt: `You are a world-class dungeon master and storyteller. Your task is to transform a simple plot summary into a vivid, epic, and dramatic narration suitable for a Dungeons & Dragons session.
        
        Use evocative language, build suspense, and describe scenes with rich detail.
        
        The current party consists of:
        ${characterDescriptions || 'No specific characters provided.'}

        IMPORTANT INSTRUCTIONS:
        1. Only mention characters by name in your narration if their name also appears in the original "Plot Summary" below.
        2. When you do mention a character, use the list above to accurately describe their race and class if appropriate.
        3. Keep the final narration concise and impactful. It must not be more than 2.5 times the length of the original plot summary (do not count the character list when calculating this length).

        Plot Summary: "${plotSummary}"
        
        Rewrite this summary into an epic narration.`,
        output: {
          schema: GenerateNarrationTextOutputSchema,
        },
    });

    if (!output?.narrationText?.trim()) {
      throw new Error('Failed to generate narration text from the summary.');
    }

    return output;
  }
);


// --- AUDIO GENERATION ---

export const GenerateNarrationAudioInputSchema = z.object({
  narrationText: z.string().describe('The final text to be converted to speech.'),
  voice: z.string().describe('The voice to use for the narration.'),
});
export type GenerateNarrationAudioInput = z.infer<typeof GenerateNarrationAudioInputSchema>;

export const GenerateNarrationAudioOutputSchema = z.object({
  audioUrl: z
    .string()
    .describe('The generated narration audio as a data URI.'),
});
export type GenerateNarrationAudioOutput = z.infer<typeof GenerateNarrationAudioOutputSchema>;


export async function generateNarrationAudio(
  input: GenerateNarrationAudioInput
): Promise<GenerateNarrationAudioOutput> {
  return generateNarrationAudioFlow(input);
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

const generateNarrationAudioFlow = ai.defineFlow(
  {
    name: 'generateNarrationAudioFlow',
    inputSchema: GenerateNarrationAudioInputSchema,
    outputSchema: GenerateNarrationAudioOutputSchema,
  },
  async ({ narrationText, voice }) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Algenib' },
          },
        },
      },
      prompt: narrationText,
    });
    
    if (!media || !media.url) {
      throw new Error('Text-to-speech generation failed to return audio.');
    }
    
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return { 
        audioUrl: 'data:audio/wav;base64,' + wavBase64 
    };
  }
);
