"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Wand2, Copy, Check, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { generateScript, refineScript, listScripts, listProjects, saveScriptToNotion } from "@/lib/api";
import { useMockMode } from "@/hooks/useMockMode";

export default function ScriptPage() {
  const { mockServices } = useMockMode();
  const notionMocked = mockServices.includes("Notion");
  const [concept, setConcept] = useState("");
  const [titles, setTitles] = useState(["", "", ""]);
  const [researchSummary, setResearchSummary] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRefine, setShowRefine] = useState(false);

  const { data: scripts = [], refetch } = useQuery({
    queryKey: ["scripts"],
    queryFn: () => listScripts(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const generateMutation = useMutation({
    mutationFn: generateScript,
    onSuccess: (data) => {
      setCurrentScript(data);
      toast.success("台本を生成しました");
      refetch();
    },
    onError: () => toast.error("台本生成に失敗しました"),
  });

  const saveNotionMutation = useMutation({
    mutationFn: ({ scriptId }: { scriptId: number }) =>
      saveScriptToNotion(scriptId),
    onSuccess: () => toast.success("Notionに保存しました"),
    onError: () => toast.error("Notion保存に失敗しました"),
  });

  const refineMutation = useMutation({
    mutationFn: ({ id, fb }: { id: number; fb: string }) => refineScript(id, fb),
    onSuccess: (data) => {
      setCurrentScript(data);
      setFeedback("");
      setShowRefine(false);
      toast.success(`v${data.version} に更新しました`);
    },
    onError: () => toast.error("ブラッシュアップに失敗しました"),
  });

  const handleGenerate = () => {
    if (!concept.trim()) return toast.error("企画概要を入力してください");
    const validTitles = titles.filter((t) => t.trim());
    if (validTitles.length === 0) return toast.error("タイトル案を1つ以上入力してください");
    generateMutation.mutate({
      concept,
      titles: validTitles,
      research_summary: researchSummary,
      target_minutes: targetMinutes,
      project_id: selectedProjectId ?? undefined,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript?.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">台本生成</h1>
        <p className="text-slate-400 text-xs lg:text-sm">フル台本の自動生成・ブラッシュアップ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">企画情報</h2>

            <div className="space-y-4">
              {projects.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">プロジェクトに紐付ける（任意）</label>
                  <select
                    value={selectedProjectId ?? ""}
                    onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">なし</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">企画概要</label>
                <textarea
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="例: 月5万円貯めるための節約術を、実際に試した体験談と共に紹介する"
                  rows={3}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">タイトル案</label>
                <div className="space-y-2">
                  {titles.map((title, i) => (
                    <input
                      key={i}
                      value={title}
                      onChange={(e) => {
                        const next = [...titles];
                        next[i] = e.target.value;
                        setTitles(next);
                      }}
                      placeholder={`タイトル案 ${i + 1}`}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  目標尺: {targetMinutes}分
                </label>
                <input
                  type="range" min={10} max={25} step={1}
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>10分</span><span>25分</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  リサーチ情報（任意）
                </label>
                <textarea
                  value={researchSummary}
                  onChange={(e) => setResearchSummary(e.target.value)}
                  placeholder="視聴者ニーズ・競合で伸びているポイントなど"
                  rows={2}
                  className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {generateMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileText size={15} />
              )}
              台本生成
            </button>
          </div>

          {/* Script History */}
          {scripts.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-4">
              <h2 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                生成履歴
              </h2>
              <div className="space-y-2">
                {scripts.slice(0, 5).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      const { getScript } = await import("@/lib/api");
                      const data = await getScript(s.id);
                      setCurrentScript(data);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                  >
                    <p className="text-xs text-white line-clamp-1">{s.concept}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      v{s.version} · {s.target_duration_minutes}分
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Script Output */}
        <div>
          {(generateMutation.isPending) && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-3 text-green-400" />
              <p className="text-slate-400">台本を生成中（1〜2分かかります）...</p>
            </div>
          )}

          {currentScript && !generateMutation.isPending && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-green-400" />
                  <span className="text-sm font-medium text-white">
                    台本 v{currentScript.version}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (notionMocked) {
                        toast.error("Notionキーが未設定です");
                        return;
                      }
                      saveNotionMutation.mutate({ scriptId: currentScript.id });
                    }}
                    disabled={saveNotionMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
                  >
                    {saveNotionMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                    Notionに保存
                  </button>
                  <button
                    onClick={() => setShowRefine(!showRefine)}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                  >
                    <Wand2 size={12} />
                    ブラッシュアップ
                  </button>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                    {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {showRefine && (
                <div className="px-5 py-4 border-b border-surface-border bg-purple-500/5">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="改善指示: 例「冒頭をもっとインパクトある掴みに」「CTAを強化して」"
                    rows={2}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none mb-2"
                  />
                  <button
                    onClick={() => refineMutation.mutate({ id: currentScript.id, fb: feedback })}
                    disabled={refineMutation.isPending || !feedback.trim()}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    {refineMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    改善する
                  </button>
                </div>
              )}

              <div className="p-5 max-h-[600px] overflow-y-auto">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {currentScript.content}
                </pre>
              </div>
            </div>
          )}

          {!currentScript && !generateMutation.isPending && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center">
              <FileText size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">左から台本を生成してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
