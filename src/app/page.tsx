'use client';

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Slider} from '@/components/ui/slider';
import {auth} from '@/lib/firebase';
import {signInAnonymously} from 'firebase/auth';

const HomePage = () => {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState('Medium');
  const [availableTime, setAvailableTime] = useState([30]); // Time in minutes

  useEffect(() => {
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(user => {
        if (!user) {
          signInAnonymously(auth).catch(error => {
            console.error('Anonymous sign-in failed:', error);
          });
        }
      });

      return () => unsubscribe();
    } else {
      console.warn('Firebase auth not initialized.  Check your environment variables.');
    }
  }, []);

  const handleStartGame = () => {
    router.push(`/sudoku?difficulty=${difficulty}&time=${availableTime[0]}`);
  };

  return (
    <div className="menu-container">
      <Card className="menu-card">
        <CardHeader>
          <CardTitle className="menu-title">Sudoku Zen Garden</CardTitle>
          <CardDescription className="menu-description">Select your puzzle settings and begin!</CardDescription>
        </CardHeader>
        <CardContent className="menu-content">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
            </SelectContent>
          </Select>

          <div>
            <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Available Time (minutes): {availableTime[0]}
            </p>
            <Slider
              defaultValue={availableTime}
              max={60}
              step={5}
              onValueChange={setAvailableTime}
            />
          </div>

          <Button onClick={handleStartGame}>Start Game</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
