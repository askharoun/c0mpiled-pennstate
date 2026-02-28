"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/lib/types";
import PracticeProblem from "./PracticeProblem";
import InteractiveDrill from "./InteractiveDrill";
import VideoResources from "./VideoResources";

interface ChatThreadProps {
  messages: Message[];
  onSubmitPracticeAnswer: (answer: string, problem: string) => void;
  onEvaluateDrillStep?: (stepIndex: number, userAnswer: string, correctAnswer: string, prompt: string) => void;
}

interface ParsedContent {
  mainContent: string;
  problem: string | null;
  drill: { question: string; steps: { prompt: string; hint: string; answer: string }[]; difficulty: string; topic: string } | null;
  videos: { title: string; channel: string; searchQuery: string; reason: string }[] | null;
}

function extractBlocks(content: string): ParsedContent {
  let mainContent = content;
  let problem: string | null = null;
  let drill = null;
  let videos = null;

  // Extract :::practice block
  const practiceMatch = mainContent.match(/:::practice\s*([\s\S]*?):::/);
  if (practiceMatch) {
    problem = practiceMatch[1].trim();
    mainContent = mainContent.replace(practiceMatch[0], "").trim();
  }

  // Extract :::drill block
  const drillMatch = mainContent.match(/:::drill\s*([\s\S]*?):::/);
  if (drillMatch) {
    try {
      drill = JSON.parse(drillMatch[1].trim());
    } catch {
      // If JSON parsing fails, ignore the drill block
    }
    mainContent = mainContent.replace(drillMatch[0], "").trim();
  }

  // Extract :::videos block
  const videosMatch = mainContent.match(/:::videos\s*([\s\S]*?):::/);
  if (videosMatch) {
    try {
      videos = JSON.parse(videosMatch[1].trim());
    } catch {
      // If JSON parsing fails, ignore the videos block
    }
    mainContent = mainContent.replace(videosMatch[0], "").trim();
  }

  return { mainContent, problem, drill, videos };
}

export default function ChatThread({ messages, onSubmitPracticeAnswer, onEvaluateDrillStep }: ChatThreadProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="mb-6 flex justify-end">
                <div className="bg-sidebar/10 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                  <p className="text-gray-900 text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          }

          const { mainContent, problem, drill, videos } = extractBlocks(msg.content);

          return (
            <div key={msg.id} className="mb-6">
              <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-th:bg-sidebar prose-th:text-white prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-td:border prose-table:border-collapse">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
              </div>

              {problem && (
                <PracticeProblem
                  problem={problem}
                  onSubmit={(answer) => onSubmitPracticeAnswer(answer, problem)}
                />
              )}

              {drill && (
                <InteractiveDrill
                  data={drill}
                  onEvaluateStep={onEvaluateDrillStep}
                />
              )}

              {videos && videos.length > 0 && (
                <VideoResources videos={videos} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
