"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  BookOpen,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  LogOut,
  Trash2,
  LayoutDashboard,
  Calendar,
  Settings,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import AddClassModal from "./AddClassModal";
import ConfirmModal from "./ConfirmModal";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const { state, dispatch, deleteClass, deleteThread } = useStore();
  const router = useRouter();
  const [classesExpanded, setClassesExpanded] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "class" | "thread"; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const recentThreads = [...state.threads]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  const filteredThreads = searchQuery
    ? recentThreads.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentThreads;

  function navigate(path: string) {
    router.push(path);
    onCloseMobile?.();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "class") {
        await deleteClass(deleteTarget.id);
        navigate("/");
      } else {
        await deleteThread(deleteTarget.id);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  }

  return (
    <>
      <aside className="w-64 bg-sidebar text-white flex flex-col h-screen flex-shrink-0">
        {/* Top actions */}
        <div className="p-4 space-y-1">
          <button
            onClick={() => {
              if (state.activeClassId) {
                navigate(`/class/${state.activeClassId}`);
              }
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <Search size={18} />
            <span>Search Chats</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <BookOpen size={18} />
            <span>All Resources</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate("/planner")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <Calendar size={18} />
            <span>Study Planner</span>
          </button>
        </div>

        {showSearch && (
          <div className="px-4 pb-2">
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-white/10 text-white text-sm placeholder-white/50 outline-none focus:ring-1 focus:ring-white/30"
              autoFocus
            />
          </div>
        )}

        {/* Classes */}
        <div className="px-4 mt-4">
          <button
            onClick={() => setClassesExpanded(!classesExpanded)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
          >
            <span>Classes</span>
            {classesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {classesExpanded && (
            <div className="mt-2 space-y-0.5">
              {state.classes.map((cls) => (
                <div key={cls.id} className="group flex items-center">
                  <button
                    onClick={() => {
                      dispatch({ type: "SET_ACTIVE_CLASS", payload: cls.id });
                      navigate(`/class/${cls.id}`);
                    }}
                    className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-l text-sm transition-colors ${
                      state.activeClassId === cls.id
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <FolderOpen size={15} className="flex-shrink-0" />
                    <span className="truncate">{cls.name}</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: "class", id: cls.id, name: cls.name })}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-white/40 hover:text-red-400 transition-all"
                    title="Delete class"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowAddClass(true)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <Plus size={15} />
                <span>Add a class</span>
              </button>
            </div>
          )}
        </div>

        {/* Recent Threads */}
        <div className="px-4 mt-6 flex-1 overflow-y-auto sidebar-scroll">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Recent Threads
          </h3>
          <div className="mt-2 space-y-0.5">
            {filteredThreads.map((thread) => (
              <div key={thread.id} className="group flex items-center">
                <button
                  onClick={() => {
                    dispatch({ type: "SET_ACTIVE_CLASS", payload: thread.class_id });
                    dispatch({ type: "SET_ACTIVE_THREAD", payload: thread.id });
                    navigate(`/class/${thread.class_id}/thread/${thread.id}`);
                  }}
                  className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-l text-sm transition-colors ${
                    state.activeThreadId === thread.id
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="truncate">{thread.title}</span>
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: "thread", id: thread.id, name: thread.title })}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-white/40 hover:text-red-400 transition-all"
                  title="Delete thread"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {filteredThreads.length === 0 && (
              <p className="text-xs text-white/40 px-3 py-2">
                {searchQuery ? "No matching threads" : "No threads yet"}
              </p>
            )}
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-sm flex-1 min-w-0">
              <div className="font-medium truncate">{state.user?.email || "Student"}</div>
              <button
                onClick={() => navigate("/settings")}
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Settings
              </button>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="text-white/40 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleSignOut}
              className="text-white/40 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {showAddClass && <AddClassModal onClose={() => setShowAddClass(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete ${deleteTarget.type === "class" ? "Class" : "Thread"}`}
          message={`Are you sure you want to delete "${deleteTarget.name}"? ${
            deleteTarget.type === "class"
              ? "This will also delete all threads in this class."
              : "This cannot be undone."
          }`}
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}
