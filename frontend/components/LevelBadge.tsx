"use client";

import { Star, Zap } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  title: string;
  totalXP: number;
  progress: number;
  xpToNextLevel: number;
  leveledUp?: boolean;
}

const getLevelColor = (level: number): string => {
  if (level >= 10) return "from-yellow-400 to-amber-500";
  if (level >= 8) return "from-purple-400 to-pink-500";
  if (level >= 6) return "from-blue-400 to-cyan-500";
  if (level >= 4) return "from-green-400 to-emerald-500";
  return "from-gray-400 to-slate-500";
};

export function LevelBadge({
  level,
  title,
  totalXP,
  progress,
  xpToNextLevel,
  leveledUp,
}: LevelBadgeProps) {
  const levelColor = getLevelColor(level);

  return (
    <div className="relative group">
      {/* Level Up Animation */}
      {leveledUp && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-black rounded-full text-xs font-bold whitespace-nowrap">
            <Zap className="w-3 h-3" />
            LEVEL UP!
          </div>
        </div>
      )}

      {/* Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${levelColor} cursor-pointer transition-transform hover:scale-105`}
      >
        <Star className="w-4 h-4 text-white" />
        <span className="text-sm font-bold text-white">Lv.{level}</span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-3 shadow-xl min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <Star className={`w-5 h-5 bg-gradient-to-r ${levelColor} bg-clip-text text-transparent`} />
            <span className="font-bold text-[hsl(var(--foreground))]">{title}</span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
            Total XP: {totalXP.toLocaleString()}
          </p>
          {level < 10 && (
            <>
              <div className="w-full h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full bg-gradient-to-r ${levelColor} transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {xpToNextLevel} XP to next level
              </p>
            </>
          )}
          {level >= 10 && (
            <p className="text-xs text-yellow-400 font-medium">Max Level!</p>
          )}
        </div>
      </div>
    </div>
  );
}
