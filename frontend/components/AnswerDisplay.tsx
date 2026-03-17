"use client";

import ReactMarkdown from "react-markdown";

interface AnswerDisplayProps {
  content: string;
  loading?: boolean;
}

export function AnswerDisplay({ content, loading }: AnswerDisplayProps) {
  if (!content && !loading) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 sm:p-6 shadow-lg">
        {loading && !content ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                Analyzing sources and generating answer...
              </p>
            </div>
          </div>
        ) : (
          <div className="markdown-content prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
