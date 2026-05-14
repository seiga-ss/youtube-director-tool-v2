"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Lightbulb,
  FileText,
  ImageIcon,
  Kanban,
  Clapperboard,
  Shield,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const NAV = [
  { href: "/research",   label: "リサーチ",         icon: Search },
  { href: "/planning",   label: "企画生成",          icon: Lightbulb },
  { href: "/script",     label: "台本生成",          icon: FileText },
  { href: "/thumbnail",  label: "サムネ生成",        icon: ImageIcon },
  { href: "/direction",  label: "ディレクション",    icon: Kanban },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 bg-surface-card border-r border-surface-border flex-col z-50">
      <div className="px-6 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Clapperboard size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Director Tool</p>
            <p className="text-[10px] text-slate-500">v2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-accent/20 text-accent-light"
                  : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname.startsWith("/admin")
                ? "bg-purple-500/20 text-purple-300"
                : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
            )}
          >
            <Shield size={17} />
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
  );
}
