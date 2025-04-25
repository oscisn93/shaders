"use client";

import { SudokuCellState } from '@/types';
import React from 'react';

interface SudokuGridProps {
    grid: number[][];
    initialGrid: (number | null)[][];
    selectedCell: SudokuCellState | null;
    onSelectCell: (row: number, col: number) => void;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({ grid, initialGrid, selectedCell, onSelectCell }) => {
    const isCellHighlighted = (row: number, col: number) => {
        if (!selectedCell) {
            return false;
        }
        return (
            row === selectedCell.row ||
            col === selectedCell.col ||
            (Math.floor(row / 3) === Math.floor(selectedCell.row / 3) &&
                Math.floor(col / 3) === Math.floor(selectedCell.col / 3))
        );
    };

    const isInitialValue = (row: number, col: number): boolean => {
        return !initialGrid[row][col];
    };

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const boxBorderColor = getRandomColor();

    return (
        <div className="grid grid-cols-9 gap-0 border-2 border-primary">
            {grid.map((row, rowIndex) => (
                row.map((cellValue, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                            flex items-center justify-center h-12 w-12 text-xl font-bold
                            border border-primary
                            ${colIndex % 3 === 2 ? `border-r-4 border-[${boxBorderColor}]` : 'border-r'} ${rowIndex % 3 === 2 ? `border-b-4 border-[${boxBorderColor}]` : 'border-b'}
                            ${isCellHighlighted(rowIndex, colIndex) ? 'bg-accent/20' : 'bg-background'}
                            cursor-pointer
                            transition-colors duration-200
                            hover:bg-accent/30
                            ${selectedCell && (selectedCell.row === rowIndex && selectedCell.col === colIndex) ? 'bg-accent/50' : ''}
                            ${isInitialValue(rowIndex, colIndex) ? 'text-foreground' : ''}
                        `}
                        onClick={() => onSelectCell(rowIndex, colIndex)}
                    >
                        {cellValue !== null ? cellValue : ''}
                    </div>
                ))
            ))}
        </div>
    );
};

export default SudokuGrid;

