"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Download, Trash2, Loader2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function SettingsPage() {
  const { state, updateSettings } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  function handleExport() {
    const data = {
      classes: state.classes,
      threads: state.threads,
      flashcards: state.flashcards,
      quizzes: state.quizzes,
      events: state.events,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studyset-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClearAll() {
    setClearing(true);
    // Clear settings from localStorage
    if (state.user?.id) {
      localStorage.removeItem(`studyset-settings-${state.user.id}`);
    }
    window.location.reload();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Profile */}
        <div className="border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                {state.user?.email || "Not signed in"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Behavior */}
        <div className="border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Behavior</h2>
          <div className="space-y-6">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Controls the complexity of explanations and practice problems.
              </p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateSettings({ difficulty: level })}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      state.settings.difficulty === level
                        ? "bg-sidebar text-white"
                        : "border text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Response length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Length
              </label>
              <p className="text-xs text-gray-500 mb-3">
                How detailed the AI responses should be.
              </p>
              <div className="flex gap-2">
                {(["concise", "detailed"] as const).map((length) => (
                  <button
                    key={length}
                    onClick={() => updateSettings({ responseLength: length })}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      state.settings.responseLength === length
                        ? "bg-sidebar text-white"
                        : "border text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {length}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice problems toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Practice Problems
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Include practice problems at the end of AI responses.
                </p>
              </div>
              <button
                onClick={() =>
                  updateSettings({ practiceProblemsEnabled: !state.settings.practiceProblemsEnabled })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  state.settings.practiceProblemsEnabled ? "bg-sidebar" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    state.settings.practiceProblemsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Export All Data as JSON
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              Clear All Local Settings
            </button>
          </div>
        </div>

        {/* About */}
        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>StudySet v1.0.0</p>
            <p>AI-powered study tool built with Next.js and Claude.</p>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmModal
          title="Clear Settings"
          message="This will reset all your preferences to defaults. Your classes, threads, and study data will not be affected."
          confirmLabel="Clear"
          confirmVariant="danger"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
          loading={clearing}
        />
      )}
    </div>
  );
}
