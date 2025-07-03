import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Create a single instance of the Google AI plugin.
export const googleAIPlugin = googleAI();

export const ai = genkit({
  // Register the plugin instance.
  plugins: [googleAIPlugin],
  model: 'googleai/gemini-2.0-flash',
});
