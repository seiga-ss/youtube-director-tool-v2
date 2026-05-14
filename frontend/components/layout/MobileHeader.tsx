"use client";
import { usePathname } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { NAV } from "./Sidebar";

export default function MobileHeader() {
  const pathname = usePathname();
  const current = NAV.find((n) => pathname.startsWith(n.href));

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface-card border-b border-surface-border px-4 py-3 flex items-center gap-3">
      <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
        <Clapperboard size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 leading-none mb-0.5">Director Tool</p>
        <p className="text-sm font-semibold text-white truncate">
          {current?.label ?? "ホーム"}
        </p>
      </div>
    </header>
  );
}
