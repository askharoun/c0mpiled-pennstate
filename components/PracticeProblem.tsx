"use client";

import { useState } from "react";
import { SendHorizonal, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PracticeProblemProps {
  problem: string;
  onSubmit: (answer: string) => void;
}

export default function PracticeProblem({ problem, onSubmit }: PracticeProblemProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitted(true);
    onSubmit(answer.trim());
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 my-4">
      <p className="text-sm text-gray-500 mb-2">Let&apos;s try a practice problem:</p>
      <div className="bg-white rounded-lg p-4 mb-4 border prose prose-sm max-w-none">
        <ReactMarkdown>{problem}</ReactMarkdown>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={submitted}
          className="flex-1 px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={submitted || !answer.trim()}
          className="px-4 py-2.5 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          Submit Answer
          <SendHorizonal size={16} />
        </button>
      </form>
      {submitted && (
        <p className="mt-3 text-sm text-olive-600 flex items-center gap-1">
          <CheckCircle2 size={14} />
          Answer submitted! The AI will review your response.
        </p>
      )}
    </div>
  );
}
