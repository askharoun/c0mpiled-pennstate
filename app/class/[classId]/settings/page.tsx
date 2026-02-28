"use client";

import { Settings } from "lucide-react";

export default function ClassSettingsPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-sidebar/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Settings size={32} className="text-sidebar" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Class Settings</h1>
        <p className="text-gray-500">
          Class configuration options will appear here soon.
        </p>
      </div>
    </div>
  );
}
