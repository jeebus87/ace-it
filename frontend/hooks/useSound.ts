"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Sound settings stored in localStorage
const SOUND_ENABLED_KEY = "ace-it-sound-enabled";

// Debounce windows (ms) - prevent same sound type from rapid-firing
type SoundType = "click" | "correct" | "wrong" | "combo" | "complete";
const SOUND_DEBOUNCE: Record<SoundType, number> = {
  click: 50,
  correct: 300,
  wrong: 300,
  combo: 500,
  complete: 1000,
};

// Maximum concurrent oscillators to prevent audio system overload
const MAX_OSCILLATORS = 6;

interface AudioNode {
  oscillator: OscillatorNode;
  gain: GainNode;
}

export function useSound() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Track active audio nodes for cleanup
  const activeNodesRef = useRef<AudioNode[]>([]);
  // Track last play time per sound type for debouncing
  const lastPlayTimeRef = useRef<Record<SoundType, number>>({} as Record<SoundType, number>);

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

      // Limit concurrent oscillators to prevent audio system overload
      while (activeNodesRef.current.length >= MAX_OSCILLATORS) {
        const oldest = activeNodesRef.current.shift();
        if (oldest) {
          try {
            oldest.oscillator.stop();
            oldest.oscillator.disconnect();
            oldest.gain.disconnect();
          } catch {
            // Already stopped
          }
        }
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

      // Track node for cleanup
      const nodeEntry = { oscillator, gain: gainNode };
      activeNodesRef.current.push(nodeEntry);

      // Cleanup when oscillator finishes
      oscillator.onended = () => {
        const index = activeNodesRef.current.indexOf(nodeEntry);
        if (index > -1) activeNodesRef.current.splice(index, 1);
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch {
          // Already disconnected
        }
      };

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [soundEnabled, initAudio]
  );

  // Stop all active sounds (for cleanup and before completion fanfare)
  const stopAllSounds = useCallback(() => {
    activeNodesRef.current.forEach(({ oscillator, gain }) => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // Already stopped
      }
    });
    activeNodesRef.current = [];
  }, []);

  // Debounce wrapper - prevents same sound type from rapid-firing
  const withDebounce = useCallback(
    (soundType: SoundType, playFn: () => void) => {
      const now = Date.now();
      const lastPlayed = lastPlayTimeRef.current[soundType] || 0;
      const debounceMs = SOUND_DEBOUNCE[soundType];

      if (now - lastPlayed < debounceMs) return;

      lastPlayTimeRef.current[soundType] = now;
      playFn();
    },
    []
  );

  // Correct answer sound - happy ascending chime
  const playCorrect = useCallback(() => {
    withDebounce("correct", () => {
      playTone(523.25, 0.1, "sine", 0.2); // C5
      setTimeout(() => playTone(659.25, 0.1, "sine", 0.2), 100); // E5
      setTimeout(() => playTone(783.99, 0.15, "sine", 0.25), 200); // G5
    });
  }, [playTone, withDebounce]);

  // Wrong answer sound - gentle descending buzz
  const playWrong = useCallback(() => {
    withDebounce("wrong", () => {
      playTone(311.13, 0.15, "triangle", 0.2); // Eb4
      setTimeout(() => playTone(261.63, 0.2, "triangle", 0.15), 100); // C4
    });
  }, [playTone, withDebounce]);

  // Quiz completion fanfare
  const playComplete = useCallback(() => {
    withDebounce("complete", () => {
      // Clear any pending sounds before playing completion fanfare
      stopAllSounds();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, "sine", 0.25), i * 150);
      });
    });
  }, [playTone, withDebounce, stopAllSounds]);

  // Combo sound - quick ascending blip
  const playCombo = useCallback(() => {
    withDebounce("combo", () => {
      playTone(880, 0.08, "square", 0.15); // A5
      setTimeout(() => playTone(1108.73, 0.1, "square", 0.2), 80); // C#6
    });
  }, [playTone, withDebounce]);

  // Click sound - subtle pop
  const playClick = useCallback(() => {
    withDebounce("click", () => {
      playTone(1000, 0.05, "sine", 0.1);
    });
  }, [playTone, withDebounce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all active sounds
      activeNodesRef.current.forEach(({ oscillator, gain }) => {
        try {
          oscillator.stop();
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          // Already stopped
        }
      });
      activeNodesRef.current = [];
    };
  }, []);

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
