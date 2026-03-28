"use client";

import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative
        p-2
        border-2
        transition-all duration-200
        ${enabled
          ? "border-[hsl(var(--neon-cyan))] text-[hsl(var(--neon-cyan))] hover:neon-glow-cyan"
          : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:border-[hsl(var(--text-muted))]"
        }
      `}
      title={enabled ? "Mute sounds" : "Enable sounds"}
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
    >
      {/* Pixel corners */}
      <div className={`absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l ${enabled ? "border-[hsl(var(--neon-cyan))]" : "border-[hsl(var(--border))]"}`} />
      <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 border-t border-r ${enabled ? "border-[hsl(var(--neon-cyan))]" : "border-[hsl(var(--border))]"}`} />
      <div className={`absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 border-b border-l ${enabled ? "border-[hsl(var(--neon-cyan))]" : "border-[hsl(var(--border))]"}`} />
      <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r ${enabled ? "border-[hsl(var(--neon-cyan))]" : "border-[hsl(var(--border))]"}`} />

      {enabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </button>
  );
}
