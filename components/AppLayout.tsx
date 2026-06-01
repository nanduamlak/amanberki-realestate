"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    // Root: full screen, horizontal split
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* LEFT: Sidebar — full height, never scrolls */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />

      {/* RIGHT: Header stacked above content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
