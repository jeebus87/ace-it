"use client";

import { Brain, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface QuizGeneratingProps {
  visible: boolean;
}

export function QuizGenerating({ visible }: QuizGeneratingProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("INITIALIZING");

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      setLoadingText("INITIALIZING");
      return;
    }

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    // Cycle through loading messages
    const messages = [
      "INITIALIZING",
      "ANALYZING CONTENT",
      "GENERATING QUESTIONS",
      "CALIBRATING DIFFICULTY",
      "FINALIZING QUIZ",
    ];
    let messageIndex = 0;
    const textInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingText(messages[messageIndex]);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4 sm:px-0">
      <div className={`
        relative
        overflow-hidden
        bg-[hsl(var(--bg-surface))]
        border-2 border-[hsl(var(--neon-cyan))]
        p-6
        neon-glow-cyan
      `}>
        {/* Pixel corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[hsl(var(--neon-cyan))]" />

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)]" />

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--neon-cyan))]/5 to-transparent animate-shimmer" />

        <div className="relative flex flex-col items-center gap-4">
          {/* Animated brain icon */}
          <div className="relative">
            <Brain className="w-12 h-12 text-[hsl(var(--neon-cyan))] animate-neon-pulse" />
            {/* Orbiting particles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <Zap className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 text-[hsl(var(--neon-yellow))]" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
              <Zap className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 text-[hsl(var(--neon-magenta))]" />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-sm text-[hsl(var(--neon-cyan))] neon-text text-center">
            GENERATING QUIZ
          </h3>

          {/* Loading text with cursor */}
          <div className="flex items-center gap-1">
            <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
              {loadingText}
            </span>
            <span className="text-[hsl(var(--neon-cyan))] animate-cursor">_</span>
          </div>

          {/* Progress bar - Segmented arcade style */}
          <div className="w-full max-w-xs">
            <div className="relative h-6 bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--neon-cyan))]">
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
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
            {/* Percentage */}
            <div className="flex justify-between mt-1">
              <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">0%</span>
              <span className="font-display text-[10px] text-[hsl(var(--neon-cyan))]">
                {Math.round(Math.min(progress, 100))}%
              </span>
              <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">100%</span>
            </div>
          </div>

          {/* Bouncing dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[hsl(var(--neon-cyan))]"
                style={{
                  animation: 'bounce 0.6s ease-in-out infinite',
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
