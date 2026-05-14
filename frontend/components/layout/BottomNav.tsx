"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV } from "./Sidebar";

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-card border-t border-surface-border">
      <div className="flex items-stretch">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-accent-light"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="truncate w-full text-center px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
