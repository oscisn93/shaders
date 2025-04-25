import React from 'react';
import { render, screen } from '@testing-library/react';
import SudokuGrid from './SudokuGrid';

describe('SudokuGrid Component', () => {
  const mockGrid = [
    [5, 3, null, null, 7, null, null, null, null],
    [6, null, null, 1, 9, 5, null, null, null],
    [null, 9, 8, null, null, null, null, 6, null],
    [8, null, null, null, 6, null, null, null, 3],
    [4, null, null, 8, null, 3, null, null, 1],
    [7, null, null, null, 2, null, null, null, 6],
    [null, 6, null, null, null, null, 2, 8, null],
    [null, null, null, 4, 1, 9, null, null, 5],
    [null, null, null, null, 8, null, null, 7, 9],
  ];

  it('renders the Sudoku grid', () => {
    render(
      <SudokuGrid
        grid={mockGrid}
        initialGrid={mockGrid}
        selectedCell={{ row: null, col: null }}
        onSelectCell={() => {}}
      />
    );

    // Check if the component renders without crashing
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('displays empty cells as empty strings', () => {
    render(
      <SudokuGrid
        grid={mockGrid}
        initialGrid={mockGrid}
        selectedCell={{ row: null, col: null }}
        onSelectCell={() => {}}
      />
    );

    // Check if empty cells are rendered as empty strings
    expect(screen.getByText('')).toBeInTheDocument();
  });
});
