"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Trophy } from "lucide-react";

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
}

export function QuizModal({ open, onClose, quiz }: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [disabledChoices, setDisabledChoices] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (open) {
      // Reset state when opening
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setDisabledChoices(new Set());
      setCompleted(false);
      setAttempts({});
    }
  }, [open]);

  if (!open || !quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];

  const handleAnswer = (choice: string) => {
    if (disabledChoices.has(choice) || showFeedback) return;

    setSelectedAnswer(choice);
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + 1,
    }));

    const correct = choice === currentQuestion.correct;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore((s) => s + 1);
    } else {
      setDisabledChoices((prev) => new Set([...prev, choice]));
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setDisabledChoices(new Set());
    } else {
      setCompleted(true);
    }
  };

  const totalAttempts = Object.values(attempts).reduce((a, b) => a + b, 0);
  const isPerfect = totalAttempts === quiz.questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--background))]/95 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--primary))]">
                Mastery Quiz
              </h2>
              {quiz.difficulty && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]">
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </span>
              )}
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
                100% required to complete
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {!completed && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--primary))]">
                Question {currentIndex + 1} of {quiz.questions.length}
              </span>
              <span className="text-[hsl(var(--muted-foreground))]">
                Score: {score}/{quiz.questions.length}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {completed ? (
            <div className="text-center py-8">
              <Trophy
                className={`w-16 h-16 mx-auto mb-4 ${
                  isPerfect ? "text-yellow-400" : "text-[hsl(var(--primary))]"
                }`}
              />
              <h3 className="text-2xl font-bold mb-2">
                {isPerfect ? "Perfect Score!" : "Mastery Achieved!"}
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-6">
                {isPerfect
                  ? "You got every question right on the first try!"
                  : `You've demonstrated complete understanding.`}
              </p>
              <p className="text-lg mb-2">
                Score: {score}/{quiz.questions.length}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Total attempts: {totalAttempts}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Close Quiz
              </button>
            </div>
          ) : (
            <>
              {/* Question */}
              <div className="mb-6">
                <p className="text-base sm:text-lg font-medium leading-relaxed">
                  Q{currentIndex + 1}: {currentQuestion.question}
                </p>
              </div>

              {/* Choices */}
              <div className="space-y-3 mb-6">
                {(["A", "B", "C", "D"] as const).map((choice) => {
                  const isDisabled = disabledChoices.has(choice);
                  const isSelected = selectedAnswer === choice;
                  const isCorrectChoice = choice === currentQuestion.correct;

                  let buttonClass =
                    "w-full p-3 sm:p-4 text-left rounded-xl border-2 transition-all ";

                  if (showFeedback && isSelected) {
                    buttonClass += isCorrect
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-red-500 bg-red-500/10 text-red-400";
                  } else if (showFeedback && isCorrectChoice && !isCorrect) {
                    buttonClass += "border-green-500 bg-green-500/10";
                  } else if (isDisabled) {
                    buttonClass +=
                      "border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/50 opacity-50 cursor-not-allowed";
                  } else {
                    buttonClass +=
                      "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary))] cursor-pointer";
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleAnswer(choice)}
                      disabled={isDisabled || (showFeedback && isCorrect)}
                      className={buttonClass}
                    >
                      <span className="font-bold mr-2">{choice}.</span>
                      {currentQuestion.choices[choice]}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div
                  className={`p-4 rounded-xl mb-6 ${
                    isCorrect
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p
                        className={`font-medium mb-2 ${
                          isCorrect ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isCorrect
                          ? attempts[currentIndex] === 1
                            ? "Nailed it on the first try!"
                            : "Got it!"
                          : "Not quite!"}
                      </p>
                      <p className="text-sm text-[hsl(var(--foreground))]/80">
                        {currentQuestion.explanation}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-[hsl(var(--primary))] mt-2 italic">
                          Give it another shot - you&apos;ve got this!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Next Button */}
              {showFeedback && isCorrect && (
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {currentIndex < quiz.questions.length - 1
                    ? "Next Question"
                    : "Complete Quiz!"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
