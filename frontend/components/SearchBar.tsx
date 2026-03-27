"use client";

import { useState, KeyboardEvent, useMemo } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const EXAMPLE_TOPICS = [
  "How does photosynthesis work?",
  "Explain the causes of World War I",
  "What is the Pythagorean theorem?",
  "How do vaccines work?",
  "Explain supply and demand in economics",
  "What causes earthquakes?",
  "How does the human heart pump blood?",
  "Explain Newton's three laws of motion",
  "What is the water cycle?",
  "How do computers store data?",
  "Explain the process of cell division",
  "What caused the French Revolution?",
  "How does DNA replication work?",
  "Explain the theory of relativity simply",
  "What is climate change and its effects?",
];

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  // Randomly select 5 examples to show
  const displayedExamples = useMemo(() => {
    const shuffled = [...EXAMPLE_TOPICS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, []);

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

  const handleExampleClick = (example: string) => {
    if (!loading) {
      onSearch(example);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to study? (Enter to search, Shift+Enter for new line)"
          disabled={loading}
          rows={2}
          className="w-full px-4 py-4 pr-16 text-base sm:text-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Example Topics */}
      <div className="mt-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Try an example topic
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {displayedExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="px-3 py-1.5 text-xs sm:text-sm bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))]/10 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 rounded-full text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
