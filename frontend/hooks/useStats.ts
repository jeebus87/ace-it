"use client";

import { useCallback, useEffect, useState } from "react";

const STATS_KEY = "ace-it-stats";

interface StatsData {
  totalQuizzes: number;
  perfectQuizzes: number;
  totalQuestions: number;
  correctFirstTry: number;
  activityByDate: Record<string, number>; // date -> quiz count
}

const getToday = () => new Date().toISOString().split("T")[0];

export function useStats() {
  const [stats, setStats] = useState<StatsData>({
    totalQuizzes: 0,
    perfectQuizzes: 0,
    totalQuestions: 0,
    correctFirstTry: 0,
    activityByDate: {},
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((data: StatsData) => {
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
    setStats(data);
  }, []);

  // Record a completed quiz
  const recordQuizComplete = useCallback(
    (questionCount: number, correctFirstTryCount: number, isPerfect: boolean) => {
      const today = getToday();

      setStats((prev) => {
        const newStats: StatsData = {
          totalQuizzes: prev.totalQuizzes + 1,
          perfectQuizzes: prev.perfectQuizzes + (isPerfect ? 1 : 0),
          totalQuestions: prev.totalQuestions + questionCount,
          correctFirstTry: prev.correctFirstTry + correctFirstTryCount,
          activityByDate: {
            ...prev.activityByDate,
            [today]: (prev.activityByDate[today] || 0) + 1,
          },
        };

        localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
        return newStats;
      });
    },
    []
  );

  // Get activity data for last N days
  const getActivityData = useCallback(
    (days: number = 365) => {
      const result: { date: string; count: number }[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        result.push({
          date: dateStr,
          count: stats.activityByDate[dateStr] || 0,
        });
      }

      return result;
    },
    [stats.activityByDate]
  );

  // Calculate accuracy percentage
  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctFirstTry / stats.totalQuestions) * 100)
      : 0;

  return {
    ...stats,
    accuracy,
    recordQuizComplete,
    getActivityData,
  };
}
