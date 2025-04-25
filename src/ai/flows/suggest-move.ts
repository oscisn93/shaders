// The AI move suggestion feature for Sudoku puzzles.
//
// - suggestMove - A function that suggests a move for a given Sudoku puzzle.
// - SuggestMoveInput - The input type for the suggestMove function.
// - SuggestMoveOutput - The return type for the suggestMove function.

'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  grid: z
    .array(z.array(z.number().nullable()))
    .describe('A 2D array representing the Sudoku grid. Use null for empty cells.'),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  row: z.number().describe('The row index of the suggested move (0-8).'),
  col: z.number().describe('The column index of the suggested move (0-8).'),
  value: z.number().describe('The suggested value to place in the cell (1-9).'),
  reason: z.string().describe('The reasoning behind the suggested move.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {
    schema: z.object({
      grid: z
        .array(z.array(z.number().nullable()))
        .describe('A 2D array representing the Sudoku grid. Use null for empty cells.'),
    }),
  },
  output: {
    schema: z.object({
      row: z.number().describe('The row index of the suggested move (0-8).'),
      col: z.number().describe('The column index of the suggested move (0-8).'),
      value: z.number().describe('The suggested value to place in the cell (1-9).'),
      reason: z.string().describe('The reasoning behind the suggested move.'),
    }),
  },
  prompt: `You are an expert Sudoku solver. Given the current state of the Sudoku puzzle, suggest a valid move to help the user.

Sudoku Grid:
{{#each grid}}
  {{#each this}}
    {{this}} 
  {{/each}}
{{/each}}

Consider the following:
- Only suggest moves for empty cells (cells with a value of null).
- The suggested move must be valid according to Sudoku rules (no 重复数字 in the same row, column, or 3x3 block).
- Provide a brief explanation for why you are suggesting this move.

Output the row, col, value, and reason in a JSON format. Row and column indices start from 0.
`,
});

const suggestMoveFlow = ai.defineFlow<typeof SuggestMoveInputSchema, typeof SuggestMoveOutputSchema>(
  {
    name: 'suggestMoveFlow',
    inputSchema: SuggestMoveInputSchema,
    outputSchema: SuggestMoveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
