export type SudokuGameGrid = number[][];

export type SudokuMove = {
    input: number;
    row: number;
    col: number;
}

export type SudokuGridHistory = SudokuMove[];

export type SudokuCellState = {
    row: number;
    col: number;
    value: number;
    isInitial: boolean;
    excludedValues: number[];
}