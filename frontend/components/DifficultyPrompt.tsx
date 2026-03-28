"use client";

import { useState } from "react";
import { GraduationCap, Zap, Brain, ChevronRight } from "lucide-react";

interface DifficultyPromptProps {
  open: boolean;
  onSelect: (difficulty: string, dontAskAgain: boolean) => void;
}

const difficulties = [
  {
    id: "beginner",
    label: "EASY",
    description: "Basic comprehension and recall",
    icon: GraduationCap,
    color: "neon-green",
    colorClass: "text-[hsl(var(--neon-green))]",
    borderClass: "border-[hsl(var(--neon-green))]",
    glowClass: "neon-glow-green",
    bgClass: "bg-[hsl(var(--neon-green))]",
  },
  {
    id: "intermediate",
    label: "NORMAL",
    description: "Application and analysis",
    icon: Zap,
    color: "neon-yellow",
    colorClass: "text-[hsl(var(--neon-yellow))]",
    borderClass: "border-[hsl(var(--neon-yellow))]",
    glowClass: "neon-glow-yellow",
    bgClass: "bg-[hsl(var(--neon-yellow))]",
  },
  {
    id: "advanced",
    label: "HARD",
    description: "Critical thinking and synthesis",
    icon: Brain,
    color: "neon-red",
    colorClass: "text-[hsl(var(--neon-red))]",
    borderClass: "border-[hsl(var(--neon-red))]",
    glowClass: "neon-glow-red",
    bgClass: "bg-[hsl(var(--neon-red))]",
  },
];

export function DifficultyPrompt({ open, onSelect }: DifficultyPromptProps) {
  const [selected, setSelected] = useState("intermediate");
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!open) return null;

  const handleContinue = () => {
    onSelect(selected, dontAskAgain);
  };

  const selectedDiff = difficulties.find(d => d.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--bg-deep))]/95 p-4 animate-crt-boot">
      <div className={`
        relative
        w-full max-w-md
        bg-[hsl(var(--bg-surface))]
        border-2 ${selectedDiff?.borderClass || 'border-[hsl(var(--border))]'}
        max-h-[90vh]
        flex flex-col
        ${selectedDiff?.glowClass || ''}
        transition-all duration-300
      `}>
        {/* Pixel corners */}
        <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${selectedDiff?.borderClass || 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${selectedDiff?.borderClass || 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${selectedDiff?.borderClass || 'border-[hsl(var(--border))]'}`} />
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${selectedDiff?.borderClass || 'border-[hsl(var(--border))]'}`} />

        {/* Header */}
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h2 className="font-display text-sm sm:text-base text-[hsl(var(--neon-cyan))] neon-text text-center">
            SELECT DIFFICULTY
          </h2>
          <p className="font-accent text-xs text-[hsl(var(--text-muted))] mt-2 text-center tracking-wider">
            CHOOSE YOUR CHALLENGE LEVEL
          </p>
        </div>

        {/* Difficulty Options - Arcade Menu Style */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {difficulties.map((diff, index) => {
            const Icon = diff.icon;
            const isSelected = selected === diff.id;

            return (
              <button
                key={diff.id}
                onClick={() => setSelected(diff.id)}
                className={`
                  relative
                  w-full p-4
                  text-left
                  border-2
                  transition-all duration-200
                  flex items-center gap-4
                  min-h-[72px]
                  ${isSelected
                    ? `${diff.borderClass} ${diff.glowClass} bg-[hsl(var(--bg-elevated))]`
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--bg-surface))] hover:border-[hsl(var(--text-muted))]'
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${diff.bgClass}`} />
                )}

                {/* Icon */}
                <div className={`
                  p-2
                  border-2
                  ${isSelected ? diff.borderClass : 'border-[hsl(var(--border))]'}
                `}>
                  <Icon className={`w-5 h-5 ${isSelected ? diff.colorClass : 'text-[hsl(var(--text-muted))]'}`} />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className={`
                    font-display text-sm
                    ${isSelected ? diff.colorClass : 'text-[hsl(var(--text-primary))]'}
                    ${isSelected ? 'neon-text' : ''}
                  `}>
                    {diff.label}
                  </div>
                  <div className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wide">
                    {diff.description}
                  </div>
                </div>

                {/* Arrow indicator */}
                {isSelected && (
                  <ChevronRight className={`w-5 h-5 ${diff.colorClass} animate-neon-pulse`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Don't Ask Again & Continue */}
        <div className="p-4 sm:p-6 border-t border-[hsl(var(--border))]">
          {/* Checkbox - Arcade style */}
          <label className="flex items-center gap-3 mb-4 cursor-pointer group">
            <div className={`
              relative w-5 h-5
              border-2 border-[hsl(var(--text-muted))]
              bg-[hsl(var(--bg-deep))]
              transition-all
              group-hover:border-[hsl(var(--neon-cyan))]
              ${dontAskAgain ? 'border-[hsl(var(--neon-cyan))]' : ''}
            `}>
              {dontAskAgain && (
                <div className="absolute inset-1 bg-[hsl(var(--neon-cyan))]" />
              )}
            </div>
            <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wide">
              REMEMBER MY CHOICE
            </span>
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="sr-only"
            />
          </label>

          {/* Start button */}
          <button
            onClick={handleContinue}
            className={`
              w-full py-4
              font-display text-sm
              border-2
              ${selectedDiff?.borderClass || 'border-[hsl(var(--neon-cyan))]'}
              ${selectedDiff?.colorClass || 'text-[hsl(var(--neon-cyan))]'}
              bg-[hsl(var(--bg-surface))]
              transition-all duration-200
              hover:${selectedDiff?.glowClass || 'neon-glow-cyan'}
              hover:bg-[hsl(var(--bg-elevated))]
              active:scale-[0.98]
            `}
          >
            START QUIZ
          </button>
        </div>
      </div>
    </div>
  );
}
