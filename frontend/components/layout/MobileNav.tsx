"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Clapperboard, FlaskConical, Shield, LogOut } from "lucide-react";
import { NAV } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useMockMode } from "@/hooks/useMockMode";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV.find((n) => pathname.startsWith(n.href));
  const { mockServices, dismissed, setDismissed } = useMockMode();
  const showBanner = !dismissed && mockServices.length > 0;
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <>
      {/* Header bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-50 bg-surface-card border-b border-surface-border px-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover active:bg-surface-hover transition-colors flex-shrink-0"
          aria-label="メニューを開く"
        >
          <Menu size={20} />
        </button>
        <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center flex-shrink-0">
          <Clapperboard size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 leading-none mb-0.5">Director Tool v2</p>
          <p className="text-sm font-semibold text-white truncate">
            {current?.label ?? "ホーム"}
          </p>
        </div>
      </header>

      {/* モックバナー */}
      {showBanner && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-400 text-xs min-w-0">
            <FlaskConical size={13} className="flex-shrink-0" />
            <span className="font-medium flex-shrink-0">モックモード</span>
            <span className="text-yellow-500/70 truncate">
              {mockServices.join(" / ")}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-500/60 hover:text-yellow-400 ml-3 flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-64 bg-surface-card border-r border-surface-border z-[70] flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Clapperboard size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Director Tool</p>
              <p className="text-[10px] text-slate-500">v2.0</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover active:bg-surface-hover transition-colors"
            aria-label="メニューを閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-accent/20 text-accent-light"
                    : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
              )}
            >
              <Shield size={18} />
              管理者パネル
            </Link>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-surface-border">
          {user && (
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0"
                title="ログアウト"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-600 text-center">
            Powered by Claude + YouTube API
          </p>
        </div>
      </aside>
    </>
  );
}
