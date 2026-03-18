"use client";

import { useCallback, useEffect, useState } from "react";

// Sound settings stored in localStorage
const SOUND_ENABLED_KEY = "ace-it-sound-enabled";

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Load sound preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === "true");
    }
  }, []);

  // Initialize AudioContext on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  }, [audioContext]);

  // Toggle sound and persist to localStorage
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Play a tone with Web Audio API
  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine", volume: number = 0.3) => {
      if (!soundEnabled) return;

      const ctx = initAudio();
      if (!ctx) return;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade out to avoid clicks
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [soundEnabled, initAudio]
  );

  // Correct answer sound - happy ascending chime
  const playCorrect = useCallback(() => {
    playTone(523.25, 0.1, "sine", 0.2); // C5
    setTimeout(() => playTone(659.25, 0.1, "sine", 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.15, "sine", 0.25), 200); // G5
  }, [playTone]);

  // Wrong answer sound - gentle descending buzz
  const playWrong = useCallback(() => {
    playTone(311.13, 0.15, "triangle", 0.2); // Eb4
    setTimeout(() => playTone(261.63, 0.2, "triangle", 0.15), 100); // C4
  }, [playTone]);

  // Quiz completion fanfare
  const playComplete = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, "sine", 0.25), i * 150);
    });
  }, [playTone]);

  // Combo sound - quick ascending blip
  const playCombo = useCallback(() => {
    playTone(880, 0.08, "square", 0.15); // A5
    setTimeout(() => playTone(1108.73, 0.1, "square", 0.2), 80); // C#6
  }, [playTone]);

  // Click sound - subtle pop
  const playClick = useCallback(() => {
    playTone(1000, 0.05, "sine", 0.1);
  }, [playTone]);

  return {
    soundEnabled,
    toggleSound,
    playCorrect,
    playWrong,
    playComplete,
    playCombo,
    playClick,
  };
}
