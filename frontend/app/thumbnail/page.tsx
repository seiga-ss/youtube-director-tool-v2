"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ImageIcon, Loader2, Sparkles, Target } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { generateThumbnail, listResearchSessions, getResearchSession } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export default function ThumbnailPage() {
  const [concept, setConcept] = useState("");
  const [titles, setTitles] = useState(["", "", ""]);
  const [generateImages, setGenerateImages] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [referenceSessionId, setReferenceSessionId] = useState<number | null>(null);
  const [referenceInfo, setReferenceInfo] = useState<string[]>([]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["research-sessions"],
    queryFn: listResearchSessions,
  });

  const doneSessions = sessions.filter((s: any) => s.status === "done");

  const handleSessionSelect = async (id: number | null) => {
    setReferenceSessionId(id);
    setReferenceInfo([]);
    if (!id) return;
    try {
      const detail = await getResearchSession(id);
      const top5 = (detail.videos || [])
        .slice(0, 5)
        .map((v: any) =>
          `「${v.title}」拡散率${v.viral_rate}x 再生${formatNumber(v.view_count)} / ${v.channel_name}`
        );
      setReferenceInfo(top5);
    } catch {
      toast.error("セッション詳細の取得に失敗しました");
    }
  };

  const mutation = useMutation({
    mutationFn: generateThumbnail,
    onSuccess: (data) => {
      setResult(data);
      toast.success("サムネイル生成完了");
    },
    onError: () => toast.error("サムネイル生成に失敗しました"),
  });

  const handleGenerate = () => {
    if (!concept.trim()) return toast.error("企画概要を入力してください");
    const validTitles = titles.filter((t) => t.trim());
    mutation.mutate({
      concept,
      titles: validTitles,
      generate_images: generateImages,
      reference_thumbnails: referenceInfo.length > 0 ? referenceInfo : undefined,
    });
  };

  return (
    <div>
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">サムネイル生成</h1>
        <p className="text-slate-400 text-xs lg:text-sm">テキスト案 + DALL-E画像を自動生成</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6">
          <h2 className="text-sm font-semibold text-white mb-4">サムネイル情報</h2>

          {/* Reference Research Section */}
          <div className="mb-4 pb-4 border-b border-surface-border">
            <label className="block text-xs text-slate-400 mb-1.5">
              バズり動画を参考にする（任意）
            </label>
            <select
              value={referenceSessionId || ""}
              onChange={(e) => handleSessionSelect(Number(e.target.value) || null)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              <option value="">リサーチセッションを選択...</option>
              {doneSessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.keyword} ({s.video_count}件)
                </option>
              ))}
            </select>
            {referenceInfo.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Target size={12} className="text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-yellow-400 font-medium">
                  {referenceInfo.length}件の動画を参考中
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">企画概要</label>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="例: 月5万円貯める節約術を体験談と共に紹介"
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

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setGenerateImages(!generateImages)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  generateImages ? "bg-accent" : "bg-surface-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    generateImages ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-sm text-slate-300">DALL-E画像を生成する</span>
              <span className="text-xs text-slate-500">（OpenAI API使用）</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {mutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} />
            )}
            サムネイル生成
          </button>
        </div>

        {/* Output */}
        <div>
          {mutation.isPending && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-3 text-yellow-400" />
              <p className="text-slate-400">
                {generateImages ? "テキスト案 + 画像を生成中..." : "テキスト案を生成中..."}
              </p>
            </div>
          )}

          {result && !mutation.isPending && (
            <div className="space-y-4">
              {/* Text Copies */}
              <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                <h2 className="text-sm font-semibold text-white mb-3">テキスト案</h2>
                <div className="space-y-3">
                  {result.strategy?.text_copies?.map((copy: any, i: number) => (
                    <div key={i} className="bg-surface rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs text-accent-light font-semibold mt-0.5">{i + 1}</span>
                        <div>
                          <p className="text-white font-semibold text-base">{copy.main}</p>
                          {copy.sub && (
                            <p className="text-slate-300 text-sm mt-0.5">{copy.sub}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{copy.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Images */}
              {result.generated_thumbnails?.length > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                  <h2 className="text-sm font-semibold text-white mb-3">生成画像</h2>
                  <div className="space-y-4">
                    {result.generated_thumbnails.map((thumb: any, i: number) => (
                      <div key={i}>
                        {thumb.error ? (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                            画像生成エラー: {thumb.error}
                          </div>
                        ) : (
                          <div>
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface">
                              <Image
                                src={thumb.image_url}
                                alt={`thumbnail v${thumb.version}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              <p><span className="text-slate-400">構図:</span> {thumb.design?.layout}</p>
                              <p><span className="text-slate-400">表情:</span> {thumb.design?.person_pose}</p>
                              <p><span className="text-slate-400">カラー:</span> {thumb.design?.color_scheme}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Concepts (no image) */}
              {!generateImages && result.strategy?.design_concepts?.length > 0 && (
                <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                  <h2 className="text-sm font-semibold text-white mb-3">デザイン指示</h2>
                  <div className="space-y-3">
                    {result.strategy.design_concepts.map((d: any, i: number) => (
                      <div key={i} className="bg-surface rounded-xl p-4 text-sm">
                        <p className="text-slate-300 mb-1"><span className="text-slate-400">構図:</span> {d.layout}</p>
                        <p className="text-slate-300 mb-1"><span className="text-slate-400">人物:</span> {d.person_pose}</p>
                        <p className="text-slate-300 mb-1"><span className="text-slate-400">カラー:</span> {d.color_scheme}</p>
                        <p className="text-slate-500 text-xs mt-2 font-mono">{d.image_generation_prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && !mutation.isPending && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center">
              <ImageIcon size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">左から情報を入力して生成</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
