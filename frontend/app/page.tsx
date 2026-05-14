import Link from "next/link";
import { Search, Lightbulb, FileText, ImageIcon, Kanban, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    href: "/research",
    icon: Search,
    title: "リサーチ",
    desc: "バズ企画・競合分析を自動収集",
    color: "from-blue-600/20 to-blue-500/5",
    border: "border-blue-500/30",
  },
  {
    href: "/planning",
    icon: Lightbulb,
    title: "企画生成",
    desc: "AIがリサーチを元に企画・タイトルを立案",
    color: "from-purple-600/20 to-purple-500/5",
    border: "border-purple-500/30",
  },
  {
    href: "/script",
    icon: FileText,
    title: "台本生成",
    desc: "10〜25分のフル台本を自動生成",
    color: "from-green-600/20 to-green-500/5",
    border: "border-green-500/30",
  },
  {
    href: "/thumbnail",
    icon: ImageIcon,
    title: "サムネ生成",
    desc: "テキスト案＋DALL-E画像を自動生成",
    color: "from-yellow-600/20 to-yellow-500/5",
    border: "border-yellow-500/30",
  },
  {
    href: "/direction",
    icon: Kanban,
    title: "ディレクション",
    desc: "タスク管理・進行・Discord通知",
    color: "from-red-600/20 to-red-500/5",
    border: "border-red-500/30",
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">
          YouTube Director Tool
        </h1>
        <p className="text-slate-400 text-sm lg:text-lg">
          ディレクター業務の<span className="text-accent-light font-semibold">90%</span>を削減するAIワークフロー
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {FEATURES.map(({ href, icon: Icon, title, desc, color, border }) => (
          <Link
            key={href}
            href={href}
            className={`group relative bg-gradient-to-br ${color} border ${border} rounded-xl lg:rounded-2xl p-4 lg:p-6 active:scale-[0.98] hover:scale-[1.02] transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-3 lg:mb-4">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-white/10 flex items-center justify-center">
                <Icon size={16} className="text-white lg:hidden" />
                <Icon size={20} className="text-white hidden lg:block" />
              </div>
              <ArrowRight
                size={14}
                className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all"
              />
            </div>
            <h2 className="text-white font-semibold text-sm lg:text-lg mb-0.5 lg:mb-1">{title}</h2>
            <p className="text-slate-400 text-xs lg:text-sm hidden sm:block">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 lg:mt-10 bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6">
        <h2 className="text-white font-semibold mb-3 lg:mb-4 text-sm lg:text-base">推奨ワークフロー</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 lg:gap-3 items-start sm:items-center text-xs lg:text-sm text-slate-400">
          {["リサーチ", "企画生成", "台本生成", "サムネ生成", "ディレクション"].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-surface-hover rounded-full text-slate-300">
                {i + 1}. {step}
              </span>
              {i < 4 && <span className="text-slate-600 hidden sm:inline">→</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
