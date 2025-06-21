'use server';

/**
 * @fileOverview An AI agent that suggests related drugs based on the active ingredient and concentration of a given drug.
 *
 * - suggestRelatedDrugs - A function that handles the suggestion of related drugs.
 * - SuggestRelatedDrugsInput - The input type for the suggestRelatedDrugs function.
 * - SuggestRelatedDrugsOutput - The return type for the suggestRelatedDrugs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedDrugsInputSchema = z.object({
  activeIngredient: z
    .string()
    .describe('The active ingredient of the drug.'),
  concentration: z.string().describe('The concentration of the drug.'),
});
export type SuggestRelatedDrugsInput = z.infer<typeof SuggestRelatedDrugsInputSchema>;

const SuggestRelatedDrugsOutputSchema = z.object({
  relatedDrugs: z
    .array(z.string())
    .describe('An array of related drug names.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested drugs.'),
});
export type SuggestRelatedDrugsOutput = z.infer<typeof SuggestRelatedDrugsOutputSchema>;

export async function suggestRelatedDrugs(
  input: SuggestRelatedDrugsInput
): Promise<SuggestRelatedDrugsOutput> {
  return suggestRelatedDrugsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedDrugsPrompt',
  input: {schema: SuggestRelatedDrugsInputSchema},
  output: {schema: SuggestRelatedDrugsOutputSchema},
  prompt: `You are a pharmacist recommending alternative medications.

  Based on the active ingredient and concentration of the drug provided, suggest 3 related drugs.
  Explain your reasoning for each suggestion.

  Active Ingredient: {{{activeIngredient}}}
  Concentration: {{{concentration}}}

  Format your output as a JSON object with 'relatedDrugs' (an array of drug names) and 'reasoning' (your explanation).
  `,
});

const suggestRelatedDrugsFlow = ai.defineFlow(
  {
    name: 'suggestRelatedDrugsFlow',
    inputSchema: SuggestRelatedDrugsInputSchema,
    outputSchema: SuggestRelatedDrugsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
