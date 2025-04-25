"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb, UndoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SudokuControlsProps {
  onNumberSelect: (number: number) => void;
  onGetSuggestion: () => void;
  onUndo: () => void;
}

const SudokuControls: React.FC<SudokuControlsProps> = ({ onNumberSelect, onGetSuggestion, onUndo }) => {

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <Button key={number} variant="secondary" className="flex items-center justify-center" onClick={() => onNumberSelect(number)}>
              {number}
            </Button>
          ))}
        </div>
        <div className="flex w-full justify-between">
          <Button onClick={onGetSuggestion} className="w-1/2 mr-2 flex items-center justify-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            Suggest
          </Button>
          <Button variant="outline" onClick={onUndo} className="w-1/2 ml-2 flex items-center justify-center">
            <UndoIcon className="mr-2 h-4 w-4" />
            Undo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SudokuControls;
