'use server';
/**
 * @fileOverview Generates a suggested title for a diary entry based on the description.
 *
 * - suggestTitle - A function that generates a title suggestion.
 * - SuggestTitleInput - The input type for the suggestTitle function.
 * - SuggestTitleOutput - The return type for the suggestTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTitleInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the diary event.'),
});

export type SuggestTitleInput = z.infer<typeof SuggestTitleInputSchema>;

const SuggestTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('The suggested title for the diary event.'),
});

export type SuggestTitleOutput = z.infer<typeof SuggestTitleOutputSchema>;

export async function suggestTitle(input: SuggestTitleInput): Promise<SuggestTitleOutput> {
  return suggestTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTitlePrompt',
  input: {schema: SuggestTitleInputSchema},
  output: {schema: SuggestTitleOutputSchema},
  prompt: `Eres un asistente amable diseñado para sugerir títulos creativos, concisos y románticos para las entradas de un diario de pareja.

  Basándote en la siguiente descripción, sugiere un título en español que capture la esencia del momento:
  Descripción: {{{description}}}
  
  El título debe tener 10 palabras como máximo.
  El título debe ser emotivo y reflejar el sentimiento general de la descripción.
`,
});

const suggestTitleFlow = ai.defineFlow(
  {
    name: 'suggestTitleFlow',
    inputSchema: SuggestTitleInputSchema,
    outputSchema: SuggestTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
