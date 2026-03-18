"use client";

import { useCallback, useEffect, useState } from "react";

const STREAK_KEY = "ace-it-streak";

interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  todayCompleted: boolean;
}

const getToday = () => new Date().toISOString().split("T")[0];

const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({
    current: 0,
    longest: 0,
    lastActiveDate: null,
    todayCompleted: false,
  });

  // Load streak from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) {
      try {
        const data: StreakData = JSON.parse(stored);
        const today = getToday();

        // Check if streak is still valid
        if (data.lastActiveDate) {
          const daysDiff = getDaysDifference(data.lastActiveDate, today);

          if (daysDiff === 0) {
            // Same day - keep everything as is
            setStreak(data);
          } else if (daysDiff === 1) {
            // Yesterday - streak continues but today not completed yet
            setStreak({ ...data, todayCompleted: false });
          } else {
            // More than 1 day gap - streak broken
            setStreak({
              current: 0,
              longest: data.longest,
              lastActiveDate: data.lastActiveDate,
              todayCompleted: false,
            });
          }
        } else {
          setStreak(data);
        }
      } catch (e) {
        console.error("Failed to load streak:", e);
      }
    }
  }, []);

  // Save streak to localStorage whenever it changes
  const saveStreak = useCallback((data: StreakData) => {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    setStreak(data);
  }, []);

  // Record a quiz completion for today
  const recordQuizCompletion = useCallback(() => {
    const today = getToday();

    setStreak((prev) => {
      // Already completed today
      if (prev.todayCompleted && prev.lastActiveDate === today) {
        return prev;
      }

      let newCurrent = prev.current;

      if (!prev.lastActiveDate) {
        // First ever completion
        newCurrent = 1;
      } else {
        const daysDiff = getDaysDifference(prev.lastActiveDate, today);

        if (daysDiff === 0) {
          // Same day, already counted
          newCurrent = prev.current;
        } else if (daysDiff === 1) {
          // Consecutive day - increment streak
          newCurrent = prev.current + 1;
        } else {
          // Gap - start new streak
          newCurrent = 1;
        }
      }

      const newLongest = Math.max(newCurrent, prev.longest);

      const newData: StreakData = {
        current: newCurrent,
        longest: newLongest,
        lastActiveDate: today,
        todayCompleted: true,
      };

      localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  // Check if streak is at risk (last activity was yesterday, not completed today)
  const isStreakAtRisk = useCallback(() => {
    if (!streak.lastActiveDate || streak.current === 0) return false;
    const today = getToday();
    const daysDiff = getDaysDifference(streak.lastActiveDate, today);
    return daysDiff === 1 && !streak.todayCompleted;
  }, [streak]);

  return {
    currentStreak: streak.current,
    longestStreak: streak.longest,
    todayCompleted: streak.todayCompleted,
    isStreakAtRisk: isStreakAtRisk(),
    recordQuizCompletion,
  };
}
