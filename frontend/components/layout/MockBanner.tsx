"use client";
import { FlaskConical, X } from "lucide-react";
import { useMockMode } from "@/hooks/useMockMode";

// PC専用バナー。モバイルは MobileNav 内で描画する。
export default function MockBanner() {
  const { mockServices, dismissed, setDismissed } = useMockMode();

  if (dismissed || mockServices.length === 0) return null;

  return (
    <div className="hidden lg:flex fixed top-0 left-60 right-0 z-40 bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-2 items-center justify-between">
      <div className="flex items-center gap-2 text-yellow-400 text-xs">
        <FlaskConical size={13} />
        <span className="font-medium">モックモード稼働中</span>
        <span className="text-yellow-500/70">
          — {mockServices.join(" / ")} はダミーデータを使用しています。
          APIキーを設定すると本番データで動作します。
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-500/60 hover:text-yellow-400 ml-4 flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}
