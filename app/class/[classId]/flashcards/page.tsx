"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Flashcard } from "@/lib/types";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Play,
  Trash2,
  Loader2,
  X,
  Layers,
} from "lucide-react";

type View = "list" | "study" | "add";

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { state, addFlashcards, updateFlashcard, deleteFlashcard } = useStore();

  const cls = state.classes.find((c) => c.id === classId);
  const allCards = useMemo(
    () => {
      const filtered = state.flashcards.filter((f) => f.class_id === classId);
      console.log("Flashcard filter - classId:", classId, "total flashcards:", state.flashcards.length, "filtered for this class:", filtered.length);
      return filtered;
    },
    [state.flashcards, classId]
  );

  const [view, setView] = useState<View>("list");
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);

  // Add card form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  // Study mode state
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const now = new Date().toISOString();
  const dueCards = useMemo(
    () => allCards.filter((c) => c.next_review <= now),
    [allCards, now]
  );
  const displayCards = showDueOnly ? dueCards : allCards;

  const studyDeck = useMemo(() => {
    const due = allCards.filter((c) => c.next_review <= now);
    // Shuffle
    return [...due].sort(() => Math.random() - 0.5);
  }, [allCards, now]);

  if (!cls) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  async function handleAddCard() {
    if (!front.trim() || !back.trim()) return;
    await addFlashcards([
      {
        class_id: classId,
        front: front.trim(),
        back: back.trim(),
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: new Date().toISOString(),
      },
    ]);
    setFront("");
    setBack("");
    setView("list");
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabusText: cls!.syllabus_text,
          className: cls!.name,
          topic: aiTopic.trim() || undefined,
        }),
        keepalive: true,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.flashcards || !Array.isArray(data.flashcards) || data.flashcards.length === 0) {
        throw new Error("No flashcards returned from API");
      }

      const cards = data.flashcards as { front: string; back: string }[];
      console.log("About to add", cards.length, "flashcards to class", classId);

      const addedCards = await addFlashcards(
        cards.map((c) => ({
          class_id: classId,
          front: c.front,
          back: c.back,
          ease_factor: 2.5,
          interval: 0,
          repetitions: 0,
          next_review: new Date().toISOString(),
        }))
      );

      console.log("Successfully added", addedCards.length, "flashcards");
      setShowAiInput(false);
      setAiTopic("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Flashcard generation error:", message);
      alert(`Failed to generate flashcards: ${message}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRate(quality: "again" | "hard" | "good" | "easy") {
    const card = studyDeck[studyIndex];
    if (!card) return;

    let { ease_factor, interval, repetitions } = card;

    switch (quality) {
      case "again":
        repetitions = 0;
        interval = 1;
        ease_factor = Math.max(1.3, ease_factor - 0.2);
        break;
      case "hard":
        repetitions += 1;
        interval = Math.max(1, Math.round(interval * 1.2));
        ease_factor = Math.max(1.3, ease_factor - 0.15);
        break;
      case "good":
        repetitions += 1;
        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.round(interval * ease_factor);
        }
        break;
      case "easy":
        repetitions += 1;
        if (repetitions === 1) {
          interval = 4;
        } else {
          interval = Math.round(interval * ease_factor * 1.3);
        }
        ease_factor += 0.15;
        break;
    }

    const next_review = new Date(
      Date.now() + interval * 24 * 60 * 60 * 1000
    ).toISOString();

    await updateFlashcard(card.id, {
      ease_factor,
      interval,
      repetitions,
      next_review,
    });

    setRated(true);
  }

  function handleNextCard() {
    if (studyIndex + 1 >= studyDeck.length) {
      setView("list");
      setStudyIndex(0);
    } else {
      setStudyIndex(studyIndex + 1);
    }
    setFlipped(false);
    setRated(false);
  }

  function startStudy() {
    setStudyIndex(0);
    setFlipped(false);
    setRated(false);
    setView("study");
  }

  // --- Study Mode ---
  if (view === "study") {
    const card = studyDeck[studyIndex];
    if (!card) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              No cards due for review!
            </p>
            <button
              onClick={() => setView("list")}
              className="text-sm text-olive-500 hover:underline"
            >
              Back to cards
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                setView("list");
                setStudyIndex(0);
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={16} />
              End Session
            </button>
            <span className="text-sm text-gray-500">
              Card {studyIndex + 1} of {studyDeck.length}
            </span>
          </div>

          <div
            className="flashcard-container mx-auto cursor-pointer"
            style={{ height: "320px", maxWidth: "500px" }}
            onClick={() => !rated && setFlipped(!flipped)}
          >
            <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
              <div className="flashcard-front bg-white">
                <p className="text-lg text-center text-gray-900 font-medium">
                  {card.front}
                </p>
              </div>
              <div className="flashcard-back">
                <p className="text-lg text-center">{card.back}</p>
              </div>
            </div>
          </div>

          {!flipped && !rated && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Click to reveal answer
            </p>
          )}

          {flipped && !rated && (
            <div className="flex justify-center gap-3 mt-8">
              <button
                onClick={() => handleRate("again")}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Again
              </button>
              <button
                onClick={() => handleRate("hard")}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              >
                Hard
              </button>
              <button
                onClick={() => handleRate("good")}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                Good
              </button>
              <button
                onClick={() => handleRate("easy")}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Easy
              </button>
            </div>
          )}

          {rated && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleNextCard}
                className="px-6 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors text-sm"
              >
                {studyIndex + 1 >= studyDeck.length
                  ? "Finish"
                  : "Next Card"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Add Card View ---
  if (view === "add") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft size={16} />
            Back to cards
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add Flashcard
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Front (Question)
              </label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
                placeholder="Enter the question or prompt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Back (Answer)
              </label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
                placeholder="Enter the answer..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!front.trim() || !back.trim()}
                className="px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors text-sm disabled:opacity-50"
              >
                Save Card
              </button>
              <button
                onClick={() => {
                  setFront("");
                  setBack("");
                  setView("list");
                }}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/class/${classId}`)}
              className="p-1 text-gray-400 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
              <p className="text-sm text-gray-500">
                {allCards.length} card{allCards.length !== 1 ? "s" : ""} &middot;{" "}
                {dueCards.length} due for review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("add")}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
              Add Card
            </button>
            <button
              onClick={() => {
                if (showAiInput) {
                  setShowAiInput(false);
                } else {
                  setShowAiInput(true);
                }
              }}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {generating ? "Generating..." : "AI Generate"}
            </button>
            {dueCards.length > 0 && (
              <button
                onClick={startStudy}
                className="flex items-center gap-1.5 px-3 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors text-sm"
              >
                <Play size={14} />
                Study ({dueCards.length})
              </button>
            )}
          </div>
        </div>

        {/* AI Topic Input */}
        {showAiInput && (
          <div className="mb-6 p-4 border rounded-xl bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Generate flashcards with AI
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Topic (optional — leave blank for general)"
                className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 bg-white"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors text-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {generating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Generate
              </button>
              <button
                onClick={() => {
                  setShowAiInput(false);
                  setAiTopic("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Filter toggle */}
        {allCards.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowDueOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                !showDueOnly
                  ? "bg-sidebar text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All ({allCards.length})
            </button>
            <button
              onClick={() => setShowDueOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showDueOnly
                  ? "bg-sidebar text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Due ({dueCards.length})
            </button>
          </div>
        )}

        {/* Card List */}
        {displayCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-sidebar/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Layers size={32} className="text-sidebar" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {allCards.length === 0
                ? "No flashcards yet"
                : "No cards due for review"}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {allCards.length === 0
                ? "Create cards manually or generate them with AI."
                : "All caught up! Check back later."}
            </p>
            {allCards.length === 0 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setView("add")}
                  className="px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors text-sm"
                >
                  Add Card
                </button>
                <button
                  onClick={() => setShowAiInput(true)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  AI Generate
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayCards.map((card) => (
              <FlashcardRow
                key={card.id}
                card={card}
                onDelete={() => deleteFlashcard(card.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlashcardRow({
  card,
  onDelete,
}: {
  card: Flashcard;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDue = card.next_review <= new Date().toISOString();

  return (
    <div
      className="border rounded-xl p-4 hover:border-olive-500/50 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{card.front}</p>
          {expanded && (
            <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
              {card.back}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDue && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              Due
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
            title="Delete card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
