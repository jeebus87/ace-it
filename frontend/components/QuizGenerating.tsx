"use client";

import { Brain, Sparkles } from "lucide-react";

interface QuizGeneratingProps {
  visible: boolean;
}

export function QuizGenerating({ visible }: QuizGeneratingProps) {
  if (!visible) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-[hsl(var(--primary))]/10 to-blue-500/10 border border-[hsl(var(--primary))]/30 rounded-xl p-6 shadow-lg loading-pulse">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        <div className="relative flex flex-col items-center gap-4">
          {/* Animated icons */}
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[hsl(var(--primary))] animate-pulse" />
            <Brain className="w-10 h-10 text-[hsl(var(--primary))] animate-bounce" />
            <Sparkles className="w-6 h-6 text-[hsl(var(--primary))] animate-pulse" />
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-[hsl(var(--primary))] to-blue-400 bg-clip-text text-transparent mb-1">
              Generating Your Mastery Quiz
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Creating personalized questions to test your understanding...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
