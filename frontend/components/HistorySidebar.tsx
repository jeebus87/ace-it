"use client";

import { useState } from "react";
import { History, ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";

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

export interface Inquiry {
  id: string;
  query: string;
  answer: string;
  image: string | null;
  quiz: Quiz | null;
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
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 p-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg hover:bg-[hsl(var(--secondary))] transition-all ${
          isOpen ? "left-72" : "left-4"
        }`}
        title={isOpen ? "Close history" : "View history"}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <span className="text-xs font-medium">{inquiries.length}</span>
          </div>
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] shadow-xl z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h2 className="font-semibold">History</h2>
            </div>
            {inquiries.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 rounded hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"} this session
          </p>
        </div>

        {/* Inquiry List */}
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {inquiries.map((inquiry) => (
            <button
              key={inquiry.id}
              onClick={() => onSelect(inquiry)}
              className={`w-full p-4 text-left border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors ${
                currentId === inquiry.id
                  ? "bg-[hsl(var(--primary))]/10 border-l-2 border-l-[hsl(var(--primary))]"
                  : ""
              }`}
            >
              <p className="font-medium text-sm leading-tight mb-1">
                {truncate(inquiry.query, 60)}
              </p>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <Clock className="w-3 h-3" />
                <span>{formatTime(inquiry.timestamp)}</span>
                {inquiry.quiz && (
                  <span className="px-1.5 py-0.5 bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded text-[10px]">
                    Quiz
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
