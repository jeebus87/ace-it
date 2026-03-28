"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Terminal, Database, Cpu } from "lucide-react";

// Custom components for ReactMarkdown with arcade styling
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-display font-bold text-xl sm:text-2xl text-[hsl(var(--neon-cyan))] tracking-wider mt-8 mb-4 pb-2 border-b-2 border-[hsl(var(--neon-cyan))]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display font-bold text-lg sm:text-xl text-[hsl(var(--neon-cyan))] tracking-wider mt-8 mb-4 pb-2 border-b border-[hsl(var(--neon-cyan))]/50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display font-bold text-base sm:text-lg text-[hsl(var(--neon-magenta))] tracking-wider mt-6 mb-3">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-display font-bold text-sm sm:text-base text-[hsl(var(--neon-yellow))] tracking-wider mt-4 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="font-body text-base text-[hsl(var(--text-primary))] leading-relaxed mb-4">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-[hsl(var(--neon-yellow))]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-[hsl(var(--neon-magenta))]">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-none pl-0 my-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-none pl-0 my-4 space-y-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="relative pl-6 text-[hsl(var(--text-primary))]">
      <span className="absolute left-0 text-[hsl(var(--neon-green))]">▸</span>
      {children}
    </li>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block font-body text-sm text-[hsl(var(--neon-magenta))]">
          {children}
        </code>
      );
    }
    return (
      <code className="font-body text-sm text-[hsl(var(--neon-magenta))] bg-[hsl(var(--bg-deep))] px-2 py-1 border border-[hsl(var(--border))]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--neon-magenta))] p-4 overflow-x-auto my-4">
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-[hsl(var(--neon-cyan))] underline decoration-[hsl(var(--neon-cyan))]/50 hover:decoration-[hsl(var(--neon-cyan))]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[hsl(var(--neon-cyan))] bg-[hsl(var(--bg-deep))] pl-4 py-2 my-4 italic text-[hsl(var(--text-muted))]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[hsl(var(--border))] my-6" />,
  table: ({ children }) => (
    <table className="border border-[hsl(var(--border))] w-full my-4">{children}</table>
  ),
  th: ({ children }) => (
    <th className="bg-[hsl(var(--bg-deep))] text-[hsl(var(--neon-cyan))] font-display text-xs p-3 text-left border border-[hsl(var(--border))]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[hsl(var(--border))] p-3 text-sm">{children}</td>
  ),
  sup: ({ children }) => (
    <sup className="text-[hsl(var(--neon-cyan))] font-mono text-xs cursor-pointer hover:text-[hsl(var(--neon-magenta))]">
      {children}
    </sup>
  ),
};

interface Source {
  title: string;
  url: string;
}

interface AnswerDisplayProps {
  content: string;
  sources?: Source[] | null;
  loading?: boolean;
}

export function AnswerDisplay({ content, sources, loading }: AnswerDisplayProps) {
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

              {/* Markdown content with arcade styling */}
              <div className="max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
              </div>

              {/* End marker */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[hsl(var(--border))]">
                <span className="text-[hsl(var(--neon-green))]">&gt;</span>
                <span className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">END_OF_OUTPUT</span>
                <span className="text-[hsl(var(--neon-green))] animate-cursor">_</span>
              </div>

              {/* Sources section */}
              {sources && sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[hsl(var(--neon-cyan))]">&gt;</span>
                    <span className="font-accent text-xs text-[hsl(var(--neon-cyan))] tracking-wider">SOURCES</span>
                  </div>
                  <ol className="space-y-2">
                    {sources.map((source, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <span className="font-mono text-xs text-[hsl(var(--neon-green))] mt-0.5 shrink-0">
                          [{i + 1}]
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-sm text-[hsl(var(--neon-magenta))] hover:text-[hsl(var(--neon-cyan))] underline decoration-[hsl(var(--neon-magenta))]/50 hover:decoration-[hsl(var(--neon-cyan))] transition-colors truncate max-w-full"
                        >
                          {source.title || source.url}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
