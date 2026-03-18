"use client";

import { Flame, AlertTriangle } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  isAtRisk: boolean;
  todayCompleted: boolean;
}

export function StreakBadge({ currentStreak, isAtRisk, todayCompleted }: StreakBadgeProps) {
  if (currentStreak === 0 && !isAtRisk) return null;

  return (
    <div className="flex items-center gap-1.5">
      {isAtRisk ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full animate-pulse">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-orange-400">
            {currentStreak} day streak at risk!
          </span>
        </div>
      ) : (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            todayCompleted
              ? "bg-green-500/20 border border-green-500/30"
              : "bg-orange-500/20 border border-orange-500/30"
          }`}
        >
          <Flame
            className={`w-4 h-4 ${
              todayCompleted ? "text-orange-400" : "text-orange-400/60"
            } ${currentStreak >= 7 ? "animate-pulse" : ""}`}
          />
          <span
            className={`text-sm font-medium ${
              todayCompleted ? "text-orange-400" : "text-orange-400/60"
            }`}
          >
            {currentStreak} day{currentStreak !== 1 ? "s" : ""}
          </span>
          {todayCompleted && currentStreak >= 3 && (
            <span className="text-xs text-green-400">✓</span>
          )}
        </div>
      )}
    </div>
  );
}
