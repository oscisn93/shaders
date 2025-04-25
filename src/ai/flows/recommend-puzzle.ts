'use server';
/**
 * @fileOverview An AI agent that recommends a Sudoku puzzle based on user skill level and time constraints.
 *
 * - recommendPuzzle - A function that handles the puzzle recommendation process.
 * - RecommendPuzzleInput - The input type for the recommendPuzzle function.
 * - RecommendPuzzleOutput - The return type for the recommendPuzzle function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {UserProfile, getUserProfileById} from '@/services/user-profiles';
import {getSudokuPuzzleByDifficulty, SudokuPuzzle} from '@/services/sudoku-puzzles';

const RecommendPuzzleInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  availableTimeMinutes: z
    .number()
    .describe('The approximate time in minutes the user has available to solve the puzzle.'),
});
export type RecommendPuzzleInput = z.infer<typeof RecommendPuzzleInputSchema>;

const RecommendPuzzleOutputSchema = z.object({
  puzzle: z.object({
    id: z.string().describe('The puzzle identifier.'),
    grid: z.array(z.array(z.number())).describe('The puzzle grid.'),
    difficulty: z.string().describe('The difficulty level of the puzzle.'),
  }).nullable(),
  reason: z.string().describe('The reason for recommending this puzzle.'),
});
export type RecommendPuzzleOutput = z.infer<typeof RecommendPuzzleOutputSchema>;

export async function recommendPuzzle(input: RecommendPuzzleInput): Promise<RecommendPuzzleOutput> {
  return recommendPuzzleFlow(input);
}

const analyzeUserProfile = ai.defineTool({
  name: 'analyzeUserProfile',
  description: 'Analyzes a user profile to determine their Sudoku skill level based on their profile information.',
  inputSchema: z.object({
    userProfile: z.object({
      id: z.string().describe('The user ID.'),
      username: z.string().describe('The username of the player.'),
      skillLevel: z.number().describe('The skill level of the player.'),
    }).describe('The user profile to analyze.'),
  }),
  outputSchema: z.object({
    skillLevel: z.string().describe('The skill level determined by their user profile. Can be Easy, Medium, Hard, or Expert.'),
  }),
},
async input => {
  const skillLevelMap = {
    1: 'Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Medium',
    5: 'Hard',
    6: 'Hard',
    7: 'Expert',
    8: 'Expert',
    9: 'Expert',
    10: 'Expert',
  };

  const skillLevel = skillLevelMap[Math.min(Math.max(input.userProfile.skillLevel, 1), 10) as keyof typeof skillLevelMap];
  return {skillLevel};
});

const prompt = ai.definePrompt({
  name: 'recommendPuzzlePrompt',
  input: {
    schema: z.object({
      userId: z.string().describe('The ID of the user.'),
      availableTimeMinutes: z
        .number()
        .describe('The approximate time in minutes the user has available to solve the puzzle.'),
      skillLevel: z.string().describe('The Sudoku skill level of the user (e.g., Easy, Medium, Hard, Expert).'),
    }),
  },
  output: {
    schema: z.object({
      difficulty: z.string().describe('The difficulty of the recommended puzzle (Easy, Medium, Hard, or Expert).'),
      reason: z.string().describe('The reasoning for recommending this puzzle to the user, referencing their skill level and available time.'),
    }),
  },
  prompt: `You are an expert Sudoku puzzle recommender. A user with skill level {{{skillLevel}}} has {{{availableTimeMinutes}}} minutes to play. Recommend a puzzle difficulty (Easy, Medium, Hard, or Expert) and explain why you recommended that difficulty, referencing their skill level and available time.
`,
  tools: [analyzeUserProfile],
});

const recommendPuzzleFlow = ai.defineFlow<
  typeof RecommendPuzzleInputSchema,
  typeof RecommendPuzzleOutputSchema
>(
  {
    name: 'recommendPuzzleFlow',
    inputSchema: RecommendPuzzleInputSchema,
    outputSchema: RecommendPuzzleOutputSchema,
  },
  async input => {
    const userProfile = await getUserProfileById(input.userId);

    if (!userProfile) {
      return {
        puzzle: null,
        reason: 'User profile not found.',
      };
    }

    const skillAnalysis = await analyzeUserProfile({
      userProfile: {
        id: userProfile.id,
        username: userProfile.username,
        skillLevel: userProfile.skillLevel ?? 1,
      },
    });

    const {output} = await prompt({
      ...input,
      skillLevel: skillAnalysis.skillLevel,
    });

    if (!output) {
      return {
        puzzle: null,
        reason: 'Failed to generate a recommendation.',
      };
    }

    const puzzle = await getSudokuPuzzleByDifficulty(output.difficulty);

    return {
      puzzle: puzzle ? {
        id: puzzle.id,
        grid: puzzle.grid,
        difficulty: puzzle.difficulty,
      } : null,
      reason: output.reason,
    };
  }
);
