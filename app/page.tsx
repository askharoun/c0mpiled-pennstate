"use client";

import { useStore } from "@/lib/store";
import { Plus, BookOpen, Upload } from "lucide-react";
import { useState } from "react";
import AddClassModal from "@/components/AddClassModal";

export default function Home() {
  const { state } = useStore();
  const [showAddClass, setShowAddClass] = useState(false);

  if (state.classes.length === 0) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-sidebar/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-sidebar" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to StudySet</h1>
            <p className="text-gray-500 mb-6">
              Add your first class and upload a syllabus to get started with AI-powered study sessions tailored to your coursework.
            </p>
            <button
              onClick={() => setShowAddClass(true)}
              className="px-6 py-3 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              Add Your First Class
            </button>
          </div>
        </div>
        {showAddClass && <AddClassModal onClose={() => setShowAddClass(false)} />}
      </>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All Resources</h1>
        <p className="text-gray-500 mb-8">Select a class from the sidebar, or add a new syllabus.</p>

        <div className="grid gap-4">
          {state.classes.map((cls) => {
            const classThreads = state.threads.filter((t) => t.class_id === cls.id);
            return (
              <a
                key={cls.id}
                href={`/class/${cls.id}`}
                className="block p-5 border rounded-xl hover:border-olive-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {classThreads.length} thread{classThreads.length !== 1 ? "s" : ""}
                      {cls.syllabus_text ? " · Syllabus uploaded" : " · No syllabus"}
                    </p>
                  </div>
                  {!cls.syllabus_text && (
                    <span className="text-xs text-olive-600 flex items-center gap-1">
                      <Upload size={12} />
                      Upload syllabus
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
