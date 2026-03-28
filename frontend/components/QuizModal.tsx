"use client";

import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, XCircle, Trophy, Crown, Flame, Zap, Star, Target } from "lucide-react";
import confetti from "canvas-confetti";
import { QuizProgress } from "./HistorySidebar";
import { useSound } from "@/hooks/useSound";
import { isFuzzyMatch } from "@/lib/fuzzy-match";

interface Question {
  id: number;
  question: string;
  choices: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface Quiz {
  questions: Question[];
  topic: string;
  total: number;
  difficulty?: string;
  quizId?: string;
}

interface QuizModalProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  initialProgress?: QuizProgress | null;
  onProgressChange?: (progress: QuizProgress) => void;
  onCorrectAnswer?: (isFirstTry: boolean) => number;
  onPerfectQuiz?: (questionCount: number) => number;
  onRedoQuiz?: () => void;
}

const difficultyColors: Record<string, { border: string; text: string; glow: string }> = {
  beginner: { border: "border-[hsl(var(--neon-green))]", text: "text-[hsl(var(--neon-green))]", glow: "neon-glow-green" },
  intermediate: { border: "border-[hsl(var(--neon-yellow))]", text: "text-[hsl(var(--neon-yellow))]", glow: "neon-glow-yellow" },
  advanced: { border: "border-[hsl(var(--neon-red))]", text: "text-[hsl(var(--neon-red))]", glow: "neon-glow-red" },
};

export function QuizModal({ open, onClose, quiz, initialProgress, onProgressChange, onCorrectAnswer, onPerfectQuiz, onRedoQuiz }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [disabledChoices, setDisabledChoices] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [allDisabledChoices, setAllDisabledChoices] = useState<Record<number, string[]>>({});
  const [typedAnswer, setTypedAnswer] = useState("");
  const [typedCorrect, setTypedCorrect] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboText, setComboText] = useState("");
  const [xpGained, setXPGained] = useState<number | null>(null);
  const [totalXPGained, setTotalXPGained] = useState(0);
  const [validating, setValidating] = useState(false);
  const [screenFlash, setScreenFlash] = useState<"correct" | "wrong" | null>(null);

  const prevQuizIdRef = useRef<string | null>(null);
  const completionFiredRef = useRef(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { playCorrect, playWrong, playComplete, playCombo } = useSound();

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    let frameId: number | null = null;

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff6600"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff6600"] });
      if (Date.now() < end) {
        frameId = requestAnimationFrame(frame);
      }
    };
    frame();

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  };

  const triggerScreenFlash = (type: "correct" | "wrong") => {
    setScreenFlash(type);
    setTimeout(() => setScreenFlash(null), 300);
  };

  const triggerCombo = (count: number) => {
    if (count >= 3) {
      setComboText(`${count}x COMBO!`);
      setShowCombo(true);
      playCombo();
      setTimeout(() => setShowCombo(false), 1500);
    }
  };

  useEffect(() => {
    const quizKey = quiz?.quizId || quiz?.topic;
    const isNewQuiz = quizKey !== prevQuizIdRef.current;
    if (quiz && isNewQuiz) {
      prevQuizIdRef.current = quizKey || null;
      completionFiredRef.current = false;
      if (initialProgress) {
        setCurrentIndex(initialProgress.currentIndex);
        setScore(initialProgress.score);
        setAttempts(initialProgress.attempts);
        setCompleted(initialProgress.completed);
        setAllDisabledChoices(initialProgress.disabledChoices);
        const currentDisabled = initialProgress.disabledChoices[initialProgress.currentIndex] || [];
        setDisabledChoices(new Set(currentDisabled));
      } else {
        setCurrentIndex(0); setScore(0); setAttempts({}); setCompleted(false); setAllDisabledChoices({}); setDisabledChoices(new Set());
      }
      setSelectedAnswer(null); setShowFeedback(false); setTypedAnswer(""); setTypedCorrect(false); setCombo(0);
    }
  }, [quiz?.quizId, quiz?.topic, initialProgress]);

  useEffect(() => {
    if (onProgressChange && quiz) {
      const updatedDisabled = { ...allDisabledChoices };
      updatedDisabled[currentIndex] = Array.from(disabledChoices);
      onProgressChange({ currentIndex, score, attempts, completed, disabledChoices: updatedDisabled });
    }
  }, [currentIndex, score, attempts, completed, disabledChoices]);

  useEffect(() => {
    let confettiCleanup: (() => void) | null = null;

    if (completed && quiz && !completionFiredRef.current) {
      completionFiredRef.current = true;
      confettiCleanup = fireConfetti();
      playComplete();
      const isPerfectScore = score === quiz.questions.length && quiz.questions.every((_, i) => attempts[i] === 1);
      if (isPerfectScore && onPerfectQuiz) {
        const bonus = onPerfectQuiz(quiz.questions.length);
        setXPGained(bonus);
        setTimeout(() => setXPGained(null), 2500);
      }
    }

    return () => {
      if (confettiCleanup) confettiCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, quiz]);

  if (!open || !quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];
  const correctAnswerText = currentQuestion.choices[currentQuestion.correct as keyof typeof currentQuestion.choices];
  const diffStyle = difficultyColors[quiz.difficulty || "intermediate"] || difficultyColors.intermediate;

  const handleAnswer = (choice: string) => {
    if (disabledChoices.has(choice) || showFeedback) return;
    setSelectedAnswer(choice);
    setAttempts((prev) => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + 1 }));
    const correct = choice === currentQuestion.correct;
    setIsCorrect(correct);
    setShowFeedback(true);
    triggerScreenFlash(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      playCorrect();
      const isFirstTry = !attempts[currentIndex];
      if (isFirstTry) { const newCombo = combo + 1; setCombo(newCombo); triggerCombo(newCombo); } else { setCombo(0); }
      if (onCorrectAnswer) {
        const xp = onCorrectAnswer(isFirstTry);
        setXPGained(xp);
        setTotalXPGained((prev) => prev + xp);
        setTimeout(() => setXPGained(null), 1500);
      }
    } else {
      playWrong();
      setCombo(0);
      const newDisabled = new Set([...disabledChoices, choice]);
      setDisabledChoices(newDisabled);
      setAllDisabledChoices((prev) => ({ ...prev, [currentIndex]: Array.from(newDisabled) }));
    }
  };

  const handleTypedAnswerSubmit = async () => {
    if (!typedAnswer.trim()) return;

    setValidating(true);
    try {
      const response = await fetch("https://jeebus87--ace-it-backend-validate-answer.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typed: typedAnswer,
          correct: correctAnswerText,
          question: currentQuestion.question,
        }),
      });

      const data = await response.json();

      if (data.is_correct) {
        setTypedCorrect(true);
        playCorrect();
        triggerScreenFlash("correct");
      } else {
        if (isFuzzyMatch(typedAnswer, correctAnswerText)) {
          setTypedCorrect(true);
          playCorrect();
          triggerScreenFlash("correct");
        } else {
          playWrong();
          triggerScreenFlash("wrong");
        }
      }
    } catch {
      if (isFuzzyMatch(typedAnswer, correctAnswerText)) {
        setTypedCorrect(true);
        playCorrect();
        triggerScreenFlash("correct");
      } else {
        playWrong();
        triggerScreenFlash("wrong");
      }
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex); setSelectedAnswer(null); setShowFeedback(false);
      const nextDisabled = allDisabledChoices[nextIndex] || [];
      setDisabledChoices(new Set(nextDisabled)); setTypedAnswer(""); setTypedCorrect(false);
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else { setCompleted(true); }
  };

  const totalAttempts = Object.values(attempts).reduce((a, b) => a + b, 0);
  const isPerfect = score === quiz.questions.length && quiz.questions.every((_, i) => attempts[i] === 1);
  const progressPercent = ((currentIndex + 1) / quiz.questions.length) * 100;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div className={`
      fixed inset-0 z-50
      flex items-center justify-center
      sm:p-4
      bg-[hsl(var(--bg-deep))]
      animate-crt-boot
      overflow-hidden
      ${screenFlash === "correct" ? "animate-flash-green" : ""}
      ${screenFlash === "wrong" ? "animate-flash-red" : ""}
    `}>
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(0,255,255,0.02)_2px,rgba(0,255,255,0.02)_4px)] z-[60]" />

      {/* Combo popup */}
      {showCombo && (
        <div className="fixed top-20 sm:top-1/4 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
          <div className={`
            flex items-center gap-3 px-6 py-3
            bg-[hsl(var(--bg-surface))]
            border-4 border-[hsl(var(--neon-orange))]
            neon-glow-yellow
            animate-neon-pulse
          `}>
            <Flame className="w-8 h-8 text-[hsl(var(--neon-orange))] animate-fire" />
            <span className="font-display text-xl text-[hsl(var(--neon-orange))] neon-text">{comboText}</span>
            <Flame className="w-8 h-8 text-[hsl(var(--neon-orange))] animate-fire" />
          </div>
        </div>
      )}

      {/* XP popup */}
      {xpGained && (
        <div className="fixed top-32 sm:top-1/3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none animate-float-up">
          <div className={`
            flex items-center gap-2 px-5 py-2
            bg-[hsl(var(--bg-surface))]
            border-2 border-[hsl(var(--neon-green))]
            neon-glow-green
          `}>
            <Zap className="w-5 h-5 text-[hsl(var(--neon-green))]" />
            <span className="font-display text-lg text-[hsl(var(--neon-green))]">+{xpGained} XP</span>
          </div>
        </div>
      )}

      {/* Main modal - Arcade cabinet style - fullscreen on mobile */}
      <div
        ref={modalContentRef}
        className={`
          relative
          w-full h-full sm:h-auto sm:max-h-[90vh]
          sm:max-w-2xl
          bg-[hsl(var(--bg-surface))]
          border-0 sm:border-4 ${diffStyle.border}
          ${diffStyle.glow}
          overflow-y-auto overscroll-contain
          pb-20 sm:pb-0
        `}
      >
        {/* Pixel corners */}
        <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 ${diffStyle.border}`} />
        <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 ${diffStyle.border}`} />
        <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 ${diffStyle.border}`} />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 ${diffStyle.border}`} />

        {/* Header - Arcade style */}
        <div className="sticky top-0 z-10 bg-[hsl(var(--bg-deep))] border-b-2 border-[hsl(var(--border))] p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className={`w-6 h-6 ${diffStyle.text}`} />
              <div>
                <h2 className="font-display text-sm sm:text-base text-[hsl(var(--neon-cyan))] neon-text">
                  MASTERY QUIZ
                </h2>
                {quiz.difficulty && (
                  <span className={`font-accent text-xs ${diffStyle.text} tracking-wider`}>
                    {quiz.difficulty.toUpperCase()} MODE
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`
                p-3 border-2 border-[hsl(var(--border))]
                bg-[hsl(var(--bg-surface))]
                hover:border-[hsl(var(--neon-red))] hover:text-[hsl(var(--neon-red))]
                transition-all duration-200
              `}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!completed && (
            <>
              {/* Stage indicator - Arcade style */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xs text-[hsl(var(--neon-magenta))]">
                    STAGE {currentIndex + 1}/{quiz.questions.length}
                  </span>
                  {combo >= 3 && (
                    <span className="flex items-center gap-1 px-2 py-1 border border-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/10">
                      <Flame className="w-3 h-3 text-[hsl(var(--neon-orange))]" />
                      <span className="font-display text-[10px] text-[hsl(var(--neon-orange))]">{combo}x</span>
                    </span>
                  )}
                </div>
                <span className="font-display text-xs text-[hsl(var(--neon-cyan))]">
                  SCORE: {score}/{quiz.questions.length}
                </span>
              </div>

              {/* Progress bar - Segmented arcade style */}
              <div className="relative h-4 bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--border))]">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Segment lines */}
                <div className="absolute inset-0 flex">
                  {[...Array(quiz.questions.length)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r-2 border-[hsl(var(--bg-deep))] last:border-r-0"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content area */}
        <div className="p-4 sm:p-6">
          {completed ? (
            /* Completion screen - Victory arcade style */
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <Trophy className={`w-20 h-20 ${isPerfect ? "text-[hsl(var(--neon-yellow))] animate-neon-pulse" : "text-[hsl(var(--neon-cyan))]"}`} />
                {isPerfect && (
                  <Crown className="w-10 h-10 text-[hsl(var(--neon-yellow))] absolute -top-4 -right-4 animate-float" />
                )}
              </div>

              <h3 className={`font-display text-lg sm:text-xl mb-2 ${isPerfect ? "text-[hsl(var(--neon-yellow))] neon-text" : "text-[hsl(var(--neon-cyan))] neon-text"}`}>
                {isPerfect ? "PERFECT CLEAR!" : "STAGE COMPLETE!"}
              </h3>

              {isPerfect && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-[hsl(var(--neon-yellow))] animate-neon-pulse" />
                  <span className="font-accent text-xs text-[hsl(var(--neon-yellow))] tracking-wider">FIRST TRY CHAMPION</span>
                  <Star className="w-5 h-5 text-[hsl(var(--neon-yellow))] animate-neon-pulse" />
                </div>
              )}

              <p className="font-accent text-sm text-[hsl(var(--text-muted))] mb-6 tracking-wider">
                {isPerfect ? "EVERY QUESTION - FIRST TRY!" : "MASTERY ACHIEVED"}
              </p>

              {/* Score display - Arcade style */}
              <div className="inline-block bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--border))] p-4 mb-6">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="font-display text-2xl text-[hsl(var(--neon-cyan))]">{score}/{quiz.questions.length}</div>
                    <div className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">SCORE</div>
                  </div>
                  <div className="w-px h-10 bg-[hsl(var(--border))]" />
                  <div className="text-center">
                    <div className="font-display text-2xl text-[hsl(var(--neon-magenta))]">{totalAttempts}</div>
                    <div className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">ATTEMPTS</div>
                  </div>
                  {totalXPGained > 0 && (
                    <>
                      <div className="w-px h-10 bg-[hsl(var(--border))]" />
                      <div className="text-center">
                        <div className="font-display text-2xl text-[hsl(var(--neon-green))]">+{totalXPGained}</div>
                        <div className="font-accent text-[10px] text-[hsl(var(--text-muted))] tracking-wider">XP</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons - Arcade style */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {onRedoQuiz && (
                  <button
                    onClick={onRedoQuiz}
                    className={`
                      px-6 py-4
                      font-display text-sm
                      border-2 border-[hsl(var(--neon-magenta))]
                      text-[hsl(var(--neon-magenta))]
                      bg-[hsl(var(--bg-surface))]
                      hover:bg-[hsl(var(--neon-magenta))]/10
                      transition-all duration-200
                    `}
                  >
                    NEW QUIZ
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`
                    px-6 py-4
                    font-display text-sm
                    border-2 border-[hsl(var(--neon-cyan))]
                    text-[hsl(var(--bg-deep))]
                    bg-[hsl(var(--neon-cyan))]
                    hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)]
                    transition-all duration-200
                  `}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          ) : (
            /* Question area */
            <>
              {/* Question text */}
              <div className="mb-6 p-4 bg-[hsl(var(--bg-deep))] border-2 border-[hsl(var(--border))] overflow-hidden">
                <div className="flex items-start gap-3">
                  <span className="font-display text-sm text-[hsl(var(--neon-cyan))] shrink-0">Q{currentIndex + 1}:</span>
                  <p className="flex-1 min-w-0 break-words font-body text-base sm:text-lg text-[hsl(var(--text-primary))] leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* Answer choices - Large arcade buttons */}
              <div className="space-y-3 mb-6">
                {(["A", "B", "C", "D"] as const).map((choice) => {
                  const isDisabled = disabledChoices.has(choice);
                  const isSelected = selectedAnswer === choice;
                  const isCorrectChoice = choice === currentQuestion.correct;

                  let buttonClass = `
                    relative w-full p-4 text-left
                    border-2 transition-all duration-200
                    flex items-start gap-4
                    min-h-[64px]
                    select-none
                    [-webkit-tap-highlight-color:transparent]
                    active:scale-[0.98] active:opacity-100
                  `;

                  if (showFeedback && isSelected) {
                    buttonClass += isCorrect
                      ? " border-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/10 neon-glow-green"
                      : " border-[hsl(var(--neon-red))] bg-[hsl(var(--neon-red))]/10 animate-shake";
                  } else if (showFeedback && isCorrectChoice && !isCorrect) {
                    buttonClass += " border-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/10";
                  } else if (isDisabled) {
                    buttonClass += " border-[hsl(var(--border))] bg-[hsl(var(--bg-deep))]/50 opacity-40 cursor-not-allowed";
                  } else {
                    buttonClass += " border-[hsl(var(--border))] bg-[hsl(var(--bg-surface))] hover:border-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--bg-elevated))] cursor-pointer";
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={isDisabled || showFeedback}
                      className={buttonClass}
                    >
                      {/* Letter key - Arcade style */}
                      <div className={`
                        shrink-0 w-10 h-10 flex items-center justify-center
                        border-2 font-display text-sm
                        ${showFeedback && isSelected
                          ? isCorrect
                            ? "border-[hsl(var(--neon-green))] text-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/20"
                            : "border-[hsl(var(--neon-red))] text-[hsl(var(--neon-red))] bg-[hsl(var(--neon-red))]/20"
                          : showFeedback && isCorrectChoice && !isCorrect
                            ? "border-[hsl(var(--neon-green))] text-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/20"
                            : isDisabled
                              ? "border-[hsl(var(--border))] text-[hsl(var(--text-dim))]"
                              : "border-[hsl(var(--neon-cyan))] text-[hsl(var(--neon-cyan))]"
                        }
                      `}>
                        {choice}
                      </div>

                      {/* Answer text */}
                      <span className={`
                        flex-1 min-w-0 break-words
                        font-body text-sm sm:text-base pt-2 pr-8
                        ${showFeedback && isSelected
                          ? isCorrect ? "text-[hsl(var(--neon-green))]" : "text-[hsl(var(--neon-red))]"
                          : showFeedback && isCorrectChoice && !isCorrect
                            ? "text-[hsl(var(--neon-green))]"
                            : isDisabled
                              ? "text-[hsl(var(--text-dim))]"
                              : "text-[hsl(var(--text-primary))]"
                        }
                      `}>
                        {currentQuestion.choices[choice]}
                      </span>

                      {/* Feedback icons */}
                      {showFeedback && isSelected && (
                        isCorrect
                          ? <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[hsl(var(--neon-green))]" />
                          : <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[hsl(var(--neon-red))]" />
                      )}
                      {showFeedback && isCorrectChoice && !isCorrect && !isSelected && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[hsl(var(--neon-green))]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback section */}
              {showFeedback && (
                <div className={`
                  p-4 mb-6
                  border-2
                  ${isCorrect || typedCorrect
                    ? "border-[hsl(var(--neon-green))] bg-[hsl(var(--neon-green))]/5"
                    : "border-[hsl(var(--neon-red))] bg-[hsl(var(--neon-red))]/5"
                  }
                `}>
                  <div className="flex items-start gap-3">
                    {isCorrect || typedCorrect
                      ? <CheckCircle className="w-5 h-5 text-[hsl(var(--neon-green))] shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-[hsl(var(--neon-red))] shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      <p className={`font-display text-xs mb-2 ${isCorrect || typedCorrect ? "text-[hsl(var(--neon-green))]" : "text-[hsl(var(--neon-red))]"}`}>
                        {isCorrect
                          ? (attempts[currentIndex] === 1 ? "PERFECT!" : "CORRECT!")
                          : typedCorrect
                            ? "CORRECT!"
                            : "WRONG!"
                        }
                      </p>
                      <p className="font-body text-sm text-[hsl(var(--text-primary))]">
                        {currentQuestion.explanation}
                      </p>

                      {/* Type to continue for wrong answers */}
                      {!isCorrect && !typedCorrect && (
                        <div className="mt-4 pt-4 border-t border-[hsl(var(--neon-red))]/30 overflow-hidden">
                          <p className="font-accent text-xs text-[hsl(var(--text-muted))] mb-3 tracking-wider">
                            TYPE THE CORRECT ANSWER TO CONTINUE:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={typedAnswer}
                              onChange={(e) => setTypedAnswer(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && !validating) handleTypedAnswerSubmit(); }}
                              placeholder="Type here..."
                              disabled={validating}
                              className={`
                                flex-1 min-w-0 px-4 py-3
                                font-body text-sm
                                bg-[hsl(var(--bg-deep))]
                                border-2 border-[hsl(var(--border))]
                                text-[hsl(var(--text-primary))]
                                placeholder-[hsl(var(--text-dim))]
                                focus:outline-none focus:border-[hsl(var(--neon-cyan))]
                                disabled:opacity-50
                              `}
                            />
                            <button
                              onClick={handleTypedAnswerSubmit}
                              disabled={validating}
                              className={`
                                shrink-0 px-5 py-3
                                font-display text-xs
                                border-2 border-[hsl(var(--neon-cyan))]
                                text-[hsl(var(--neon-cyan))]
                                bg-[hsl(var(--bg-surface))]
                                hover:bg-[hsl(var(--neon-cyan))]/10
                                disabled:opacity-50
                                transition-all duration-200
                              `}
                            >
                              {validating ? "..." : "SUBMIT"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Next button */}
              {showFeedback && (isCorrect || typedCorrect) && (
                <button
                  onClick={handleNext}
                  className={`
                    w-full py-4
                    font-display text-sm
                    border-2 border-[hsl(var(--neon-cyan))]
                    text-[hsl(var(--bg-deep))]
                    bg-[hsl(var(--neon-cyan))]
                    hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)]
                    transition-all duration-200
                  `}
                >
                  {currentIndex < quiz.questions.length - 1 ? "NEXT STAGE" : "COMPLETE QUIZ"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
