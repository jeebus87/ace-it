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
      className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
      title={enabled ? "Mute sounds" : "Enable sounds"}
      aria-label={enabled ? "Mute sounds" : "Enable sounds"}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-[hsl(var(--primary))]" />
      ) : (
        <VolumeX className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
      )}
    </button>
  );
}
