"use client";

import { ExternalLink, Play } from "lucide-react";

interface VideoRecommendation {
  title: string;
  channel: string;
  searchQuery: string;
  reason: string;
}

interface VideoResourcesProps {
  videos: VideoRecommendation[];
}

export default function VideoResources({ videos }: VideoResourcesProps) {
  if (!videos.length) return null;

  return (
    <div className="bg-gradient-to-br from-red-50/50 to-orange-50/50 rounded-xl border border-red-200/40 p-6 my-4">
      <div className="flex items-center gap-2 mb-4">
        <Play size={16} className="text-red-500" />
        <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
          Recommended Videos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((video, i) => (
          <a
            key={i}
            href={`https://youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-red-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                  {video.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{video.channel}</p>
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-red-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{video.reason}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
