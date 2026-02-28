"use client";

import { Calendar } from "lucide-react";

export default function PlannerPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-sidebar/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Calendar size={32} className="text-sidebar" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Planner</h1>
        <p className="text-gray-500">
          Plan and schedule your study sessions here soon.
        </p>
      </div>
    </div>
  );
}
