"use client";

import { Flame, AlertTriangle, Zap } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  isAtRisk: boolean;
  todayCompleted: boolean;
}

export function StreakBadge({ currentStreak, isAtRisk, todayCompleted }: StreakBadgeProps) {
  if (currentStreak === 0 && !isAtRisk) return null;

  const isOnFire = currentStreak >= 7;
  const isHot = currentStreak >= 3;

  if (isAtRisk) {
    return (
      <div className="relative group">
        <div className={`
          flex items-center gap-2 px-3 py-2
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-orange))]
          animate-neon-pulse
        `}>
          {/* Pixel corners */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[hsl(var(--neon-orange))]" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-[hsl(var(--neon-orange))]" />
          <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-[hsl(var(--neon-orange))]" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[hsl(var(--neon-orange))]" />

          <AlertTriangle className="w-4 h-4 text-[hsl(var(--neon-orange))] animate-shake" />
          <span className="font-display text-xs text-[hsl(var(--neon-orange))]">
            {currentStreak}
          </span>
          <Flame className="w-4 h-4 text-[hsl(var(--neon-orange))] opacity-50" />
        </div>

        {/* Tooltip */}
        <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-[hsl(var(--bg-surface))] border-2 border-[hsl(var(--neon-orange))] p-3 min-w-[160px]">
            <p className="font-display text-xs text-[hsl(var(--neon-orange))] mb-1">
              STREAK AT RISK!
            </p>
            <p className="font-accent text-xs text-[hsl(var(--text-muted))]">
              Complete a quiz today to save your {currentStreak} day streak!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`
        relative
        flex items-center gap-2 px-3 py-2
        bg-[hsl(var(--bg-surface))]
        border-2
        transition-all duration-200
        ${isOnFire
          ? 'border-[hsl(var(--neon-orange))] neon-glow-yellow'
          : isHot
            ? 'border-[hsl(var(--neon-orange))]'
            : 'border-[hsl(var(--border))]'
        }
      `}>
        {/* Pixel corners */}
        <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l ${isOnFire ? 'border-[hsl(var(--neon-orange))]' : 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r ${isOnFire ? 'border-[hsl(var(--neon-orange))]' : 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l ${isOnFire ? 'border-[hsl(var(--neon-orange))]' : 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r ${isOnFire ? 'border-[hsl(var(--neon-orange))]' : 'border-[hsl(var(--border))]'}`} />

        {/* Flame icon with fire animation for hot streaks */}
        <Flame
          className={`
            w-4 h-4
            ${todayCompleted
              ? isOnFire
                ? 'text-[hsl(var(--neon-orange))] animate-fire'
                : 'text-[hsl(var(--neon-orange))]'
              : 'text-[hsl(var(--text-muted))]'
            }
          `}
        />

        {/* Streak count */}
        <span className={`
          font-display text-xs
          ${isOnFire
            ? 'text-[hsl(var(--neon-orange))] neon-text'
            : todayCompleted
              ? 'text-[hsl(var(--neon-orange))]'
              : 'text-[hsl(var(--text-muted))]'
          }
        `}>
          {currentStreak}
        </span>

        {/* Completed check */}
        {todayCompleted && (
          <Zap className="w-3 h-3 text-[hsl(var(--neon-green))]" />
        )}

        {/* ON FIRE! indicator for hot streaks */}
        {isOnFire && todayCompleted && (
          <span className="font-display text-[8px] text-[hsl(var(--neon-yellow))] animate-neon-pulse">
            FIRE!
          </span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
        <div className={`
          bg-[hsl(var(--bg-surface))]
          border-2 ${isOnFire ? 'border-[hsl(var(--neon-orange))]' : 'border-[hsl(var(--border))]'}
          p-3
          min-w-[150px]
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${isOnFire ? 'text-[hsl(var(--neon-orange))] animate-fire' : 'text-[hsl(var(--neon-orange))]'}`} />
            <span className="font-display text-xs text-[hsl(var(--text-primary))]">
              {currentStreak} DAY{currentStreak !== 1 ? 'S' : ''}
            </span>
          </div>
          <p className="font-accent text-xs text-[hsl(var(--text-muted))]">
            {todayCompleted
              ? isOnFire
                ? "You're on fire! Keep it up!"
                : "Nice work today!"
              : "Complete a quiz to extend your streak!"
            }
          </p>
          {isOnFire && (
            <div className="flex items-center gap-1 mt-2 text-[hsl(var(--neon-yellow))]">
              <Zap className="w-3 h-3" />
              <span className="font-display text-[8px]">+50% XP BONUS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
