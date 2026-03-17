"use client";

import { useState } from "react";
import { X, Download, ZoomIn } from "lucide-react";

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
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[hsl(var(--primary))]">
              Visual Explanation
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                title="View full size"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            className="cursor-pointer rounded-lg overflow-hidden"
            onClick={() => setIsExpanded(true)}
          >
            <img
              src={src}
              alt="Educational visual explanation"
              className="w-full h-auto max-h-80 object-contain bg-[hsl(var(--secondary))]"
            />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 text-center">
            Click to view full size
          </p>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="absolute top-4 right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="w-6 h-6 text-white" />
          </button>
          <img
            src={src}
            alt="Educational visual explanation"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
