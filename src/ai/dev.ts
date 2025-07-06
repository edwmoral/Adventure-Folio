'use server';
import { config } from 'dotenv';
config({ path: '.env.local' });

import '@/ai/flows/character-background-generator.ts';
import '@/ai/flows/generate-map-flow.ts';
import '@/ai/flows/generate-character-portrait-flow.ts';
import '@/ai/flows/generate-narration-flow.ts';
