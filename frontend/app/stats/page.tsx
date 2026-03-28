"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  Flame,
  Star,
  TrendingUp,
  Crown,
  Shield,
  Award,
} from "lucide-react";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { useStats } from "@/hooks/useStats";
import { useStreak } from "@/hooks/useStreak";
import { useXP } from "@/hooks/useXP";

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  const stats = useStats();
  const streak = useStreak();
  const xp = useXP();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--bg-deep))]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-6 bg-[hsl(var(--neon-cyan))]"
                style={{
                  animation: 'pulse 0.8s ease-in-out infinite',
                  animationDelay: `${i * 100}ms`,
                  opacity: 0.3,
                }}
              />
            ))}
          </div>
          <span className="font-accent text-sm text-[hsl(var(--text-muted))] tracking-wider">
            LOADING STATS...
          </span>
        </div>
      </div>
    );
  }

  const activityData = stats.getActivityData(365);

  const getLevelColor = (level: number) => {
    if (level >= 10) return { text: "text-[hsl(var(--neon-yellow))]", border: "border-[hsl(var(--neon-yellow))]", glow: "neon-glow-yellow", bg: "bg-[hsl(var(--neon-yellow))]" };
    if (level >= 8) return { text: "text-[hsl(var(--neon-purple))]", border: "border-[hsl(var(--neon-purple))]", glow: "neon-glow-purple", bg: "bg-[hsl(var(--neon-purple))]" };
    if (level >= 6) return { text: "text-[hsl(var(--neon-magenta))]", border: "border-[hsl(var(--neon-magenta))]", glow: "neon-glow-magenta", bg: "bg-[hsl(var(--neon-magenta))]" };
    if (level >= 4) return { text: "text-[hsl(var(--neon-cyan))]", border: "border-[hsl(var(--neon-cyan))]", glow: "neon-glow-cyan", bg: "bg-[hsl(var(--neon-cyan))]" };
    return { text: "text-[hsl(var(--neon-green))]", border: "border-[hsl(var(--neon-green))]", glow: "neon-glow-green", bg: "bg-[hsl(var(--neon-green))]" };
  };

  const levelStyle = getLevelColor(xp.level);

  return (
    <main className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className={`
            inline-flex items-center gap-2
            px-3 py-2 mb-6
            border-2 border-[hsl(var(--border))]
            bg-[hsl(var(--bg-surface))]
            text-[hsl(var(--text-muted))]
            hover:border-[hsl(var(--neon-cyan))] hover:text-[hsl(var(--neon-cyan))]
            transition-all duration-200
            font-display text-xs
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-[hsl(var(--neon-yellow))]" />
          <h1 className="font-display text-xl sm:text-2xl text-[hsl(var(--neon-cyan))] neon-text">
            PLAYER STATS
          </h1>
        </div>
        <p className="font-accent text-sm text-[hsl(var(--text-muted))] tracking-wider">
          TRACK YOUR PROGRESS
        </p>
      </header>

      {/* Level & XP Card - Arcade cabinet style */}
      <div className={`
        relative
        bg-[hsl(var(--bg-surface))]
        border-4 ${levelStyle.border}
        ${levelStyle.glow}
        p-6 mb-6
        overflow-hidden
      `}>
        {/* Pixel corners */}
        <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 ${levelStyle.border}`} />
        <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 ${levelStyle.border}`} />
        <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 ${levelStyle.border}`} />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 ${levelStyle.border}`} />

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(0,255,255,0.02)_2px,rgba(0,255,255,0.02)_4px)]" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {xp.level >= 10 ? (
              <Crown className={`w-12 h-12 ${levelStyle.text} animate-neon-pulse`} />
            ) : (
              <Star className={`w-12 h-12 ${levelStyle.text}`} />
            )}
            <div>
              <p className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider mb-1">
                CURRENT RANK
              </p>
              <p className={`font-display text-lg sm:text-xl ${levelStyle.text} neon-text`}>
                LV.{xp.level} {xp.title.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className={`font-display text-3xl sm:text-4xl ${levelStyle.text}`}>
              {xp.totalXP.toLocaleString()}
            </p>
            <p className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
              TOTAL XP
            </p>
          </div>
        </div>

        {/* XP Progress Bar - Segmented arcade style */}
        <div className="relative h-6 bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--border))]">
          <div
            className={`h-full ${levelStyle.bg} transition-all duration-500`}
            style={{ width: `${xp.progress}%` }}
          />
          {/* Segment lines */}
          <div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r-2 border-[hsl(var(--bg-deep))] last:border-r-0"
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">0%</span>
          <span className={`font-accent text-xs ${levelStyle.text}`}>
            {xp.level < 10
              ? `${xp.xpToNextLevel} XP TO NEXT LEVEL`
              : "MAX RANK ACHIEVED!"}
          </span>
          <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">100%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-[hsl(var(--neon-yellow))]" />}
          label="QUIZZES"
          value={stats.totalQuizzes}
          color="yellow"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-[hsl(var(--neon-green))]" />}
          label="ACCURACY"
          value={`${stats.accuracy}%`}
          color="green"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-[hsl(var(--neon-orange))]" />}
          label="STREAK"
          value={`${streak.currentStreak}D`}
          color="orange"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />}
          label="PERFECT"
          value={stats.perfectQuizzes}
          color="magenta"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Performance Panel */}
        <div className={`
          relative
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-cyan))]
          p-4
        `}>
          {/* Pixel corners */}
          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-[hsl(var(--neon-cyan))]" />
          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-[hsl(var(--neon-cyan))]" />

          <h3 className="font-display text-sm text-[hsl(var(--neon-cyan))] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            PERFORMANCE
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
                TOTAL QUESTIONS
              </span>
              <span className="font-display text-sm text-[hsl(var(--text-primary))]">
                {stats.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
                FIRST TRY
              </span>
              <span className="font-display text-sm text-[hsl(var(--neon-green))]">
                {stats.correctFirstTry}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
                BEST STREAK
              </span>
              <span className="font-display text-sm text-[hsl(var(--neon-orange))]">
                {streak.longestStreak} DAYS
              </span>
            </div>
          </div>
        </div>

        {/* Achievements Panel */}
        <div className={`
          relative
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-yellow))]
          p-4
        `}>
          {/* Pixel corners */}
          <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-[hsl(var(--neon-yellow))]" />
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-[hsl(var(--neon-yellow))]" />
          <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-[hsl(var(--neon-yellow))]" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-[hsl(var(--neon-yellow))]" />

          <h3 className="font-display text-sm text-[hsl(var(--neon-yellow))] mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            ACHIEVEMENTS
          </h3>
          <div className="space-y-2">
            {stats.totalQuizzes >= 1 && (
              <Achievement
                icon={<Shield className="w-4 h-4" />}
                label="FIRST QUEST"
                description="Complete your first quiz"
                color="green"
              />
            )}
            {stats.perfectQuizzes >= 1 && (
              <Achievement
                icon={<Star className="w-4 h-4" />}
                label="PERFECTIONIST"
                description="Get a perfect score"
                color="yellow"
              />
            )}
            {streak.currentStreak >= 7 && (
              <Achievement
                icon={<Flame className="w-4 h-4" />}
                label="WEEK WARRIOR"
                description="7 day streak"
                color="orange"
              />
            )}
            {xp.level >= 5 && (
              <Achievement
                icon={<Crown className="w-4 h-4" />}
                label="EXPERT"
                description="Reach level 5"
                color="magenta"
              />
            )}
            {stats.totalQuizzes === 0 && (
              <p className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
                COMPLETE QUIZZES TO UNLOCK!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={activityData} title="ACTIVITY LOG" />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "yellow" | "green" | "orange" | "magenta";
}) {
  const colorMap = {
    yellow: { border: "border-[hsl(var(--neon-yellow))]", text: "text-[hsl(var(--neon-yellow))]" },
    green: { border: "border-[hsl(var(--neon-green))]", text: "text-[hsl(var(--neon-green))]" },
    orange: { border: "border-[hsl(var(--neon-orange))]", text: "text-[hsl(var(--neon-orange))]" },
    magenta: { border: "border-[hsl(var(--neon-magenta))]", text: "text-[hsl(var(--neon-magenta))]" },
  };

  const style = colorMap[color];

  return (
    <div className={`
      relative
      bg-[hsl(var(--bg-surface))]
      border-2 ${style.border}
      p-4
    `}>
      {/* Pixel corners */}
      <div className={`absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l ${style.border}`} />
      <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r ${style.border}`} />
      <div className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l ${style.border}`} />
      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r ${style.border}`} />

      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">
          {label}
        </span>
      </div>
      <p className={`font-display text-2xl ${style.text}`}>{value}</p>
    </div>
  );
}

function Achievement({
  icon,
  label,
  description,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: "yellow" | "green" | "orange" | "magenta";
}) {
  const colorMap = {
    yellow: "text-[hsl(var(--neon-yellow))] border-[hsl(var(--neon-yellow))] bg-[hsl(var(--neon-yellow))]/10",
    green: "text-[hsl(var(--neon-green))] border-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/10",
    orange: "text-[hsl(var(--neon-orange))] border-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/10",
    magenta: "text-[hsl(var(--neon-magenta))] border-[hsl(var(--neon-magenta))] bg-[hsl(var(--neon-magenta))]/10",
  };

  return (
    <div className={`flex items-center gap-3 p-2 border ${colorMap[color]}`}>
      <div className={colorMap[color].split(" ")[0]}>
        {icon}
      </div>
      <div>
        <p className={`font-display text-xs ${colorMap[color].split(" ")[0]}`}>{label}</p>
        <p className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">
          {description}
        </p>
      </div>
    </div>
  );
}
