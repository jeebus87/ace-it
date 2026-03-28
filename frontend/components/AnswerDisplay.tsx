"use client";

import ReactMarkdown from "react-markdown";
import { Terminal, Database, Cpu } from "lucide-react";

interface AnswerDisplayProps {
  content: string;
  loading?: boolean;
}

export function AnswerDisplay({ content, loading }: AnswerDisplayProps) {
  if (!content && !loading) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4 sm:px-0">
      {/* Terminal window */}
      <div className={`
        relative
        bg-[hsl(var(--bg-surface))]
        border-2 border-[hsl(var(--neon-green))]
        overflow-hidden
      `}>
        {/* Pixel corners */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[hsl(var(--neon-green))]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[hsl(var(--neon-green))]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[hsl(var(--neon-green))]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[hsl(var(--neon-green))]" />

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(0,255,0,0.03)_2px,rgba(0,255,0,0.03)_4px)]" />

        {/* Terminal header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-2 border-[hsl(var(--border))] bg-[hsl(var(--bg-deep))]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-[hsl(var(--neon-red))]" />
              <div className="w-3 h-3 bg-[hsl(var(--neon-yellow))]" />
              <div className="w-3 h-3 bg-[hsl(var(--neon-green))]" />
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[hsl(var(--neon-green))]" />
              <span className="font-accent text-xs text-[hsl(var(--neon-green))] tracking-wider hidden sm:inline">
                KNOWLEDGE_BASE.exe
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[hsl(var(--text-muted))]">
            <Database className="w-3 h-3" />
            <Cpu className="w-3 h-3" />
          </div>
        </div>

        {/* Content area */}
        <div className="relative p-4 sm:p-6 min-h-[200px] max-h-[60vh] overflow-y-auto">
          {loading && !content ? (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Retro loading animation */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-8 bg-[hsl(var(--neon-green))]"
                      style={{
                        animation: 'pulse 0.8s ease-in-out infinite',
                        animationDelay: `${i * 100}ms`,
                        opacity: 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Loading text with cursor */}
              <div className="font-accent text-sm text-[hsl(var(--neon-green))] tracking-wider">
                <span className="animate-flicker">ANALYZING SOURCES</span>
                <span className="animate-cursor ml-1">_</span>
              </div>

              {/* Progress dots */}
              <div className="flex gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-[hsl(var(--neon-green))]"
                    style={{
                      animation: 'bounce 0.6s ease-in-out infinite',
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="terminal-content">
              {/* Command prompt */}
              <div className="flex items-center gap-2 mb-4 font-accent text-xs text-[hsl(var(--text-muted))]">
                <span className="text-[hsl(var(--neon-green))]">&gt;</span>
                <span>OUTPUT_RESULT</span>
              </div>

              {/* Markdown content with terminal styling */}
              <div className="
                prose prose-invert max-w-none
                prose-headings:font-display prose-headings:font-bold prose-headings:text-[hsl(var(--neon-cyan))] prose-headings:tracking-wider
                prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b-2 prose-h1:border-[hsl(var(--neon-cyan))]
                prose-h2:text-lg prose-h2:sm:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[hsl(var(--neon-cyan))]/50
                prose-h3:text-base prose-h3:sm:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-[hsl(var(--neon-magenta))]
                prose-h4:text-sm prose-h4:sm:text-base prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-[hsl(var(--neon-yellow))]
                prose-p:font-body prose-p:text-[hsl(var(--text-primary))] prose-p:text-base prose-p:leading-relaxed prose-p:mb-4
                prose-strong:text-[hsl(var(--neon-yellow))] prose-strong:font-bold
                prose-em:text-[hsl(var(--neon-magenta))]
                prose-code:font-body prose-code:text-[hsl(var(--neon-magenta))] prose-code:bg-[hsl(var(--bg-deep))] prose-code:px-2 prose-code:py-1 prose-code:border prose-code:border-[hsl(var(--border))] prose-code:text-sm
                prose-pre:bg-[hsl(var(--bg-deep))] prose-pre:border-2 prose-pre:border-[hsl(var(--neon-magenta))] prose-pre:p-4 prose-pre:overflow-x-auto
                prose-a:text-[hsl(var(--neon-cyan))] prose-a:underline prose-a:decoration-[hsl(var(--neon-cyan))/50] hover:prose-a:decoration-[hsl(var(--neon-cyan))]
                prose-ul:list-none prose-ul:pl-0 prose-ul:my-4
                prose-li:relative prose-li:pl-6 prose-li:text-[hsl(var(--text-primary))] prose-li:mb-2
                prose-li:before:content-['▸'] prose-li:before:absolute prose-li:before:left-0 prose-li:before:text-[hsl(var(--neon-green))]
                prose-ol:list-none prose-ol:pl-0 prose-ol:counter-reset-[item] prose-ol:my-4
                prose-blockquote:border-l-4 prose-blockquote:border-[hsl(var(--neon-cyan))] prose-blockquote:bg-[hsl(var(--bg-deep))] prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-[hsl(var(--text-muted))] prose-blockquote:my-4
                prose-hr:border-[hsl(var(--border))] prose-hr:my-6
                prose-table:border prose-table:border-[hsl(var(--border))]
                prose-th:bg-[hsl(var(--bg-deep))] prose-th:text-[hsl(var(--neon-cyan))] prose-th:font-display prose-th:text-xs prose-th:p-3
                prose-td:border prose-td:border-[hsl(var(--border))] prose-td:p-3 prose-td:text-sm
              ">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {/* End marker */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--neon-green))]">&gt;</span>
                <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">END_OF_OUTPUT</span>
                <span className="text-[hsl(var(--neon-green))] animate-cursor">_</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
