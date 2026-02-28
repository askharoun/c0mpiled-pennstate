"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import ChatThread from "@/components/ChatThread";
import ChatInput from "@/components/ChatInput";
import { Loader2 } from "lucide-react";

export default function ThreadPage() {
  const params = useParams();
  const classId = params.classId as string;
  const threadId = params.threadId as string;
  const { state, addMessage } = useStore();
  const [loading, setLoading] = useState(false);

  const cls = state.classes.find((c) => c.id === classId);
  const thread = state.threads.find((t) => t.id === threadId);

  if (!cls || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Thread not found</p>
      </div>
    );
  }

  async function sendMessage(content: string) {
    if (loading || !thread || !cls) return;
    setLoading(true);
    await addMessage(threadId, "user", content);

    const messages = [
      ...thread.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
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
      await addMessage(threadId, "assistant", data.content);
    } catch {
      await addMessage(
        threadId,
        "assistant",
        "Sorry, I encountered an error. Please try again."
      );
    }

    setLoading(false);
  }

  function handlePracticeAnswer(answer: string, problem: string) {
    sendMessage(
      `My answer to the practice problem "${problem}" is: ${answer}\n\nPlease evaluate my answer and explain if it's correct or incorrect, and why.`
    );
  }

  function handleDrillStepAnswer(stepIndex: number, userAnswer: string, correctAnswer: string, prompt: string) {
    sendMessage(
      `For the drill step "${prompt}", my answer was: ${userAnswer}\nThe expected answer was: ${correctAnswer}\n\nPlease briefly evaluate my answer — was I on the right track? Explain any mistakes and give a tip for improvement.`
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">{thread.title}</h1>
        <p className="text-sm text-gray-500">{cls.name}</p>
      </div>

      {/* Messages */}
      <ChatThread
        messages={thread.messages}
        onSubmitPracticeAnswer={handlePracticeAnswer}
        onEvaluateDrillStep={handleDrillStepAnswer}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Thinking...
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
