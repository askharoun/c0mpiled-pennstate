"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useState } from "react";
import InteractiveDrill from "@/components/InteractiveDrill";
import { Loader2, Dumbbell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DrillsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { state } = useStore();
  const cls = state.classes.find((c) => c.id === classId);

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [drill, setDrill] = useState<{
    question: string;
    steps: { prompt: string; hint: string; answer: string }[];
    difficulty: string;
    topic: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!cls) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  async function generateDrill() {
    if (loading || !cls) return;
    setLoading(true);
    setError(null);
    setDrill(null);

    const prompt = topic.trim()
      ? `Generate an interactive drill on the topic "${topic.trim()}" for this class. Include 4-5 progressive steps that build on each other.`
      : `Generate an interactive drill on an important topic from this class. Choose a topic from the syllabus and include 4-5 progressive steps.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          syllabusText: cls.syllabus_text,
          className: cls.name,
          difficulty: state.settings.difficulty,
          responseLength: "detailed",
          practiceProblemsEnabled: true,
        }),
        keepalive: true,
      });

      if (!res.ok) throw new Error("Failed to generate drill");
      const data = await res.json();

      // Extract drill block from response
      const drillMatch = data.content.match(/:::drill\s*([\s\S]*?):::/);
      if (drillMatch) {
        const parsed = JSON.parse(drillMatch[1].trim());
        setDrill(parsed);
      } else {
        setError("The AI didn't generate a drill format. Try again with a more specific topic.");
      }
    } catch {
      setError("Failed to generate drill. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/class/${classId}`}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
          >
            <ArrowLeft size={14} />
            Back to {cls.name}
          </Link>
          <div className="flex items-center gap-3">
            <Dumbbell size={24} className="text-olive-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Drills</h1>
              <p className="text-gray-500 text-sm">Step-by-step guided problem solving</p>
            </div>
          </div>
        </div>

        {/* Generator */}
        <div className="bg-gray-50 rounded-xl border p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Generate a new drill</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (or leave blank for a random topic)..."
              disabled={loading}
              className="flex-1 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 disabled:opacity-50 bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") generateDrill();
              }}
            />
            <button
              onClick={generateDrill}
              disabled={loading}
              className="px-5 py-3 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Dumbbell size={16} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Drill */}
        {drill && <InteractiveDrill data={drill} />}

        {/* Empty state */}
        {!drill && !loading && !error && (
          <div className="text-center py-16">
            <Dumbbell size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Enter a topic above to generate an interactive drill</p>
            <p className="text-gray-400 text-sm mt-1">
              Drills break down complex problems into guided steps with hints
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
