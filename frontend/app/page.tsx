"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { AnswerDisplay } from "@/components/AnswerDisplay";
import { ImageViewer } from "@/components/ImageViewer";
import { QuizModal } from "@/components/QuizModal";
import { DifficultyPrompt } from "@/components/DifficultyPrompt";
import { HistorySidebar, Inquiry, QuizProgress } from "@/components/HistorySidebar";
import { Sparkles, ImageOff, BarChart3, Zap, Target } from "lucide-react";
import { QuizGenerating } from "@/components/QuizGenerating";
import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { StreakBadge } from "@/components/StreakBadge";
import { useSound } from "@/hooks/useSound";
import { useStreak } from "@/hooks/useStreak";
import { useXP } from "@/hooks/useXP";
import { useStats } from "@/hooks/useStats";
import { LevelBadge } from "@/components/LevelBadge";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

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
  const { soundEnabled, toggleSound, playVortex } = useSound();

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

  // Search bar animation state
  const [isBeingSucked, setIsBeingSucked] = useState(false);
  const [searchBarGone, setSearchBarGone] = useState(false);

  // History state - persisted to localStorage
  const [history, setHistory] = useState<Inquiry[]>([]);
  const [currentInquiryId, setCurrentInquiryId] = useState<string | null>(null);

  // Cap history to prevent localStorage overflow (~5-10MB limit, images are ~100KB+ each)
  const MAX_HISTORY_ITEMS = 50;

  // Load history from localStorage on mount (with cleanup for oversized data)
  useEffect(() => {
    const savedHistory = localStorage.getItem("ace-it-history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Convert timestamp strings back to Date objects, cap items, and prune old images
        const restored = parsed
          .slice(0, MAX_HISTORY_ITEMS)
          .map((item: Inquiry, index: number) => ({
            ...item,
            timestamp: new Date(item.timestamp),
            // Remove images from items older than 10 to reduce storage
            image: index < 10 ? item.image : null,
          }));
        setHistory(restored);
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes (with quota handling)
  useEffect(() => {
    if (history.length === 0) return;

    const saveHistory = (items: typeof history): boolean => {
      try {
        localStorage.setItem("ace-it-history", JSON.stringify(items));
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          return false;
        }
        console.error("Failed to save history:", e);
        return true; // Don't retry on other errors
      }
    };

    // Try to save as-is
    if (saveHistory(history)) return;

    // Quota exceeded - progressively reduce data
    console.warn("localStorage quota exceeded, pruning history...");

    // Step 1: Remove images from older items (keep first 5 with images)
    let pruned = history.map((item, i) =>
      i >= 5 && item.image ? { ...item, image: null } : item
    );
    if (saveHistory(pruned)) {
      console.log("Saved after removing old images");
      return;
    }

    // Step 2: Remove all images except current
    pruned = history.map((item, i) =>
      i > 0 ? { ...item, image: null } : item
    );
    if (saveHistory(pruned)) {
      console.log("Saved after removing all old images");
      return;
    }

    // Step 3: Keep only last 20 items without images
    pruned = history.slice(0, 20).map((item) => ({ ...item, image: null }));
    if (saveHistory(pruned)) {
      console.log("Saved after aggressive pruning");
      return;
    }

    // Step 4: Nuclear option - keep only 10 items, no images, no quiz data
    pruned = history.slice(0, 10).map((item) => ({
      ...item,
      image: null,
      quiz: null,
      quizProgress: null,
    }));
    saveHistory(pruned);
    console.log("Saved with minimal data");
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

      const quizRes = await fetchWithRetry("https://jeebus87--ace-it-backend-quiz.modal.run", {
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
    // Trigger black hole animation and sound
    playVortex();
    setIsBeingSucked(true);

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
      const answerRes = await fetchWithRetry("https://jeebus87--ace-it-backend-generate.modal.run", {
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
      setImageStatus("loading");

      // 2. Generate image in background (don't block the flow)
      (async () => {
        try {
          const imageRes = await fetchWithRetry("https://jeebus87--ace-it-backend-image-gen.modal.run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: query,
              summary: generatedAnswer.substring(0, 500) || "",
            }),
          });
          const imageData = await imageRes.json();

          if (imageData.image && typeof imageData.image === "string" && imageData.image.startsWith("data:")) {
            setImage(imageData.image);
            // Update history entry with image
            setHistory((prev) => prev.map((item) => (item.id === inquiryId ? { ...item, image: imageData.image } : item)));
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
        }
      })();

      // 3. Save to history immediately (image will update when ready)
      const newInquiry: Inquiry = {
        id: inquiryId,
        query,
        answer: generatedAnswer,
        image: null,
        quiz: null,
        quizProgress: null,
        timestamp: new Date(),
      };
      setHistory((prev) => [newInquiry, ...prev].slice(0, MAX_HISTORY_ITEMS));

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
    // Search bar stays gone when viewing history
    setSearchBarGone(true);
    setIsBeingSucked(false);
  };

  const handleSuckComplete = () => {
    setIsBeingSucked(false);
    setSearchBarGone(true);
  };

  const handleNewSearch = () => {
    // Navigate to a fresh page
    window.location.href = '/';
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
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <Link
          href="/stats"
          className={`
            relative
            p-2
            border-2 border-[hsl(var(--border))]
            bg-[hsl(var(--bg-surface))]
            hover:border-[hsl(var(--neon-yellow))] hover:text-[hsl(var(--neon-yellow))]
            transition-all duration-200
          `}
          title="View Stats"
        >
          <BarChart3 className="w-5 h-5" />
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

      {/* Header - Arcade style logo */}
      <header className="text-center mt-20 sm:mt-24 mb-8 sm:mb-12">
        {/* Pixel art logo */}
        <div className="flex justify-center mb-4">
          <div className={`
            relative
            inline-flex items-center gap-3
            px-6 py-3
            bg-[hsl(var(--bg-surface))]
            border-4 border-[hsl(var(--neon-cyan))]
            neon-glow-cyan
          `}>
            {/* Pixel corners */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[hsl(var(--neon-cyan))]" />

            <Target className="w-8 h-8 sm:w-10 sm:h-10 text-[hsl(var(--neon-cyan))]" />
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[hsl(var(--neon-cyan))] neon-text">
              ACE-IT
            </h1>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-accent text-xs sm:text-sm text-[hsl(var(--text-muted))] tracking-wider max-w-md mx-auto px-4">
          AI-POWERED STUDY ASSISTANT
        </p>
        <p className="font-body text-sm text-[hsl(var(--text-muted))] mt-2 max-w-md mx-auto px-4">
          Search any topic, get expert answers, and master with quizzes.
        </p>
      </header>

      {/* Search - only show on fresh page before any search */}
      {!searchBarGone && !answer && (
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          isBeingSucked={isBeingSucked}
          onSuckComplete={handleSuckComplete}
        />
      )}

      {/* New Search button - show when search bar is gone or we have content */}
      {(searchBarGone || answer) && (
        <div className="flex justify-center mb-8 px-4 sm:px-0">
          <button
            onClick={handleNewSearch}
            className={`
              relative
              px-6 sm:px-8 py-4
              bg-[hsl(var(--bg-surface))]
              border-2 border-[hsl(var(--neon-magenta))]
              text-[hsl(var(--neon-magenta))]
              font-display text-xs sm:text-sm
              hover:bg-[hsl(var(--neon-magenta))]
              hover:text-[hsl(var(--bg-deep))]
              hover:shadow-[0_0_30px_hsl(var(--neon-magenta)/0.5)]
              transition-all duration-200
              hover:scale-105
              active:scale-95
              neon-glow-magenta
            `}
          >
            {/* Pixel corners */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[hsl(var(--neon-magenta))]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[hsl(var(--neon-magenta))]" />

            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              NEW SEARCH
            </span>
          </button>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`
            flex items-center gap-2
            px-4 py-2
            bg-[hsl(var(--bg-surface))]
            border-2 border-[hsl(var(--neon-cyan))]
          `}>
            <Sparkles className="w-4 h-4 text-[hsl(var(--neon-cyan))] animate-neon-pulse" />
            <span className="font-accent text-xs text-[hsl(var(--neon-cyan))] tracking-wider">
              {status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Answer */}
      <AnswerDisplay content={answer} loading={loading && !answer} />

      {/* Image */}
      {image && <ImageViewer src={image} />}

      {/* Image Status Message */}
      {imageStatus === "content-blocked" && !image && (
        <div className="max-w-4xl mx-auto mb-6 px-4 sm:px-0">
          <div className={`
            flex items-center justify-center gap-3 p-4
            bg-[hsl(var(--bg-surface))]
            border-2 border-[hsl(var(--border))]
          `}>
            <ImageOff className="w-5 h-5 text-[hsl(var(--text-muted))]" />
            <p className="font-accent text-xs text-[hsl(var(--text-muted))] tracking-wider">
              VISUAL BLOCKED DUE TO CONTENT RESTRICTIONS
            </p>
          </div>
        </div>
      )}

      {/* Quiz Generating Indicator */}
      <QuizGenerating visible={quizGenerating} />

      {/* Quiz Button - Arcade style */}
      {quiz && quiz.questions.length > 0 && (
        <div className="flex justify-center mb-8 px-4 sm:px-0">
          <button
            onClick={() => setShowQuiz(true)}
            className={`
              relative
              px-6 sm:px-8 py-4
              bg-[hsl(var(--neon-cyan))]
              border-4 border-[hsl(var(--neon-cyan))]
              text-[hsl(var(--bg-deep))]
              font-display text-sm sm:text-base
              hover:shadow-[0_0_40px_hsl(var(--neon-cyan)/0.5)]
              transition-all duration-200
              hover:scale-105
              active:scale-95
            `}
          >
            {/* Pixel corners */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-[hsl(var(--neon-cyan))]" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-[hsl(var(--neon-cyan))]" />

            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              START QUIZ ({quiz.questions.length} QUESTIONS)
            </span>
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
      <footer className="text-center mt-12 pb-20 sm:pb-8">
        <p className="font-accent text-[10px] text-[hsl(var(--text-dim))] tracking-wider">
          POWERED BY GEMINI AI
        </p>
      </footer>
    </main>
  );
}
