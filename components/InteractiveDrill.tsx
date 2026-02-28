"use client";

import { useState } from "react";
import { ChevronRight, Lightbulb, CheckCircle2, XCircle, Eye, Trophy } from "lucide-react";

interface DrillStep {
  prompt: string;
  hint: string;
  answer: string;
}

interface DrillData {
  question: string;
  steps: DrillStep[];
  difficulty: string;
  topic: string;
}

interface InteractiveDrillProps {
  data: DrillData;
  onEvaluateStep?: (stepIndex: number, userAnswer: string, correctAnswer: string, prompt: string) => void;
}

type StepState = "locked" | "active" | "answered" | "revealed";

export default function InteractiveDrill({ data, onEvaluateStep }: InteractiveDrillProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(
    data.steps.map((_, i) => (i === 0 ? "active" : "locked"))
  );
  const [answers, setAnswers] = useState<string[]>(data.steps.map(() => ""));
  const [showHints, setShowHints] = useState<boolean[]>(data.steps.map(() => false));
  const [results, setResults] = useState<("correct" | "incorrect" | null)[]>(
    data.steps.map(() => null)
  );

  const completedCount = stepStates.filter((s) => s === "answered" || s === "revealed").length;
  const allDone = completedCount === data.steps.length;

  function handleCheckAnswer(index: number) {
    const userAnswer = answers[index].trim().toLowerCase();
    const correctAnswer = data.steps[index].answer.trim().toLowerCase();

    const isCorrect =
      userAnswer === correctAnswer ||
      correctAnswer.includes(userAnswer) ||
      userAnswer.includes(correctAnswer);

    setResults((prev) => {
      const next = [...prev];
      next[index] = isCorrect ? "correct" : "incorrect";
      return next;
    });

    setStepStates((prev) => {
      const next = [...prev];
      next[index] = "answered";
      if (index + 1 < data.steps.length && next[index + 1] === "locked") {
        next[index + 1] = "active";
      }
      return next;
    });

    if (onEvaluateStep) {
      onEvaluateStep(index, answers[index], data.steps[index].answer, data.steps[index].prompt);
    }
  }

  function handleRevealAnswer(index: number) {
    setStepStates((prev) => {
      const next = [...prev];
      next[index] = "revealed";
      if (index + 1 < data.steps.length && next[index + 1] === "locked") {
        next[index + 1] = "active";
      }
      return next;
    });
    setResults((prev) => {
      const next = [...prev];
      next[index] = "incorrect";
      return next;
    });
  }

  function toggleHint(index: number) {
    setShowHints((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  const difficultyColor = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  }[data.difficulty] || "bg-gray-100 text-gray-700";

  return (
    <div className="bg-gradient-to-br from-olive-500/5 to-olive-500/10 rounded-xl border border-olive-500/20 p-6 my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-olive-600 uppercase tracking-wide">Interactive Drill</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
              {data.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{data.question}</h3>
          {data.topic && (
            <p className="text-sm text-gray-500 mt-0.5">Topic: {data.topic}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span>{completedCount} of {data.steps.length} steps</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-olive-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / data.steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {data.steps.map((step, i) => {
          const stepState = stepStates[i];
          const isLocked = stepState === "locked";
          const isAnswered = stepState === "answered";
          const isRevealed = stepState === "revealed";
          const isDone = isAnswered || isRevealed;

          return (
            <div
              key={i}
              className={`rounded-lg border p-4 transition-all ${
                isLocked
                  ? "bg-gray-50 border-gray-200 opacity-50"
                  : isDone
                  ? results[i] === "correct"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                  : "bg-white border-olive-500/30 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isDone
                    ? results[i] === "correct"
                      ? "bg-green-500 text-white"
                      : "bg-red-400 text-white"
                    : stepState === "active"
                    ? "bg-olive-500 text-white"
                    : "bg-gray-300 text-white"
                }`}>
                  {isDone ? (
                    results[i] === "correct" ? <CheckCircle2 size={14} /> : <XCircle size={14} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="text-sm font-medium text-gray-700">Step {i + 1}</span>
                {isDone && results[i] === "correct" && (
                  <span className="text-xs text-green-600 font-medium">Correct!</span>
                )}
                {isDone && results[i] === "incorrect" && !isRevealed && (
                  <span className="text-xs text-red-600 font-medium">Not quite</span>
                )}
                {isRevealed && (
                  <span className="text-xs text-gray-500 font-medium">Answer revealed</span>
                )}
              </div>

              <p className="text-sm text-gray-800 mb-3 ml-8">{step.prompt}</p>

              {/* Hint toggle */}
              {!isLocked && (
                <div className="ml-8">
                  <button
                    onClick={() => toggleHint(i)}
                    className="text-xs text-olive-600 hover:text-olive-700 flex items-center gap-1 mb-2"
                  >
                    <Lightbulb size={12} />
                    {showHints[i] ? "Hide hint" : "Show hint"}
                  </button>
                  {showHints[i] && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 mb-3 text-sm text-yellow-800">
                      {step.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Input & actions */}
              {stepState === "active" && (
                <div className="ml-8 flex items-center gap-2">
                  <input
                    type="text"
                    value={answers[i]}
                    onChange={(e) => {
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      });
                    }}
                    placeholder="Your answer..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && answers[i].trim()) handleCheckAnswer(i);
                    }}
                  />
                  <button
                    onClick={() => handleCheckAnswer(i)}
                    disabled={!answers[i].trim()}
                    className="px-3 py-2 bg-olive-500 text-white text-sm rounded-lg hover:bg-olive-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <ChevronRight size={14} />
                    Check
                  </button>
                  <button
                    onClick={() => handleRevealAnswer(i)}
                    className="px-3 py-2 border text-sm rounded-lg text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1"
                  >
                    <Eye size={14} />
                    Reveal
                  </button>
                </div>
              )}

              {/* Show correct answer after incorrect or reveal */}
              {isDone && results[i] !== "correct" && (
                <div className="ml-8 mt-2 bg-white border rounded-md px-3 py-2 text-sm">
                  <span className="text-gray-500">Correct answer: </span>
                  <span className="text-gray-900 font-medium">{step.answer}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {allDone && (
        <div className="mt-6 bg-white rounded-lg border p-4 flex items-center gap-3">
          <Trophy size={24} className="text-yellow-500" />
          <div>
            <p className="font-medium text-gray-900">
              Drill Complete!
            </p>
            <p className="text-sm text-gray-500">
              You got {results.filter((r) => r === "correct").length} out of {data.steps.length} steps correct.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
