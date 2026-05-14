"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lightbulb, ChevronDown, ThumbsUp, ThumbsDown, Loader2, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import { generatePlanning, listResearchSessions, analyzeChannel } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function PlanningPage() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pastAnalysis, setPastAnalysis] = useState("");
  const [result, setResult] = useState<any>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [channelAnalysis, setChannelAnalysis] = useState<string | null>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ["research-sessions"],
    queryFn: listResearchSessions,
  });

  const doneSessions = sessions.filter((s: any) => s.status === "done");

  const mutation = useMutation({
    mutationFn: generatePlanning,
    onSuccess: (data) => {
      setResult(data);
      toast.success("企画生成完了");
    },
    onError: () => toast.error("企画生成に失敗しました"),
  });

  const analyzeChannelMutation = useMutation({
    mutationFn: (sId: number) => analyzeChannel(sId),
    onSuccess: (data) => {
      setChannelAnalysis(data.analysis);
      toast.success("チャンネル分析完了");
    },
    onError: () => toast.error("チャンネル分析に失敗しました"),
  });

  const handleGenerate = () => {
    if (!sessionId) return toast.error("リサーチセッションを選択してください");
    mutation.mutate({ session_id: sessionId, past_analysis: pastAnalysis });
  };

  return (
    <div>
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">企画生成</h1>
        <p className="text-slate-400 text-xs lg:text-sm">リサーチ結果からバズる企画をAIが立案</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">リサーチセッション</label>
            <select
              value={sessionId || ""}
              onChange={(e) => setSessionId(Number(e.target.value) || null)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              <option value="">選択してください</option>
              {doneSessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.keyword} ({s.video_count}件)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              過去チャンネル分析（任意）
            </label>
            <textarea
              value={pastAnalysis}
              onChange={(e) => setPastAnalysis(e.target.value)}
              placeholder="自チャンネルの傾向・過去伸びた企画など"
              rows={1}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {mutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Lightbulb size={15} />
            )}
            企画生成
          </button>
          <button
            onClick={() => sessionId && analyzeChannelMutation.mutate(sessionId)}
            disabled={!sessionId || analyzeChannelMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {analyzeChannelMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <BarChart2 size={15} />
            )}
            チャンネル動画を分析
          </button>
        </div>
      </div>

      {mutation.isPending && (
        <div className="text-center py-12 text-slate-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-3 text-purple-400" />
          <p>AIが企画を立案中...</p>
        </div>
      )}

      {/* Channel Analysis */}
      {channelAnalysis && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5 mb-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-3">
            <BarChart2 size={15} />
            チャンネル分析
          </h2>
          <div className="prose-dark text-slate-300 text-sm leading-relaxed">
            <ReactMarkdown>{channelAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Insights */}
          {result.insights && (
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-purple-300 mb-2">戦略インサイト</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{result.insights}</p>
            </div>
          )}

          {/* Hit Concepts */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <ThumbsUp size={16} className="text-green-400" />
              推奨企画 ({result.hit_concepts?.length || 0}案)
            </h2>
            <div className="space-y-3">
              {result.hit_concepts?.map((concept: any, i: number) => (
                <div
                  key={i}
                  className="bg-surface-card border border-surface-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{concept.concept}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{concept.reason}</p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform flex-shrink-0 ml-3 ${
                        expandedIndex === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedIndex === i && (
                    <div className="px-4 pb-4 space-y-3 border-t border-surface-border pt-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1.5">タイトル案</p>
                        <div className="space-y-1.5">
                          {concept.titles?.map((title: string, j: number) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className="text-accent-light text-xs mt-0.5 flex-shrink-0">
                                {j + 1}.
                              </span>
                              <p className="text-sm text-slate-200">{title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {concept.hook && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                          <p className="text-xs text-yellow-400 mb-1">冒頭の掴み案</p>
                          <p className="text-sm text-slate-200">{concept.hook}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Avoid Concepts */}
          {result.avoid_concepts?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <ThumbsDown size={16} className="text-red-400" />
                避けるべき企画 ({result.avoid_concepts.length}案)
              </h2>
              <div className="space-y-2">
                {result.avoid_concepts.map((concept: any, i: number) => (
                  <div
                    key={i}
                    className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                  >
                    <p className="text-sm text-slate-300">{concept.concept}</p>
                    <p className="text-xs text-red-400 mt-1">{concept.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
