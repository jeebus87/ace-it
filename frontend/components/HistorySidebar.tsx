"use client";

import { useState } from "react";
import { History, ChevronUp, ChevronDown, Clock, Trash2, Trophy, X, Scroll, ChevronRight, Zap } from "lucide-react";

interface Question {
  id: number;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface Quiz {
  questions: Question[];
  topic: string;
  total: number;
  difficulty?: string;
}

export interface QuizProgress {
  currentIndex: number;
  score: number;
  attempts: Record<number, number>;
  completed: boolean;
  disabledChoices: Record<number, string[]>;
}

export interface Inquiry {
  id: string;
  query: string;
  answer: string;
  image: string | null;
  quiz: Quiz | null;
  quizProgress: QuizProgress | null;
  timestamp: Date;
}

interface HistorySidebarProps {
  inquiries: Inquiry[];
  currentId: string | null;
  onSelect: (inquiry: Inquiry) => void;
  onClear: () => void;
}

export function HistorySidebar({
  inquiries,
  currentId,
  onSelect,
  onClear,
}: HistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (inquiries.length === 0) return null;

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <>
      {/* Desktop: Side panel toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          hidden sm:flex
          fixed top-4 z-50
          items-center gap-2
          px-3 py-2
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-magenta))]
          text-[hsl(var(--neon-magenta))]
          transition-all duration-300
          hover:neon-glow-magenta
          ${isOpen ? "left-[18.5rem]" : "left-4"}
        `}
        title={isOpen ? "Close history" : "View history"}
      >
        {/* Pixel corners */}
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[hsl(var(--neon-magenta))]" />

        {isOpen ? (
          <ChevronRight className="w-4 h-4 rotate-180" />
        ) : (
          <>
            <History className="w-4 h-4" />
            <span className="font-display text-xs">{inquiries.length}</span>
          </>
        )}
      </button>

      {/* Mobile: Bottom sheet trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          sm:hidden
          fixed bottom-4 left-4 z-50
          flex items-center gap-2
          px-4 py-3
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-magenta))]
          text-[hsl(var(--neon-magenta))]
          neon-glow-magenta
        `}
      >
        {/* Pixel corners */}
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-[hsl(var(--neon-magenta))]" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[hsl(var(--neon-magenta))]" />

        <Scroll className="w-4 h-4" />
        <span className="font-display text-xs">{inquiries.length}</span>
        <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Desktop: Side panel */}
      <div
        className={`
          hidden sm:block
          fixed top-0 left-0 h-full w-72
          bg-[hsl(var(--bg-surface))]
          border-r-2 border-[hsl(var(--neon-magenta))]
          z-40
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,0,255,0.02)_2px,rgba(255,0,255,0.02)_4px)]" />

        {/* Header */}
        <div className="relative p-4 border-b-2 border-[hsl(var(--border))] bg-[hsl(var(--bg-deep))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
              <h2 className="font-display text-sm text-[hsl(var(--neon-magenta))] neon-text">
                LOG
              </h2>
            </div>
            {inquiries.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 border border-[hsl(var(--border))] hover:border-[hsl(var(--neon-red))] hover:text-[hsl(var(--neon-red))] transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="font-accent text-xs text-[hsl(var(--text-muted))] mt-2 tracking-wider">
            {inquiries.length} ENTR{inquiries.length === 1 ? "Y" : "IES"}
          </p>
        </div>

        {/* Inquiry List */}
        <div className="relative overflow-y-auto h-[calc(100%-90px)]">
          {inquiries.map((inquiry, index) => (
            <button
              key={inquiry.id}
              onClick={() => {
                onSelect(inquiry);
                setIsOpen(false);
              }}
              className={`
                relative w-full p-4 text-left
                border-b border-[hsl(var(--border))]
                transition-all duration-200
                ${currentId === inquiry.id
                  ? "bg-[hsl(var(--neon-magenta))]/10 border-l-4 border-l-[hsl(var(--neon-magenta))]"
                  : "hover:bg-[hsl(var(--bg-elevated))]"
                }
              `}
            >
              {/* Entry number - arcade high score style */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">
                  #{String(inquiries.length - index).padStart(2, "0")}
                </span>
                <span className="font-display text-[10px] text-[hsl(var(--neon-cyan))]">
                  {formatTime(inquiry.timestamp)}
                </span>
              </div>

              <p className="font-body text-sm text-[hsl(var(--text-primary))] leading-tight mb-2">
                {truncate(inquiry.query, 50)}
              </p>

              <div className="flex items-center gap-2">
                {inquiry.quiz && (
                  <span className={`
                    flex items-center gap-1
                    px-2 py-0.5
                    border
                    font-display text-[10px]
                    ${inquiry.quizProgress?.completed
                      ? "border-[hsl(var(--neon-green))] text-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/10"
                      : "border-[hsl(var(--neon-yellow))] text-[hsl(var(--neon-yellow))] bg-[hsl(var(--neon-yellow))]/10"
                    }
                  `}>
                    {inquiry.quizProgress?.completed ? (
                      <>
                        <Trophy className="w-3 h-3" />
                        <span>CLEAR</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>QUIZ</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div
        className={`
          sm:hidden
          fixed inset-x-0 bottom-0 z-40
          bg-[hsl(var(--bg-surface))]
          border-t-2 border-[hsl(var(--neon-magenta))]
          transform transition-transform duration-300
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          max-h-[70vh]
        `}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,0,255,0.02)_2px,rgba(255,0,255,0.02)_4px)]" />

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-[hsl(var(--neon-magenta))]" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 pb-3 border-b-2 border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
            <h2 className="font-display text-sm text-[hsl(var(--neon-magenta))] neon-text">
              SESSION LOG
            </h2>
            <span className="font-accent text-xs text-[hsl(var(--text-muted))]">
              ({inquiries.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {inquiries.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 border border-[hsl(var(--border))] hover:border-[hsl(var(--neon-red))] hover:text-[hsl(var(--neon-red))] transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 border border-[hsl(var(--border))] hover:border-[hsl(var(--neon-cyan))] hover:text-[hsl(var(--neon-cyan))] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inquiry List */}
        <div className="relative overflow-y-auto max-h-[calc(70vh-80px)] pb-20">
          {inquiries.map((inquiry, index) => (
            <button
              key={inquiry.id}
              onClick={() => {
                onSelect(inquiry);
                setIsOpen(false);
              }}
              className={`
                relative w-full p-4 text-left
                border-b border-[hsl(var(--border))]
                transition-all duration-200
                ${currentId === inquiry.id
                  ? "bg-[hsl(var(--neon-magenta))]/10 border-l-4 border-l-[hsl(var(--neon-magenta))]"
                  : "active:bg-[hsl(var(--bg-elevated))]"
                }
              `}
            >
              {/* Entry info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[10px] text-[hsl(var(--text-muted))]">
                    #{String(inquiries.length - index).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[10px] text-[hsl(var(--neon-cyan))]">
                    {formatTime(inquiry.timestamp)}
                  </span>
                </div>
                {inquiry.quiz && (
                  <span className={`
                    flex items-center gap-1
                    px-2 py-0.5
                    border
                    font-display text-[10px]
                    ${inquiry.quizProgress?.completed
                      ? "border-[hsl(var(--neon-green))] text-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/10"
                      : "border-[hsl(var(--neon-yellow))] text-[hsl(var(--neon-yellow))] bg-[hsl(var(--neon-yellow))]/10"
                    }
                  `}>
                    {inquiry.quizProgress?.completed ? (
                      <>
                        <Trophy className="w-3 h-3" />
                        <span>CLEAR</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>QUIZ</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <p className="font-body text-sm text-[hsl(var(--text-primary))] leading-tight">
                {truncate(inquiry.query, 60)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[hsl(var(--bg-deep))]/70 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
