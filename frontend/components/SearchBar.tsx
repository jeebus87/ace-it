"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { Search, Loader2, Zap } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  isBeingSucked?: boolean;
  onSuckComplete?: () => void;
}

export function SearchBar({ onSearch, loading, isBeingSucked, onSuckComplete }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Trigger callback when suck animation ends
  useEffect(() => {
    if (isBeingSucked && onSuckComplete) {
      const timer = setTimeout(() => {
        onSuckComplete();
      }, 800); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isBeingSucked, onSuckComplete]);

  const handleSubmit = () => {
    if (query.trim() && !loading) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`
      w-full max-w-3xl mx-auto mb-8 px-4 sm:px-0
      ${isBeingSucked ? 'animate-black-hole-suck' : ''}
    `}>
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-red))]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-yellow))]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(var(--neon-green))]" />
        </div>
        <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
          QUERY_INPUT.exe
        </span>
      </div>

      {/* Main input container */}
      <div
        className={`
          relative
          bg-[hsl(var(--bg-surface))]
          border-2
          transition-all
          duration-300
          ${isFocused
            ? 'border-[hsl(var(--neon-cyan))] neon-glow-cyan'
            : 'border-[hsl(var(--border))]'
          }
          ${isBeingSucked ? 'animate-black-hole-glow' : ''}
        `}
      >
        {/* Pixel corners */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[hsl(var(--neon-cyan))]" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[hsl(var(--neon-cyan))]" />

        {/* Command prompt prefix */}
        <div className="absolute left-4 top-4 flex items-center gap-2 pointer-events-none">
          <span className="text-[hsl(var(--neon-green))] font-bold">&gt;</span>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter your quest... (What do you want to learn?)"
          disabled={loading}
          rows={2}
          className={`
            w-full
            pl-10
            pr-20
            py-4
            text-base
            sm:text-lg
            bg-transparent
            text-[hsl(var(--text-primary))]
            placeholder-[hsl(var(--text-muted))]
            focus:outline-none
            resize-none
            disabled:opacity-50
            disabled:cursor-not-allowed
            font-body
            ${isFocused ? 'animate-flicker' : ''}
          `}
        />

        {/* Blinking cursor when empty and focused */}
        {isFocused && !query && (
          <span className="absolute left-10 top-4 text-[hsl(var(--neon-cyan))] animate-cursor font-bold">
            _
          </span>
        )}

        {/* Submit button - Arcade style */}
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className={`
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            px-4
            py-3
            flex
            items-center
            gap-2
            font-display
            text-xs
            border-2
            transition-all
            duration-200
            min-h-[48px]
            ${loading || !query.trim()
              ? 'border-[hsl(var(--text-dim))] text-[hsl(var(--text-dim))] cursor-not-allowed'
              : 'border-[hsl(var(--neon-cyan))] text-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))] hover:text-[hsl(var(--bg-deep))] hover:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5)]'
            }
          `}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">GO</span>
            </>
          )}
        </button>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <span className="text-xs text-[hsl(var(--text-muted))] font-accent tracking-wider">
          [ENTER] SEARCH
        </span>
        <span className="text-[hsl(var(--neon-cyan))]">|</span>
        <span className="text-xs text-[hsl(var(--text-muted))] font-accent tracking-wider">
          [SHIFT+ENTER] NEW LINE
        </span>
      </div>
    </div>
  );
}
