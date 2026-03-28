"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Sound settings stored in localStorage
const SOUND_ENABLED_KEY = "ace-it-sound-enabled";

// Sound file paths
const SOUNDS = {
  click: "/sounds/click.wav",
  correct: "/sounds/correct.wav",
  typedCorrect: "/sounds/typed-correct.wav",
  wrong: "/sounds/wrong.wav",
  combo: "/sounds/combo.wav",
  complete: "/sounds/complete.wav",
  vortex: "/sounds/vortex.mp3",
  rocky: "/sounds/rocky.mp3",
  applause: "/sounds/applause.wav",
} as const;

type SoundType = keyof typeof SOUNDS;

// Debounce windows (ms) - prevent same sound type from rapid-firing
const SOUND_DEBOUNCE: Record<SoundType, number> = {
  click: 50,
  correct: 300,
  typedCorrect: 300,
  wrong: 300,
  combo: 500,
  complete: 1000,
  vortex: 800,
  rocky: 0, // No debounce for theme song
  applause: 0, // No debounce for completion sounds
};

// Volume levels for each sound
const SOUND_VOLUMES: Record<SoundType, number> = {
  click: 0.3,
  correct: 0.5,
  typedCorrect: 0.5,
  wrong: 0.4,
  combo: 0.5,
  complete: 0.6,
  vortex: 0.6,
  rocky: 0.5,
  applause: 0.5,
};

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cache audio elements for reuse
  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  // Track last play time per sound type for debouncing
  const lastPlayTimeRef = useRef<Record<SoundType, number>>(
    {} as Record<SoundType, number>
  );

  // Load sound preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === "true");
    }
  }, []);

  // Preload audio files
  useEffect(() => {
    if (typeof window === "undefined") return;

    Object.entries(SOUNDS).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audioCache.current.set(key as SoundType, audio);
    });

    return () => {
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioCache.current.clear();
    };
  }, []);

  // Toggle sound and persist to localStorage
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Play a sound with debouncing
  const playSound = useCallback(
    (soundType: SoundType) => {
      if (!soundEnabled) return;

      // Check debounce
      const now = Date.now();
      const lastPlayed = lastPlayTimeRef.current[soundType] || 0;
      const debounceMs = SOUND_DEBOUNCE[soundType];

      if (now - lastPlayed < debounceMs) return;
      lastPlayTimeRef.current[soundType] = now;

      // Get or create audio element
      let audio = audioCache.current.get(soundType);
      if (!audio) {
        audio = new Audio(SOUNDS[soundType]);
        audioCache.current.set(soundType, audio);
      }

      // Reset and play
      audio.currentTime = 0;
      audio.volume = SOUND_VOLUMES[soundType];
      audio.play().catch(() => {
        // Handle autoplay restrictions silently
      });
    },
    [soundEnabled]
  );

  // Individual sound functions
  const playClick = useCallback(() => playSound("click"), [playSound]);
  const playCorrect = useCallback(() => playSound("correct"), [playSound]);
  const playTypedCorrect = useCallback(() => playSound("typedCorrect"), [playSound]);
  const playWrong = useCallback(() => playSound("wrong"), [playSound]);
  const playCombo = useCallback(() => playSound("combo"), [playSound]);
  const playComplete = useCallback(() => playSound("complete"), [playSound]);
  const playVortex = useCallback(() => playSound("vortex"), [playSound]);
  const playRocky = useCallback(() => playSound("rocky"), [playSound]);
  const playApplause = useCallback(() => playSound("applause"), [playSound]);

  // Stop Rocky theme (for when quiz closes)
  const stopRocky = useCallback(() => {
    const audio = audioCache.current.get("rocky");
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Stop applause (for when quiz closes)
  const stopApplause = useCallback(() => {
    const audio = audioCache.current.get("applause");
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playCorrect,
    playTypedCorrect,
    playWrong,
    playComplete,
    playCombo,
    playClick,
    playVortex,
    playRocky,
    stopRocky,
    playApplause,
    stopApplause,
  };
}
