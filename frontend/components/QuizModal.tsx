"use client";

import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, XCircle, Trophy, Crown, Flame } from "lucide-react";
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
}

interface QuizModalProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  initialProgress?: QuizProgress | null;
  onProgressChange?: (progress: QuizProgress) => void;
  onCorrectAnswer?: (isFirstTry: boolean) => number;
  onPerfectQuiz?: (questionCount: number) => number;
}

export function QuizModal({ open, onClose, quiz, initialProgress, onProgressChange, onCorrectAnswer, onPerfectQuiz }: QuizModalProps) {
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

  const prevQuizTopicRef = useRef<string | null>(null);
  const completionFiredRef = useRef(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { playCorrect, playWrong, playComplete, playCombo } = useSound();

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    let frameId: number | null = null;

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors: ["#6366f1", "#8b5cf6", "#a855f7", "#fbbf24", "#34d399"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors: ["#6366f1", "#8b5cf6", "#a855f7", "#fbbf24", "#34d399"] });
      if (Date.now() < end) {
        frameId = requestAnimationFrame(frame);
      }
    };
    frame();

    // Return cleanup function
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  };

  const triggerCombo = (count: number) => {
    if (count >= 3) {
      setComboText(`${count}x Combo!`);
      setShowCombo(true);
      playCombo();
      setTimeout(() => setShowCombo(false), 1500);
    }
  };

  useEffect(() => {
    const isNewQuiz = quiz?.topic !== prevQuizTopicRef.current;
    if (quiz && isNewQuiz) {
      prevQuizTopicRef.current = quiz.topic;
      completionFiredRef.current = false; // Reset completion flag for new quiz
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
  }, [quiz?.topic, initialProgress]);

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
      // Award perfect quiz bonus - every question must be answered correctly on first try
      const isPerfectScore = quiz.questions.every((_, i) => attempts[i] === 1);
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

  const handleAnswer = (choice: string) => {
    if (disabledChoices.has(choice) || showFeedback) return;
    setSelectedAnswer(choice);
    setAttempts((prev) => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + 1 }));
    const correct = choice === currentQuestion.correct;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) {
      setScore((s) => s + 1);
      playCorrect();
      const isFirstTry = !attempts[currentIndex];
      if (isFirstTry) { const newCombo = combo + 1; setCombo(newCombo); triggerCombo(newCombo); } else { setCombo(0); }
      // Award XP
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

  const handleTypedAnswerSubmit = () => {
    if (isFuzzyMatch(typedAnswer, correctAnswerText)) {
      setTypedCorrect(true);
      playCorrect();
    } else {
      playWrong();
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex); setSelectedAnswer(null); setShowFeedback(false);
      const nextDisabled = allDisabledChoices[nextIndex] || [];
      setDisabledChoices(new Set(nextDisabled)); setTypedAnswer(""); setTypedCorrect(false);
      // Scroll modal content to top for next question
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else { setCompleted(true); }
  };

  const totalAttempts = Object.values(attempts).reduce((a, b) => a + b, 0);
  // Perfect score = every question answered correctly on first try
  const isPerfect = quiz.questions.every((_, i) => attempts[i] === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--background))]/95 p-4 overflow-y-auto">
      {showCombo && (
        <div className="fixed top-20 sm:top-1/3 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[60] pointer-events-none">
          <div className="animate-bounce flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span className="text-2xl font-bold text-white">{comboText}</span>
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>
        </div>
      )}
      {xpGained && (
        <div className="fixed top-32 sm:top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 z-[60] pointer-events-none animate-float-up">
          <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
            <span className="text-xl font-bold text-white">+{xpGained} XP</span>
          </div>
        </div>
      )}
      <div ref={modalContentRef} className="w-full max-w-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto pb-16 sm:pb-0">
        <div className="sticky top-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[hsl(var(--primary))]">Mastery Quiz</h2>
                {quiz.difficulty && (<span className="px-2 py-1 text-xs rounded-full bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]">{quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}</span>)}
              </div>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">100% required to complete</p>
            </div>
            <button onClick={onClose} className="p-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {!completed && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-[hsl(var(--primary))]">Question {currentIndex + 1} of {quiz.questions.length}</span>
                {combo >= 3 && (<span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium"><Flame className="w-3 h-3" />{combo}x</span>)}
              </div>
              <span className="text-[hsl(var(--muted-foreground))]">Score: {score}/{quiz.questions.length}</span>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6">
          {completed ? (
            <div className="text-center py-8">
              <div className="relative inline-block">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${isPerfect ? "text-yellow-400" : "text-[hsl(var(--primary))]"}`} />
                {isPerfect && (<Crown className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />)}
              </div>
              <h3 className="text-2xl font-bold mb-2">{isPerfect ? "Perfect Score!" : "Mastery Achieved!"}</h3>
              {isPerfect && (<div className="flex items-center justify-center gap-2 mb-4"><Crown className="w-5 h-5 text-yellow-400" /><span className="text-yellow-400 font-medium">First Try Champion!</span><Crown className="w-5 h-5 text-yellow-400" /></div>)}
              <p className="text-[hsl(var(--muted-foreground))] mb-6">{isPerfect ? "You got every question right on the first try!" : "You have demonstrated complete understanding."}</p>
              <p className="text-lg mb-2">Score: {score}/{quiz.questions.length}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Total attempts: {totalAttempts}</p>
              {totalXPGained > 0 && (
                <p className="text-sm text-green-400 font-medium mb-6">+{totalXPGained} XP earned!</p>
              )}
              <button onClick={onClose} className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">Close Quiz</button>
            </div>
          ) : (
            <>
              <div className="mb-6"><p className="text-base sm:text-lg font-medium leading-relaxed">Q{currentIndex + 1}: {currentQuestion.question}</p></div>
              <div className="space-y-3 mb-6">
                {(["A", "B", "C", "D"] as const).map((choice) => {
                  const isDisabled = disabledChoices.has(choice);
                  const isSelected = selectedAnswer === choice;
                  const isCorrectChoice = choice === currentQuestion.correct;
                  let buttonClass = "w-full p-4 text-left rounded-xl border-2 transition-all ";
                  if (showFeedback && isSelected) { buttonClass += isCorrect ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400"; }
                  else if (showFeedback && isCorrectChoice && !isCorrect) { buttonClass += "border-green-500 bg-green-500/10"; }
                  else if (isDisabled) { buttonClass += "border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50 opacity-50 cursor-not-allowed"; }
                  else { buttonClass += "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary))] cursor-pointer"; }
                  return (<button key={choice} onClick={() => handleAnswer(choice)} disabled={isDisabled || showFeedback} className={buttonClass}><span className="font-bold mr-2">{choice}.</span>{currentQuestion.choices[choice]}</button>);
                })}
              </div>
              {showFeedback && (
                <div className={`p-4 rounded-xl mb-6 ${isCorrect || typedCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect || typedCorrect ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className={`font-medium mb-2 ${isCorrect || typedCorrect ? "text-green-400" : "text-red-400"}`}>
                        {isCorrect ? (attempts[currentIndex] === 1 ? "Nailed it on the first try!" : "Got it!") : typedCorrect ? "Correct! You got it!" : "Not quite!"}
                      </p>
                      <p className="text-sm text-[hsl(var(--foreground))]/80">{currentQuestion.explanation}</p>
                      {!isCorrect && !typedCorrect && (
                        <div className="mt-4 pt-4 border-t border-red-500/30">
                          <p className="text-sm text-[hsl(var(--foreground))]/80 mb-2">Type the correct answer to continue:</p>
                          <div className="flex gap-2">
                            <input type="text" value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleTypedAnswerSubmit(); }} placeholder="Type the correct answer..." className="flex-1 px-4 py-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                            <button onClick={handleTypedAnswerSubmit} className="px-5 py-3 bg-[hsl(var(--primary))] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Submit</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {showFeedback && (isCorrect || typedCorrect) && (
                <button onClick={handleNext} className="w-full py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
                  {currentIndex < quiz.questions.length - 1 ? "Next Question" : "Complete Quiz!"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
