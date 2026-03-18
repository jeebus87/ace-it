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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[hsl(var(--muted-foreground))]">
          Loading stats...
        </div>
      </div>
    );
  }

  const activityData = stats.getActivityData(365);

  return (
    <main className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
          Your Stats
        </h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Track your learning progress
        </p>
      </header>

      {/* Level & XP Card */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-blue-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-80">Current Level</p>
              <p className="text-2xl font-bold">
                Level {xp.level} - {xp.title}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{xp.totalXP.toLocaleString()}</p>
            <p className="text-sm opacity-80">Total XP</p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${xp.progress}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-80">
          {xp.level < 10
            ? `${xp.xpToNextLevel} XP to next level`
            : "Max level achieved!"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          label="Quizzes Completed"
          value={stats.totalQuizzes}
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-green-400" />}
          label="Accuracy"
          value={`${stats.accuracy}%`}
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          label="Current Streak"
          value={`${streak.currentStreak} days`}
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-purple-400" />}
          label="Perfect Quizzes"
          value={stats.perfectQuizzes}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" />
            Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">
                Total Questions
              </span>
              <span className="font-medium">{stats.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">
                Correct First Try
              </span>
              <span className="font-medium text-green-400">
                {stats.correctFirstTry}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">
                Longest Streak
              </span>
              <span className="font-medium text-orange-400">
                {streak.longestStreak} days
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-[hsl(var(--primary))]" />
            Achievements
          </h3>
          <div className="space-y-2">
            {stats.totalQuizzes >= 1 && (
              <Achievement label="First Quiz" description="Complete your first quiz" />
            )}
            {stats.perfectQuizzes >= 1 && (
              <Achievement label="Perfectionist" description="Get a perfect score" />
            )}
            {streak.currentStreak >= 7 && (
              <Achievement label="Week Warrior" description="7 day streak" />
            )}
            {xp.level >= 5 && (
              <Achievement label="Expert" description="Reach level 5" />
            )}
            {stats.totalQuizzes === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Complete quizzes to unlock achievements!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={activityData} title="Quiz Activity" />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Achievement({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[hsl(var(--secondary))] rounded-lg">
      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <Trophy className="w-3 h-3 text-yellow-400" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      </div>
    </div>
  );
}
