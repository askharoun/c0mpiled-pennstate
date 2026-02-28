"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useState, useRef } from "react";
import { MessageSquare, Upload, Loader2, Sparkles, Settings, Layers, ClipboardList, Dumbbell, Play } from "lucide-react";

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const { state, dispatch, createThread, addMessage, updateClassSyllabus } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cls = state.classes.find((c) => c.id === classId);
  const classThreads = state.threads
    .filter((t) => t.class_id === classId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  if (!cls) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  const suggestedPrompts = cls.syllabus_text
    ? [
        "Explain the key concepts from this week's topics",
        "Create a study guide for the midterm",
        "Give me practice problems on the latest material",
        "Summarize the course objectives",
      ]
    : [
        "Help me understand a topic from this class",
        "Create practice problems for me",
        "Explain a concept I'm struggling with",
      ];

  async function handleNewChat(prompt: string) {
    if (loading || !cls) return;
    setLoading(true);

    const title = prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt;

    try {
      const thread = await createThread(classId, title);
      await addMessage(thread.id, "user", prompt);
      dispatch({ type: "SET_ACTIVE_THREAD", payload: thread.id });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          syllabusText: cls.syllabus_text,
          className: cls.name,
          difficulty: state.settings.difficulty,
          responseLength: state.settings.responseLength,
          practiceProblemsEnabled: state.settings.practiceProblemsEnabled,
        }),
        keepalive: true,
      });

      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      await addMessage(thread.id, "assistant", data.content);

      setLoading(false);
      router.push(`/class/${classId}/thread/${thread.id}`);
    } catch {
      setLoading(false);
    }
  }

  async function handleSyllabusUpload(file: File) {
    if (!cls) return;
    setUploadingSyllabus(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-syllabus", {
        method: "POST",
        body: formData,
        keepalive: true,
      });
      if (!res.ok) throw new Error("Failed to parse");
      const data = await res.json();
      await updateClassSyllabus(cls.id, data.text);
    } catch {
      alert("Failed to parse syllabus PDF. Please try again.");
    }
    setUploadingSyllabus(false);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {cls.syllabus_text ? "Syllabus loaded" : "No syllabus uploaded"}
            </p>
          </div>
          <div className="flex items-center gap-2">
          {!cls.syllabus_text && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSyllabusUpload(f);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingSyllabus}
                className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {uploadingSyllabus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                Upload Syllabus
              </button>
            </>
          )}
          <button
            onClick={() => router.push(`/class/${classId}/settings`)}
            className="p-2 border rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Class settings"
          >
            <Settings size={16} />
          </button>
          </div>
        </div>

        {/* Study tools */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => router.push(`/class/${classId}/flashcards`)}
            className="flex items-center gap-3 p-4 border rounded-xl text-left hover:border-olive-500 hover:bg-olive-500/5 transition-all"
          >
            <Layers size={20} className="text-olive-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Flashcards</p>
              <p className="text-xs text-gray-500">Review with spaced repetition</p>
            </div>
          </button>
          <button
            onClick={() => router.push(`/class/${classId}/quiz`)}
            className="flex items-center gap-3 p-4 border rounded-xl text-left hover:border-olive-500 hover:bg-olive-500/5 transition-all"
          >
            <ClipboardList size={20} className="text-olive-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Quiz Mode</p>
              <p className="text-xs text-gray-500">Test your knowledge</p>
            </div>
          </button>
          <button
            onClick={() => router.push(`/class/${classId}/drills`)}
            className="flex items-center gap-3 p-4 border rounded-xl text-left hover:border-olive-500 hover:bg-olive-500/5 transition-all"
          >
            <Dumbbell size={20} className="text-olive-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Practice Drills</p>
              <p className="text-xs text-gray-500">Step-by-step guided problems</p>
            </div>
          </button>
          <button
            onClick={() => router.push(`/class/${classId}/videos`)}
            className="flex items-center gap-3 p-4 border rounded-xl text-left hover:border-olive-500 hover:bg-olive-500/5 transition-all"
          >
            <Play size={20} className="text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Video Resources</p>
              <p className="text-xs text-gray-500">Curated YouTube recommendations</p>
            </div>
          </button>
        </div>

        {/* Suggested prompts */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Sparkles size={14} />
            Suggested study topics
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleNewChat(prompt)}
                disabled={loading}
                className="p-4 border rounded-xl text-left text-sm text-gray-700 hover:border-olive-500 hover:bg-olive-500/5 transition-all disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div className="mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) handleNewChat(input.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this class..."
              disabled={loading}
              className="flex-1 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Thinking..." : "Ask"}
            </button>
          </form>
        </div>

        {/* Recent threads for this class */}
        {classThreads.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">Recent threads</h2>
            <div className="space-y-2">
              {classThreads.map((thread) => (
                <a
                  key={thread.id}
                  href={`/class/${classId}/thread/${thread.id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:border-olive-500 transition-colors"
                >
                  <MessageSquare size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{thread.title}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
