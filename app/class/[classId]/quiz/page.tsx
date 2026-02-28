"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Quiz, QuizQuestion } from "@/lib/types";
import {
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  ArrowLeft,
  Trophy,
} from "lucide-react";

type View = "setup" | "taking" | "results";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { state, addQuiz, updateQuiz } = useStore();

  const cls = state.classes.find((c) => c.id === classId);
  const pastQuizzes = state.quizzes
    .filter((q) => q.class_id === classId && q.completed_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const [view, setView] = useState<View>("setup");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<"both" | "multiple_choice" | "free_response">("both");
  const [generating, setGenerating] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!cls) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  async function handleGenerate() {
    if (generating || !cls) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: cls.name,
          syllabusText: cls.syllabus_text,
          difficulty: state.settings.difficulty,
          questionCount,
          questionTypes,
        }),
        keepalive: true,
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      const questions: QuizQuestion[] = data.questions;

      const quiz = await addQuiz({
        class_id: classId,
        questions,
        answers: {},
      });

      setActiveQuiz(quiz);
      setAnswers({});
      setCurrentIndex(0);
      setView("taking");
    } catch (err) {
      console.error("Quiz generation failed:", err);
      alert("Failed to generate quiz. Please try again.");
    }
    setGenerating(false);
  }

  function handleAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!activeQuiz) return;

    let score = 0;
    for (const q of activeQuiz.questions) {
      const userAnswer = answers[q.id]?.trim().toLowerCase() || "";
      const correct = q.correct_answer.trim().toLowerCase();
      if (q.type === "multiple_choice") {
        if (userAnswer === correct) score++;
      } else {
        // For free response, exact match (case-insensitive)
        if (userAnswer === correct) score++;
      }
    }

    const total = activeQuiz.questions.length;

    try {
      await updateQuiz(activeQuiz.id, {
        answers,
        score,
        total,
        completed_at: new Date().toISOString(),
      });

      setActiveQuiz((prev) =>
        prev ? { ...prev, answers, score, total, completed_at: new Date().toISOString() } : null
      );
    } catch {
      // Update local state even if DB fails
      setActiveQuiz((prev) =>
        prev ? { ...prev, answers, score, total, completed_at: new Date().toISOString() } : null
      );
    }

    setView("results");
  }

  function handleRetry() {
    setActiveQuiz(null);
    setAnswers({});
    setCurrentIndex(0);
    setView("setup");
  }

  function viewPastQuiz(quiz: Quiz) {
    setActiveQuiz(quiz);
    setAnswers(quiz.answers || {});
    setCurrentIndex(0);
    setView("results");
  }

  const currentQuestion = activeQuiz?.questions[currentIndex];
  const allAnswered = activeQuiz?.questions.every((q) => answers[q.id]?.trim());
  const answeredCount = activeQuiz?.questions.filter((q) => answers[q.id]?.trim()).length || 0;

  // Setup View
  if (view === "setup") {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-sidebar/10 rounded-xl flex items-center justify-center">
              <ClipboardList size={24} className="text-sidebar" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Mode</h1>
              <p className="text-sm text-gray-500">{cls.name}</p>
            </div>
          </div>

          {/* Configuration */}
          <div className="border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Quiz Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-2">Number of Questions</label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        questionCount === n
                          ? "bg-sidebar text-white"
                          : "border text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-2">Question Type</label>
                <div className="flex gap-2">
                  {([
                    { value: "both", label: "Mixed" },
                    { value: "multiple_choice", label: "Multiple Choice" },
                    { value: "free_response", label: "Free Response" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setQuestionTypes(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        questionTypes === opt.value
                          ? "bg-sidebar text-white"
                          : "border text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-6 w-full py-3 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                "Generate Quiz"
              )}
            </button>
          </div>

          {/* Past Quizzes */}
          {pastQuizzes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3">Past Quizzes</h2>
              <div className="space-y-2">
                {pastQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => viewPastQuiz(quiz)}
                    className="w-full flex items-center justify-between p-4 border rounded-xl hover:border-olive-500 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {quiz.questions.length} questions
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {quiz.score}/{quiz.total}
                      </p>
                      <p className={`text-xs font-medium ${
                        (quiz.score! / quiz.total!) >= 0.7 ? "text-green-600" : "text-red-500"
                      }`}>
                        {Math.round((quiz.score! / quiz.total!) * 100)}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz-Taking View
  if (view === "taking" && activeQuiz && currentQuestion) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-12 px-4">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                Question {currentIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {answeredCount}/{activeQuiz.questions.length} answered
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-sidebar h-2 rounded-full transition-all"
                style={{
                  width: `${((currentIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                currentQuestion.type === "multiple_choice"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-purple-50 text-purple-700"
              }`}>
                {currentQuestion.type === "multiple_choice" ? "Multiple Choice" : "Free Response"}
              </span>
            </div>

            <h2 className="text-lg font-medium text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      answers[currentQuestion.id] === option
                        ? "border-sidebar bg-sidebar/5 text-gray-900"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium mr-3 text-gray-400">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer..."
                rows={4}
                className="w-full p-4 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex gap-1.5">
              {activeQuiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    i === currentIndex
                      ? "bg-sidebar text-white"
                      : answers[q.id]?.trim()
                        ? "bg-sidebar/20 text-sidebar"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="flex items-center gap-2 px-5 py-2 bg-sidebar text-white text-sm font-medium rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results View
  if (view === "results" && activeQuiz) {
    const score = activeQuiz.score ?? 0;
    const total = activeQuiz.total ?? activeQuiz.questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const displayAnswers = activeQuiz.answers || answers;

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-12 px-4">
          {/* Score Card */}
          <div className="border rounded-xl p-8 mb-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              percentage >= 70 ? "bg-green-50" : "bg-red-50"
            }`}>
              <Trophy size={28} className={percentage >= 70 ? "text-green-600" : "text-red-500"} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {score}/{total}
            </h1>
            <p className={`text-lg font-medium ${
              percentage >= 70 ? "text-green-600" : "text-red-500"
            }`}>
              {percentage}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {percentage >= 90
                ? "Excellent work!"
                : percentage >= 70
                  ? "Good job!"
                  : percentage >= 50
                    ? "Keep studying, you're getting there."
                    : "Review the material and try again."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} />
              New Quiz
            </button>
            <button
              onClick={() => router.push(`/class/${classId}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-sidebar text-white rounded-lg text-sm font-medium hover:bg-sidebar-hover transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Class
            </button>
          </div>

          {/* Question Review */}
          <h2 className="text-sm font-medium text-gray-500 mb-4">Question Review</h2>
          <div className="space-y-4">
            {activeQuiz.questions.map((q, i) => {
              const userAnswer = displayAnswers[q.id] || "";
              const isCorrect =
                q.type === "multiple_choice"
                  ? userAnswer === q.correct_answer
                  : userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();

              return (
                <div key={q.id} className={`border rounded-xl p-5 ${
                  isCorrect ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCorrect ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {isCorrect ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {i + 1}. {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="ml-9 space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Your answer: </span>
                      <span className={isCorrect ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                        {userAnswer || "(no answer)"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm">
                        <span className="text-gray-500">Correct answer: </span>
                        <span className="text-green-700 font-medium">{q.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200/60">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
