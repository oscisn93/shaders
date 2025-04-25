"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SudokuGrid from '@/components/Sudoku/SudokuGrid';
import SudokuControls from '@/components/Sudoku/SudokuControls';
import { getSudokuPuzzleByDifficulty, getRandomSudokuPuzzle } from '@/services/sudoku-puzzles';
import { useToast } from "@/hooks/use-toast";
import { suggestMove } from '@/ai/flows/suggest-move';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RedoIcon, Shuffle, Play, Pause, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SUDOKU_GRID_STORAGE_KEY = 'sudokuGrid';
const SUDOKU_INITIAL_GRID_STORAGE_KEY = 'sudokuInitialGrid';
const SUDOKU_HISTORY_STORAGE_KEY = 'sudokuHistory';

const SudokuPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const difficulty = searchParams.get('difficulty') || 'Medium';
    const timeAvailable = searchParams.get('time') || 30;

    const [grid, setGrid] = useState<number[][]>([]);
    const [initialGrid, setInitialGrid] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ row: number | null; col: number | null }>({
        row: null,
        col: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [history, setHistory] = useState<number[][][]>([]);
    const sudokuGridRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [completedNumbers, setCompletedNumbers] = useState<number[]>([]);
    const [isSolved, setIsSolved] = useState(false);

    const { setTheme } = useTheme();

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isRunning) {
            intervalId = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }

        return () => clearInterval(intervalId);
    }, [isRunning]);


    const isValidMove = useCallback((grid: number[][], row: number, col: number, number: number): boolean => {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (i !== col && grid[row][i] === number) {
                return false;
            }
        }

        // Check column
        for (let i = 0; i < 9; i++) {
            if (i !== row && grid[i][col] === number) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (i !== row && j !== col && grid[i][j] === number) {
                    return false;
                }
            }
        }

        return true;
    }, []);

    const handleNumberSelect = useCallback((number: number) => {
        if (selectedCell.row !== null && selectedCell.col !== null) {
            if (initialGrid[selectedCell.row][selectedCell.col] === null) {
                const newGrid = grid.map((rowArray, rowIndex) =>
                    rowIndex === selectedCell.row ? rowArray.map((cellValue, colIndex) =>
                        colIndex === selectedCell.col ? number : cellValue
                    ) : rowArray
                );

                if (isValidMove(newGrid, selectedCell.row, selectedCell.col, number)) {
                    setHistory(prevHistory => {
                      const newHistory = [...prevHistory, grid];
                      localStorage.setItem(SUDOKU_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
                      return newHistory;
                    });
                    setGrid(newGrid);
                    localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(newGrid));
                    updateCompletedNumbers(newGrid);
                    if (checkIfSolved(newGrid)) {
                      setIsSolved(true);
                      setIsRunning(false); // Stop the timer when solved
                    }
                } else {
                    toast({
                        title: "Invalid Move",
                        description: "This move is not valid according to Sudoku rules.",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Cannot change initial value",
                    description: "This cell is part of the initial puzzle and cannot be changed.",
                });
            }
        } else {
            toast({
                title: "No cell selected",
                description: "Please select a cell in the Sudoku grid first.",
            });
        }
    }, [grid, initialGrid, selectedCell, toast, isValidMove]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (selectedCell.row !== null && selectedCell.col !== null && sudokuGridRef.current?.contains(document.activeElement)) {
                const number = parseInt(event.key);
                if (!isNaN(number) && number >= 1 && number <= 9) {
                    handleNumberSelect(number);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedCell, handleNumberSelect, sudokuGridRef]);

    const loadNewPuzzle = useCallback(async (difficultyLevel: string) => {
        setIsLoading(true);
        try {
            const puzzle = await getSudokuPuzzleByDifficulty(difficultyLevel);
            if (!puzzle) {
                toast({
                    title: "Error loading puzzle",
                    description: "Failed to load a new Sudoku puzzle. Please try again.",
                    variant: "destructive",
                });
                return;
            }
            const initialPuzzleGrid = puzzle.grid.map(row => row.map(cell => cell === null ? null : cell)); // Ensure nulls are properly handled
            setGrid(initialPuzzleGrid);
            localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(initialPuzzleGrid));
            setInitialGrid(initialPuzzleGrid.map(row => [...row])); // Deep copy
            localStorage.setItem(SUDOKU_INITIAL_GRID_STORAGE_KEY, JSON.stringify(initialPuzzleGrid.map(row => [...row])));
            setHistory([initialPuzzleGrid]);
            localStorage.setItem(SUDOKU_HISTORY_STORAGE_KEY, JSON.stringify([initialPuzzleGrid]));

            setTime(0);
            setIsRunning(false); // do not autostart timer
            setIsSolved(false);
            updateCompletedNumbers(initialPuzzleGrid);
        } catch (error) {
            toast({
                title: "Error loading puzzle",
                description: "Failed to load a new Sudoku puzzle. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const loadRandomPuzzle = useCallback(async () => {
        setIsLoading(true);
        try {
            const puzzle = await getRandomSudokuPuzzle();
            if (!puzzle) {
                toast({
                    title: "Error loading puzzle",
                    description: "Failed to load a random Sudoku puzzle. Please try again.",
                    variant: "destructive",
                });
                return;
            }
            const initialPuzzleGrid = puzzle.grid.map(row => row.map(cell => cell === null ? null : cell)); // Ensure nulls are properly handled
            setGrid(initialPuzzleGrid);
            localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(initialPuzzleGrid));
            setInitialGrid(initialPuzzleGrid.map(row => [...row])); // Deep copy
            localStorage.setItem(SUDOKU_INITIAL_GRID_STORAGE_KEY, JSON.stringify(initialPuzzleGrid.map(row => [...row])));
            setHistory([initialPuzzleGrid]);
            localStorage.setItem(SUDOKU_HISTORY_STORAGE_KEY, JSON.stringify([initialPuzzleGrid]));

            setTime(0);
            setIsRunning(false); // do not autostart timer
            setIsSolved(false);
            updateCompletedNumbers(initialPuzzleGrid);
        } catch (error) {
            toast({
                title: "Error loading puzzle",
                description: "Failed to load a random Sudoku puzzle. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        const storedGrid = localStorage.getItem(SUDOKU_GRID_STORAGE_KEY);
        const storedInitialGrid = localStorage.getItem(SUDOKU_INITIAL_GRID_STORAGE_KEY);
        const storedHistory = localStorage.getItem(SUDOKU_HISTORY_STORAGE_KEY);

        if (storedGrid && storedInitialGrid && storedHistory) {
            try {
                const parsedGrid = JSON.parse(storedGrid) as number[][];
                const parsedInitialGrid = JSON.parse(storedInitialGrid) as number[][];
                const parsedHistory = JSON.parse(storedHistory) as number[][][];

                setGrid(parsedGrid);
                setInitialGrid(parsedInitialGrid);
                setHistory(parsedHistory);
                setIsLoading(false);
                updateCompletedNumbers(parsedGrid);
                if (checkIfSolved(parsedGrid)) {
                  setIsSolved(true);
                  setIsRunning(false);
                }
            } catch (error) {
                console.error("Failed to parse stored Sudoku data, loading new puzzle", error);
                loadNewPuzzle(difficulty);
            }
        } else {
            loadNewPuzzle(difficulty);
        }
    }, [loadNewPuzzle, difficulty]);


    const handleCellSelect = (row: number, col: number) => {
        setSelectedCell({ row, col });
    };

    const handleUndo = () => {
        if (history.length > 1) {
            const previousGrid = history[history.length - 2];
            setGrid(previousGrid);
            localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(previousGrid));
            setHistory(prevHistory => {
                const newHistory = prevHistory.slice(0, prevHistory.length - 1);
                localStorage.setItem(SUDOKU_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
                return newHistory;
            });
            updateCompletedNumbers(previousGrid);
            setIsSolved(false);
        } else {
            toast({
                title: "Cannot Undo",
                description: "No more moves to undo.",
            });
        }
    };

    const handleGetSuggestion = async () => {
        if (isLoading) return;

        const currentGrid = grid.map(row => row.map(cell => cell === null ? null : cell));

        try {
            const aiSuggestion = await suggestMove({ grid: currentGrid });
            if (aiSuggestion) {
                const { row, col, value, reason } = aiSuggestion;

                if (!isValidMove(currentGrid, row, col, value)) {
                    toast({
                        title: "AI Suggestion Error",
                        description: "The AI suggested an invalid move.",
                        variant: "destructive",
                    });
                    return;
                }

                setHistory(prevHistory => {
                    const newHistory = [...prevHistory, grid];
                    localStorage.setItem(SUDOKU_HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
                    return newHistory;
                });

                //Optimistically update the grid
                setGrid(prevGrid => {
                    const newGrid = prevGrid.map((rowArray, rowIndex) => {
                        if (rowIndex === row) {
                            const newRow = rowArray.map((cellValue, colIndex) => {
                                if (colIndex === col) {
                                    return value;
                                }
                                return cellValue;
                            });
                            return newRow;
                        }
                        return rowArray;
                    });
                    localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(newGrid));
                    updateCompletedNumbers(newGrid);
                    if (checkIfSolved(newGrid)) {
                      setIsSolved(true);
                      setIsRunning(false); // Stop the timer when solved
                    }
                    return newGrid;
                });

                setSelectedCell({row: row, col: col});

                toast({
                    title: "AI Suggestion",
                    description: `Suggested move: Row ${row + 1}, Col ${col + 1}, Value ${value}. Reason: ${reason}`,
                });
            } else {
                toast({
                    title: "No suggestion",
                    description: "AI could not find a valid move.",
                });
            }
        } catch (error: any) {
            console.error("AI Suggestion Error:", error);
            toast({
                title: "AI Suggestion Error",
                description: error.message || "Failed to get AI suggestion. Please try again.",
                variant: "destructive",
            });

            //Revert the grid
            setGrid(currentGrid);
            localStorage.setItem(SUDOKU_GRID_STORAGE_KEY, JSON.stringify(currentGrid));

        }
    };

    const handleNewPuzzle = () => {
        setIsRunning(false); //Pause the timer when loading a new puzzle
        loadNewPuzzle(difficulty);
    };
  
    const handleRandomPuzzle = () => {
        setIsRunning(false);
        loadRandomPuzzle();
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    };

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTime(0);
    };

    const handleSaveProgress = () => {
      // TODO: Implement database save logic here
      toast({
        title: "Save Progress",
        description: "Saving to database not yet implemented",
      });
    };

    const updateCompletedNumbers = useCallback((currentGrid: number[][]) => {
        const counts: { [key: number]: number } = {};
        currentGrid.forEach(row => {
            row.forEach(cell => {
                if (typeof cell === 'number') {
                    counts[cell] = (counts[cell] || 0) + 1;
                }
            });
        });

        const completed = Object.keys(counts)
            .map(Number)
            .filter(key => counts[key] === 9);

        setCompletedNumbers(completed);
    }, []);

    const checkIfSolved = useCallback((currentGrid: number[][]) => {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentGrid[i][j] === null) {
                    return false; // There are empty cells, so it's not solved
                }
                if (!isValidMove(currentGrid, i, j, currentGrid[i][j]!)) {
                    return false; // Invalid move, not solved
                }
            }
        }
        return true; // All cells filled and valid, so it's solved
    }, [isValidMove]);

    const handlePlayAgain = () => {
      setIsSolved(false);
      handleNewPuzzle();
    };


    return (
        
            
                
                    
                   Solve a new puzzle each day!
                    
                    
                        
                            
                            {isLoading ? (
                                <Skeleton className="w-full aspect-square rounded-md" />
                            ) : (
                                <SudokuGrid grid={grid} selectedCell={selectedCell} onSelectCell={handleCellSelect} initialGrid={initialGrid} />
                            )}
                        
                        
                            {isLoading ? (
                                <Skeleton className="w-full h-48 rounded-md" />
                            ) : (
                                <SudokuControls onNumberSelect={handleNumberSelect} onGetSuggestion={handleGetSuggestion} onUndo={handleUndo}/>
                            )}
                            
                                
                                    
                                        {isLoading && <Skeleton className="h-8 w-24 rounded-md" />}
                                        New Puzzle
                                    
                                    
                                        {isLoading && <Skeleton className="h-8 w-24 rounded-md" />}
                                        Random
                                    
                                
                                
                                  {formatTime(time)}
                                
                            
                           
                                
                                    
                                        
                                            
                                        
                                    
                                
                                
                                    
                                        
                                             Reset
                                        
                                    
                                
                            
                        
                    
                
                 
                    
                    
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((number) => (
                        
                          
                            
                              
                              <Checkbox
                                checked={completedNumbers.includes(number)}
                                disabled
                                id={`number-${number}`}
                              />
                              
                              {number}
                            
                            {completedNumbers.includes(number) && <X className="h-4 w-4 text-green-500" />}
                          
                        
                      ))}
                    
                
            
          
            
              
                Congratulations!
                You've solved the Sudoku! Want to play again?
              
              
                No
                Yes
              
            
          
        
    );
};

export default SudokuPage;
