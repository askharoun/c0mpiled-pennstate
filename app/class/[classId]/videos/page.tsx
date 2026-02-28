"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useState } from "react";
import VideoResources from "@/components/VideoResources";
import { Loader2, Play, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VideosPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { state } = useStore();
  const cls = state.classes.find((c) => c.id === classId);

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<
    { title: string; channel: string; searchQuery: string; reason: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  if (!cls) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Class not found</p>
      </div>
    );
  }

  async function findVideos() {
    if (loading || !cls) return;
    setLoading(true);
    setError(null);
    setVideos([]);

    const prompt = topic.trim()
      ? `Recommend YouTube videos for learning about "${topic.trim()}" in the context of this class. Focus on high-quality educational channels.`
      : `Recommend the best YouTube videos and channels for studying the key topics in this class. Cover the most important subjects from the syllabus.`;

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

      if (!res.ok) throw new Error("Failed to find videos");
      const data = await res.json();

      // Extract videos block from response
      const videosMatch = data.content.match(/:::videos\s*([\s\S]*?):::/);
      if (videosMatch) {
        const parsed = JSON.parse(videosMatch[1].trim());
        setVideos(parsed);
      } else {
        setError("The AI didn't generate video recommendations. Try again with a specific topic.");
      }
    } catch {
      setError("Failed to find videos. Please try again.");
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
            <Play size={24} className="text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Resources</h1>
              <p className="text-gray-500 text-sm">Curated YouTube recommendations for your studies</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-50 rounded-xl border p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Find videos for a topic</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (or leave blank for general course videos)..."
              disabled={loading}
              className="flex-1 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500 disabled:opacity-50 bg-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") findVideos();
              }}
            />
            <button
              onClick={findVideos}
              disabled={loading}
              className="px-5 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Find Videos
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

        {/* Videos */}
        {videos.length > 0 && <VideoResources videos={videos} />}

        {/* Empty state */}
        {videos.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <Play size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Search for a topic to get YouTube video recommendations</p>
            <p className="text-gray-400 text-sm mt-1">
              We&apos;ll suggest videos from top educational channels like Khan Academy, 3Blue1Brown, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
