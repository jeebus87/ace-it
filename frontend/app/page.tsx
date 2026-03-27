"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AnswerDisplay } from "@/components/AnswerDisplay";
import { ImageViewer } from "@/components/ImageViewer";
import { QuizModal } from "@/components/QuizModal";
import { DifficultyPrompt } from "@/components/DifficultyPrompt";
import { HistorySidebar, Inquiry, QuizProgress } from "@/components/HistorySidebar";
import { GraduationCap, Sparkles, ImageOff, BarChart3 } from "lucide-react";
import { QuizGenerating } from "@/components/QuizGenerating";
import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { StreakBadge } from "@/components/StreakBadge";
import { useSound } from "@/hooks/useSound";
import { useStreak } from "@/hooks/useStreak";
import { useXP } from "@/hooks/useXP";
import { useStats } from "@/hooks/useStats";
import { LevelBadge } from "@/components/LevelBadge";

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

export default function Home() {
  const [answer, setAnswer] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);
  const [status, setStatus] = useState("");
  const [imageStatus, setImageStatus] = useState("");
  const [quizGenerating, setQuizGenerating] = useState(false);

  // Sound effects
  const { soundEnabled, toggleSound } = useSound();

  // Streak tracking
  const { currentStreak, isStreakAtRisk, todayCompleted, recordQuizCompletion } = useStreak();

  // XP system
  const { totalXP, level, title, progress, xpToNextLevel, leveledUp, awardXP, awardPerfectBonus } = useXP();

  // Stats tracking
  const { recordQuizComplete } = useStats();

  // Difficulty selection state
  const [difficulty, setDifficulty] = useState("intermediate");
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [showDifficultyPrompt, setShowDifficultyPrompt] = useState(false);
  const [pendingQuizData, setPendingQuizData] = useState<{
    question: string;
    answer: string;
  } | null>(null);

  // History state - persisted to localStorage
  const [history, setHistory] = useState<Inquiry[]>([]);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("ace-it-history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((item: Inquiry) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(restored);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("ace-it-history", JSON.stringify(history));
    }
  }, [history]);

  const generateQuiz = async (
    question: string,
    answerText: string,
    selectedDifficulty: string,
    inquiryId?: string
  ) => {
    setQuizGenerating(true);
    try {
      // Warm up the validation endpoint in parallel (fire-and-forget)
      // This eliminates cold start latency when user actually needs validation
      fetch("https://jeebus87--ace-it-backend-validate-answer.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typed: "warmup", correct: "warmup", question: "warmup" }),
      }).catch(() => {}); // Ignore errors, this is just a warm-up

      const quizRes = await fetch("https://jeebus87--ace-it-backend-quiz.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer: answerText,
          difficulty: selectedDifficulty,
        }),
      });
      const quizData = await quizRes.json();
      if (quizData.questions?.length > 0) {
        const newQuiz = { ...quizData, difficulty: selectedDifficulty, quizId: `quiz-${Date.now()}` };
        setQuiz(newQuiz);
        // Update history with quiz
        const updateId = inquiryId || currentInquiryId;
        if (updateId) {
          setHistory((prev) =>
            prev.map((item) =>
              item.id === updateId ? { ...item, quiz: newQuiz } : item
            )
          );
        }
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
    } finally {
      setQuizGenerating(false);
    }
  };

  const handleDifficultySelect = (
    selectedDifficulty: string,
    remember: boolean
  ) => {
    setDifficulty(selectedDifficulty);
    setDontAskAgain(remember);
    setShowDifficultyPrompt(false);

    if (pendingQuizData) {
      generateQuiz(
        pendingQuizData.question,
        pendingQuizData.answer,
        selectedDifficulty,
        currentInquiryId || undefined
      );
      setPendingQuizData(null);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setAnswer("");
    setImage(null);
    setQuiz(null);
    setQuizProgress(null);
    setStatus("Searching with Google and generating answer...");

    // Create inquiry ID upfront
    const inquiryId = `inquiry-${Date.now()}`;
    setCurrentInquiryId(inquiryId);

    try {
      // 1. Generate answer with Google Search grounding (single API call)
      const answerRes = await fetch("https://jeebus87--ace-it-backend-generate.modal.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const answerData = await answerRes.json();

      if (answerData.error) {
        setAnswer(`Error: ${answerData.error}`);
        setLoading(false);
        return;
      }

      const generatedAnswer = answerData.answer || "";
      setAnswer(generatedAnswer);
      setStatus("Generating visual...");
      setImageStatus("loading");

      // 2. Generate image (don't let image errors block the flow)
      let generatedImage: string | null = null;
      try {
        const imageRes = await fetch("https://jeebus87--ace-it-backend-image-gen.modal.run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: query,
            summary: generatedAnswer.substring(0, 500) || "",
          }),
        });
        const imageData = await imageRes.json();

        if (imageData.image && typeof imageData.image === "string" && imageData.image.startsWith("data:")) {
          generatedImage = imageData.image;
          setImage(generatedImage);
          console.log("Image generated successfully");
          setImageStatus("");
        } else if (imageData.reason === "FinishReason.PROHIBITED_CONTENT") {
          console.log("Image blocked due to content policy");
          setImageStatus("content-blocked");
        } else if (imageData.error) {
          console.error("Image generation error:", imageData.error);
          setImageStatus("error");
        } else {
          setImageStatus("");
          console.warn("Image response missing image data:", imageData);
        }
      } catch (imageError) {
        console.error("Image fetch error:", imageError);
        setImageStatus("fetch-error");
        // Continue without image - don't block the rest of the flow
      }

      // 3. Save to history (before quiz generation)
      const newInquiry: Inquiry = {
        id: inquiryId,
        query,
        answer: generatedAnswer,
        image: generatedImage,
        quiz: null,
        quizProgress: null,
        timestamp: new Date(),
      };
      setHistory((prev) => [newInquiry, ...prev]);

      // 4. Handle quiz generation based on difficulty preference
      if (dontAskAgain) {
        // Use saved difficulty preference
        await generateQuiz(query, generatedAnswer, difficulty, inquiryId);
      } else {
        // Show difficulty selection prompt
        setPendingQuizData({ question: query, answer: generatedAnswer });
        setShowDifficultyPrompt(true);
      }

      setStatus("");
    } catch (error) {
      console.error("Search error:", error);
      setAnswer("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // XP award handlers
  const handleCorrectAnswer = (isFirstTry: boolean): number => {
    return awardXP(isFirstTry, currentStreak);
  };

  const handlePerfectQuiz = (questionCount: number): number => {
    return awardPerfectBonus(questionCount, currentStreak);
  };

  const handleRedoQuiz = async () => {
    // Close the quiz modal first
    setShowQuiz(false);
    // Reset quiz progress
    setQuizProgress(null);
    // Clear current quiz to show generating state
    setQuiz(null);

    // Find the current inquiry to get the question and answer
    const currentInquiry = history.find((item) => item.id === currentInquiryId);
    if (currentInquiry) {
      if (dontAskAgain) {
        // Use saved difficulty preference
        await generateQuiz(
          currentInquiry.query,
          currentInquiry.answer,
          difficulty,
          currentInquiryId || undefined
        );
        // Open the quiz modal with new quiz
        setShowQuiz(true);
      } else {
        // Show difficulty selection prompt
        setPendingQuizData({
          question: currentInquiry.query,
          answer: currentInquiry.answer,
        });
        setShowDifficultyPrompt(true);
      }
    }
  };

  const handleQuizProgressChange = (progress: QuizProgress) => {
    setQuizProgress(progress);
    // Save progress to current inquiry in history
    if (currentInquiryId) {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === currentInquiryId ? { ...item, quizProgress: progress } : item
        )
      );
    }
    // Record streak and stats when quiz is completed
    if (progress.completed && quiz) {
      recordQuizCompletion();
      // Calculate first-try correct answers
      const totalAttempts = Object.values(progress.attempts).reduce((a, b) => a + b, 0);
      const correctFirstTry = quiz.questions.length - (totalAttempts - quiz.questions.length);
      const isPerfect = totalAttempts === quiz.questions.length;
      recordQuizComplete(quiz.questions.length, Math.max(0, correctFirstTry), isPerfect);
    }
  };

  const handleSelectInquiry = (inquiry: Inquiry) => {
    setCurrentInquiryId(inquiry.id);
    setAnswer(inquiry.answer);
    setImage(inquiry.image);
    setQuiz(inquiry.quiz);
    setQuizProgress(inquiry.quizProgress);
    setShowQuiz(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setCurrentInquiryId(null);
    localStorage.removeItem("ace-it-history");
  };

  return (
    <main className="min-h-screen py-8 px-4">
      {/* History Sidebar */}
      <HistorySidebar
        inquiries={history}
        currentId={currentInquiryId}
        onSelect={handleSelectInquiry}
        onClear={handleClearHistory}
      />

      {/* Stats Link & Controls */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3 sm:gap-2">
        <Link
          href="/stats"
          className="p-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
          title="View Stats"
        >
          <BarChart3 className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
        </Link>
        <LevelBadge
          level={level}
          title={title}
          totalXP={totalXP}
          progress={progress}
          xpToNextLevel={xpToNextLevel}
          leveledUp={leveledUp}
        />
        <StreakBadge
          currentStreak={currentStreak}
          isAtRisk={isStreakAtRisk}
          todayCompleted={todayCompleted}
        />
        <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
      </div>

      {/* Header */}
      <header className="text-center mt-24 mb-8 sm:mb-12">
        {/* Logo - separate row on mobile */}
        <div className="flex justify-center mb-4 sm:hidden">
          <GraduationCap className="w-12 h-12 text-[hsl(var(--primary))]" />
        </div>
        {/* Title with inline logo on desktop */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <GraduationCap className="hidden sm:block w-10 h-10 text-[hsl(var(--primary))]" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-blue-400 bg-clip-text text-transparent">
            Ace-It
          </h1>
        </div>
        <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] max-w-md mx-auto px-4">
          Your AI-powered study assistant. Search any topic, get expert answers,
          and master with quizzes.
        </p>
      </header>

      {/* Search */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Status */}
      {status && (
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-[hsl(var(--primary))]">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{status}</span>
        </div>
      )}

      {/* Answer */}
      <AnswerDisplay content={answer} loading={loading && !answer} />

      {/* Image */}
      {image && <ImageViewer src={image} />}

      {/* Image Status Message */}
      {imageStatus === "content-blocked" && !image && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
            <ImageOff className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Visual couldn&apos;t be generated for this topic due to content restrictions.
            </p>
          </div>
        </div>
      )}

      {/* Quiz Generating Indicator */}
      <QuizGenerating visible={quizGenerating} />

      {/* Quiz Button */}
      {quiz && quiz.questions.length > 0 && (
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowQuiz(true)}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-500 text-white rounded-xl font-medium text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Start Mastery Quiz ({quiz.questions.length} Questions)
          </button>
        </div>
      )}

      {/* Difficulty Selection Prompt */}
      <DifficultyPrompt
        open={showDifficultyPrompt}
        onSelect={handleDifficultySelect}
      />

      {/* Quiz Modal */}
      <QuizModal
        open={showQuiz}
        onClose={() => setShowQuiz(false)}
        quiz={quiz}
        initialProgress={quizProgress}
        onProgressChange={handleQuizProgressChange}
        onCorrectAnswer={handleCorrectAnswer}
        onPerfectQuiz={handlePerfectQuiz}
        onRedoQuiz={handleRedoQuiz}
      />

      {/* Footer */}
      <footer className="text-center mt-12 text-xs text-[hsl(var(--muted-foreground))]">
        <p>Powered by Gemini AI. Sources are verified for reliability.</p>
      </footer>
    </main>
  );
}
