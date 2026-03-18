"use client";

import { useCallback, useEffect, useState } from "react";

const XP_KEY = "ace-it-xp";

interface XPData {
  totalXP: number;
  level: number;
  title: string;
}

// Level thresholds and titles
const LEVELS = [
  { minXP: 0, level: 1, title: "Novice" },
  { minXP: 100, level: 2, title: "Apprentice" },
  { minXP: 300, level: 3, title: "Student" },
  { minXP: 600, level: 4, title: "Scholar" },
  { minXP: 1000, level: 5, title: "Expert" },
  { minXP: 1500, level: 6, title: "Master" },
  { minXP: 2500, level: 7, title: "Grandmaster" },
  { minXP: 4000, level: 8, title: "Sage" },
  { minXP: 6000, level: 9, title: "Legend" },
  { minXP: 10000, level: 10, title: "Ace" },
];

const getLevelFromXP = (xp: number): { level: number; title: string } => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return { level: LEVELS[i].level, title: LEVELS[i].title };
    }
  }
  return { level: 1, title: "Novice" };
};

const getXPForNextLevel = (currentLevel: number): number => {
  const nextLevel = LEVELS.find((l) => l.level === currentLevel + 1);
  return nextLevel?.minXP ?? LEVELS[LEVELS.length - 1].minXP;
};

const getCurrentLevelMinXP = (currentLevel: number): number => {
  const level = LEVELS.find((l) => l.level === currentLevel);
  return level?.minXP ?? 0;
};

export function useXP() {
  const [xpData, setXPData] = useState<XPData>({
    totalXP: 0,
    level: 1,
    title: "Novice",
  });
  const [xpGained, setXPGained] = useState<number | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);

  // Load XP from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(XP_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const levelInfo = getLevelFromXP(data.totalXP);
        setXPData({
          totalXP: data.totalXP,
          ...levelInfo,
        });
      } catch (e) {
        console.error("Failed to load XP:", e);
      }
    }
  }, []);

  // Save XP to localStorage whenever it changes
  const saveXP = useCallback((newTotalXP: number) => {
    const levelInfo = getLevelFromXP(newTotalXP);
    const newData = { totalXP: newTotalXP, ...levelInfo };
    localStorage.setItem(XP_KEY, JSON.stringify(newData));
    return newData;
  }, []);

  // Award XP for a correct answer
  const awardXP = useCallback(
    (isFirstTry: boolean, streakMultiplier: number = 1) => {
      const baseXP = isFirstTry ? 10 : 5;
      const multiplier = Math.min(1 + streakMultiplier * 0.1, 1.5); // Max 50% bonus
      const earnedXP = Math.round(baseXP * multiplier);

      setXPData((prev) => {
        const newTotal = prev.totalXP + earnedXP;
        const newData = saveXP(newTotal);

        // Check for level up
        if (newData.level > prev.level) {
          setLeveledUp(true);
          setTimeout(() => setLeveledUp(false), 3000);
        }

        return newData;
      });

      setXPGained(earnedXP);
      setTimeout(() => setXPGained(null), 1500);

      return earnedXP;
    },
    [saveXP]
  );

  // Award bonus XP for perfect quiz
  const awardPerfectBonus = useCallback(
    (questionCount: number, streakMultiplier: number = 1) => {
      const baseBonus = 100 + questionCount * 5; // 100 + 5 per question
      const multiplier = Math.min(1 + streakMultiplier * 0.1, 1.5);
      const earnedXP = Math.round(baseBonus * multiplier);

      setXPData((prev) => {
        const newTotal = prev.totalXP + earnedXP;
        const newData = saveXP(newTotal);

        if (newData.level > prev.level) {
          setLeveledUp(true);
          setTimeout(() => setLeveledUp(false), 3000);
        }

        return newData;
      });

      setXPGained(earnedXP);
      setTimeout(() => setXPGained(null), 2000);

      return earnedXP;
    },
    [saveXP]
  );

  // Calculate progress to next level
  const getProgress = useCallback(() => {
    const currentMin = getCurrentLevelMinXP(xpData.level);
    const nextMin = getXPForNextLevel(xpData.level);

    if (xpData.level >= 10) return 100; // Max level

    const progressXP = xpData.totalXP - currentMin;
    const requiredXP = nextMin - currentMin;

    return Math.round((progressXP / requiredXP) * 100);
  }, [xpData]);

  return {
    totalXP: xpData.totalXP,
    level: xpData.level,
    title: xpData.title,
    xpGained,
    leveledUp,
    progress: getProgress(),
    xpToNextLevel: getXPForNextLevel(xpData.level) - xpData.totalXP,
    awardXP,
    awardPerfectBonus,
  };
}
