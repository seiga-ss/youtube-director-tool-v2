import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const DATE_RANGE_OPTIONS = [
  { value: "1m", label: "1ヶ月" },
  { value: "3m", label: "3ヶ月" },
  { value: "6m", label: "6ヶ月" },
  { value: "1y", label: "1年" },
  { value: "2y", label: "2年" },
];

export const VIDEO_TYPE_OPTIONS = [
  { value: "both", label: "両方" },
  { value: "long", label: "ロング動画" },
  { value: "short", label: "ショート動画" },
];

export const STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-500/20 text-blue-300",
  scripting: "bg-purple-500/20 text-purple-300",
  filming: "bg-yellow-500/20 text-yellow-300",
  editing: "bg-orange-500/20 text-orange-300",
  reviewing: "bg-pink-500/20 text-pink-300",
  done: "bg-green-500/20 text-green-300",
  todo: "bg-gray-500/20 text-gray-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  review: "bg-yellow-500/20 text-yellow-300",
};

export const STATUS_LABELS: Record<string, string> = {
  planning: "企画中",
  scripting: "台本制作",
  filming: "撮影",
  editing: "編集",
  reviewing: "確認中",
  done: "完了",
  todo: "未着手",
  in_progress: "進行中",
  review: "確認待ち",
};
