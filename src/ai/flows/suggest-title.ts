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
  prompt: `You are a helpful assistant designed to suggest creative and concise titles for diary entries.

  Based on the following description, suggest a title that captures the essence of the event:
  Description: {{{description}}}
  
  The title should be no more than 10 words long.
  The title should be engaging and reflect the overall sentiment of the description.
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
