"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useStore } from "@/lib/store";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAuthPage || !state.user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static z-50 transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center px-4 py-3 border-b">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold text-gray-900">StudySet</span>
        </div>
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </div>
  );
}
