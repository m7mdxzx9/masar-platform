import { create } from 'zustand';

interface LetterRaceState {
  score: number;
  streak: number;
  maxStreak: number;
  timer: number;
  gameOver: boolean;
  currentWordIndex: number;
  correctLetters: number;
  reset: () => void;
  setScore: (s: number) => void;
  setStreak: (s: number) => void;
  setMaxStreak: (s: number) => void;
  setTimer: (t: number) => void;
  setGameOver: (g: boolean) => void;
  setCurrentWordIndex: (i: number) => void;
  setCorrectLetters: (c: number) => void;
}

export const useLetterRaceStore = create<LetterRaceState>((set) => ({
  score: 0,
  streak: 0,
  maxStreak: 0,
  timer: 60,
  gameOver: false,
  currentWordIndex: 0,
  correctLetters: 0,
  reset: () =>
    set({
      score: 0,
      streak: 0,
      maxStreak: 0,
      timer: 60,
      gameOver: false,
      currentWordIndex: 0,
      correctLetters: 0,
    }),
  setScore: (s) => set({ score: s }),
  setStreak: (s) => set({ streak: s }),
  setMaxStreak: (s) => set({ maxStreak: s }),
  setTimer: (t) => set({ timer: t }),
  setGameOver: (g) => set({ gameOver: g }),
  setCurrentWordIndex: (i) => set({ currentWordIndex: i }),
  setCorrectLetters: (c) => set({ correctLetters: c }),
}));
