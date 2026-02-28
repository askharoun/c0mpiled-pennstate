"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function AddClassModal({ onClose }: { onClose: () => void }) {
  const { addClass } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a class name");
      return;
    }

    setLoading(true);
    setError("");

    let syllabusText = "";

    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/parse-syllabus", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to parse syllabus");
        const data = await res.json();
        syllabusText = data.text;
      } catch {
        setError("Failed to parse PDF. Please try again.");
        setLoading(false);
        return;
      }
    }

    try {
      const cls = await addClass(name.trim(), syllabusText);
      router.push(`/class/${cls.id}`);
      onClose();
    } catch {
      setError("Failed to create class. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add a Class</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., ECON 447"
              className="w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Syllabus (PDF)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-gray-500 hover:border-olive-500 hover:text-olive-600 transition-colors"
            >
              {file ? (
                <>
                  <FileText size={24} className="text-olive-600" />
                  <span className="text-sm text-olive-600 font-medium">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span className="text-sm">Click to upload PDF</span>
                </>
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-sidebar text-white rounded-lg hover:bg-sidebar-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Adding..." : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
