"use client";

import { useState } from "react";
import { X, Download, ZoomIn, Image } from "lucide-react";

interface ImageViewerProps {
  src: string;
}

export function ImageViewer({ src }: ImageViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = "ace-it-visual.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto mb-8 px-4 sm:px-0">
        <div className={`
          relative
          bg-[hsl(var(--bg-surface))]
          border-2 border-[hsl(var(--neon-magenta))]
          p-4
        `}>
          {/* Pixel corners */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[hsl(var(--neon-magenta))]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[hsl(var(--neon-magenta))]" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[hsl(var(--neon-magenta))]" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[hsl(var(--neon-magenta))]" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-[hsl(var(--neon-magenta))]" />
              <h3 className="font-display text-xs text-[hsl(var(--neon-magenta))]">
                VISUAL
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(true)}
                className={`
                  p-2
                  border border-[hsl(var(--border))]
                  hover:border-[hsl(var(--neon-cyan))] hover:text-[hsl(var(--neon-cyan))]
                  transition-colors
                `}
                title="View full size"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className={`
                  p-2
                  border border-[hsl(var(--border))]
                  hover:border-[hsl(var(--neon-green))] hover:text-[hsl(var(--neon-green))]
                  transition-colors
                `}
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="cursor-pointer overflow-hidden border-2 border-[hsl(var(--border))]"
            onClick={() => setIsExpanded(true)}
          >
            <img
              src={src}
              alt="Educational visual explanation"
              className="w-full h-auto max-h-60 sm:max-h-80 object-contain bg-[hsl(var(--bg-deep))]"
            />
          </div>

          {/* Footer */}
          <p className="font-accent text-[10px] text-[hsl(var(--text-muted))] mt-2 text-center tracking-wider">
            [CLICK TO EXPAND]
          </p>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--bg-deep))]/95 p-4"
          onClick={() => setIsExpanded(false)}
        >
          {/* Scanline overlay */}
          <div className="fixed inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,0,255,0.02)_2px,rgba(255,0,255,0.02)_4px)]" />

          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className={`
                p-3
                bg-[hsl(var(--bg-surface))]
                border-2 border-[hsl(var(--neon-green))]
                text-[hsl(var(--neon-green))]
                hover:neon-glow-green
                transition-all
              `}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className={`
                p-3
                bg-[hsl(var(--bg-surface))]
                border-2 border-[hsl(var(--neon-red))]
                text-[hsl(var(--neon-red))]
                hover:neon-glow-red
                transition-all
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image frame */}
          <div
            className={`
              relative
              border-4 border-[hsl(var(--neon-magenta))]
              neon-glow-magenta
              max-w-[90vw] max-h-[85vh]
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pixel corners */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[hsl(var(--neon-magenta))]" />

            <img
              src={src}
              alt="Educational visual explanation"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
