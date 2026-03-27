"use client";

import { useState } from "react";
import { GraduationCap, Zap, Brain } from "lucide-react";

interface DifficultyPromptProps {
  open: boolean;
  onSelect: (difficulty: string, dontAskAgain: boolean) => void;
}

const difficulties = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Basic comprehension and recall",
    icon: GraduationCap,
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Application and analysis",
    icon: Zap,
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Critical thinking and synthesis",
    icon: Brain,
  },
];

export function DifficultyPrompt({ open, onSelect }: DifficultyPromptProps) {
  const [selected, setSelected] = useState("intermediate");
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!open) return null;

  const handleContinue = () => {
    onSelect(selected, dontAskAgain);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--background))]/95 p-4">
      <div className="w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[hsl(var(--border))]">
          <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
            Choose Quiz Difficulty
          </h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Select the challenge level for your mastery quiz
          </p>
        </div>

        {/* Difficulty Options */}
        <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {difficulties.map((diff) => {
            const Icon = diff.icon;
            const isSelected = selected === diff.id;

            return (
              <button
                key={diff.id}
                onClick={() => setSelected(diff.id)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary))]/50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? "bg-[hsl(var(--primary))] text-white"
                      : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className={`font-medium ${
                      isSelected
                        ? "text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))]"
                    }`}
                  >
                    {diff.label}
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))]">
                    {diff.description}
                  </div>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                        : "border-[hsl(var(--border))]"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Don't Ask Again & Continue */}
        <div className="p-4 sm:p-6 border-t border-[hsl(var(--border))]">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
            />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Don&apos;t ask me again for this session
            </span>
          </label>

          <button
            onClick={handleContinue}
            className="w-full py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
