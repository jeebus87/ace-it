"use client";

import { Star, Zap, Crown } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  title: string;
  totalXP: number;
  progress: number;
  xpToNextLevel: number;
  leveledUp?: boolean;
}

const getLevelStyle = (level: number) => {
  if (level >= 10) return {
    border: "border-[hsl(var(--neon-yellow))]",
    glow: "neon-glow-yellow",
    text: "text-[hsl(var(--neon-yellow))]",
    bg: "bg-[hsl(var(--neon-yellow))]",
    icon: Crown,
  };
  if (level >= 8) return {
    border: "border-[hsl(var(--neon-purple))]",
    glow: "neon-glow-purple",
    text: "text-[hsl(var(--neon-purple))]",
    bg: "bg-[hsl(var(--neon-purple))]",
    icon: Star,
  };
  if (level >= 6) return {
    border: "border-[hsl(var(--neon-magenta))]",
    glow: "neon-glow-magenta",
    text: "text-[hsl(var(--neon-magenta))]",
    bg: "bg-[hsl(var(--neon-magenta))]",
    icon: Star,
  };
  if (level >= 4) return {
    border: "border-[hsl(var(--neon-cyan))]",
    glow: "neon-glow-cyan",
    text: "text-[hsl(var(--neon-cyan))]",
    bg: "bg-[hsl(var(--neon-cyan))]",
    icon: Star,
  };
  return {
    border: "border-[hsl(var(--neon-green))]",
    glow: "neon-glow-green",
    text: "text-[hsl(var(--neon-green))]",
    bg: "bg-[hsl(var(--neon-green))]",
    icon: Star,
  };
};

export function LevelBadge({
  level,
  title,
  totalXP,
  progress,
  xpToNextLevel,
  leveledUp,
}: LevelBadgeProps) {
  const style = getLevelStyle(level);
  const Icon = style.icon;

  return (
    <div className="relative group">
      {/* Level Up Animation */}
      {leveledUp && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-level-up">
          <div className={`
            flex items-center gap-2 px-4 py-2
            bg-[hsl(var(--bg-surface))]
            border-2 border-[hsl(var(--neon-yellow))]
            ${style.text}
            font-display text-xs
            neon-glow-yellow
          `}>
            <Zap className="w-4 h-4 animate-fire" />
            <span>LEVEL UP!</span>
            <Zap className="w-4 h-4 animate-fire" />
          </div>
        </div>
      )}

      {/* Badge - Pixel Art Style */}
      <div
        className={`
          relative
          flex items-center gap-2
          px-3 py-2
          bg-[hsl(var(--bg-surface))]
          border-2 ${style.border}
          cursor-pointer
          transition-all duration-200
          hover:${style.glow}
          group-hover:scale-105
        `}
      >
        {/* Pixel corners */}
        <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l ${style.border}`} />
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r ${style.border}`} />
        <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l ${style.border}`} />
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r ${style.border}`} />

        <Icon className={`w-4 h-4 ${style.text} ${level >= 10 ? 'animate-neon-pulse' : ''}`} />
        <span className={`font-display text-xs ${style.text}`}>
          LV.{level}
        </span>
      </div>

      {/* Tooltip on hover - Arcade style */}
      <div className="absolute top-full right-0 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
        <div className={`
          bg-[hsl(var(--bg-surface))]
          border-2 ${style.border}
          p-4
          min-w-[200px]
          ${style.glow}
        `}>
          {/* Pixel corners on tooltip */}
          <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l ${style.border}`} />
          <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r ${style.border}`} />
          <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l ${style.border}`} />
          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r ${style.border}`} />

          {/* Title */}
          <div className="flex items-center gap-2 mb-3">
            <Icon className={`w-5 h-5 ${style.text}`} />
            <span className={`font-display text-xs ${style.text}`}>{title.toUpperCase()}</span>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-accent text-xs text-[hsl(var(--text-muted))]">TOTAL XP</span>
              <span className={`font-display text-xs ${style.text}`}>
                {totalXP.toLocaleString()}
              </span>
            </div>

            {level < 10 ? (
              <>
                {/* XP Progress Bar - Segmented like old HP bars */}
                <div className="relative h-4 bg-[hsl(var(--bg-deep))] border border-[hsl(var(--border))]">
                  <div
                    className={`h-full ${style.bg} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                  {/* Segment lines */}
                  <div className="absolute inset-0 flex">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-[hsl(var(--bg-deep))] last:border-r-0"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-accent text-xs text-[hsl(var(--text-muted))]">NEXT LV</span>
                  <span className="font-display text-xs text-[hsl(var(--neon-cyan))]">
                    {xpToNextLevel} XP
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2">
                <Crown className="w-4 h-4 text-[hsl(var(--neon-yellow))] animate-neon-pulse" />
                <span className="font-display text-xs text-[hsl(var(--neon-yellow))]">
                  MAX RANK!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
