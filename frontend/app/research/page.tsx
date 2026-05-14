"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, ExternalLink, RefreshCw, TrendingUp, Users, Eye, ChevronLeft, CalendarDays, MessageCircle, FileText, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  startResearch,
  listResearchSessions,
  getResearchSession,
  deleteResearchSession,
} from "@/lib/api";
import { formatNumber, formatDuration, DATE_RANGE_OPTIONS, VIDEO_TYPE_OPTIONS } from "@/lib/utils";

export default function ResearchPage() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState("1y");
  const [videoType, setVideoType] = useState("both");
  const [maxResults, setMaxResults] = useState(20);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [expandedVideoId, setExpandedVideoId] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["research-sessions"],
    queryFn: listResearchSessions,
    refetchInterval: 5000,
  });

  const { data: sessionDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["research-session", selectedSessionId],
    queryFn: () => getResearchSession(selectedSessionId!),
    enabled: !!selectedSessionId,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 3000 : false,
  });

  const startMutation = useMutation({
    mutationFn: startResearch,
    onSuccess: (data) => {
      toast.success("リサーチを開始しました");
      setSelectedSessionId(data.session_id);
      qc.invalidateQueries({ queryKey: ["research-sessions"] });
    },
    onError: () => toast.error("リサーチの開始に失敗しました"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResearchSession,
    onSuccess: () => {
      toast.success("削除しました");
      setSelectedSessionId(null);
      qc.invalidateQueries({ queryKey: ["research-sessions"] });
    },
  });

  const handleStart = () => {
    if (!keyword.trim()) return toast.error("キーワードを入力してください");
    startMutation.mutate({ keyword, date_range: dateRange, video_type: videoType, max_results: maxResults });
  };

  const toggleVideoExpand = (videoId: number) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  return (
    <div>
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">リサーチ</h1>
        <p className="text-slate-400 text-xs lg:text-sm">バズ企画・競合動画を自動収集・分析</p>
      </div>

      {/* Search Form */}
      <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-4 lg:p-6 mb-4 lg:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1.5">検索キーワード</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="例: ダイエット, プログラミング, 投資..."
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">期間</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              {DATE_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">動画タイプ</label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
            >
              {VIDEO_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">取得数: {maxResults}</label>
            <input
              type="range" min={5} max={50} step={5}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={startMutation.isPending}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {startMutation.isPending ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Search size={15} />
          )}
          リサーチ開始
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Session List */}
        <div className={`lg:col-span-1 ${selectedSessionId ? "hidden lg:block" : "block"}`}>
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            リサーチ履歴
          </h2>
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={`bg-surface-card border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedSessionId === s.id
                    ? "border-accent"
                    : "border-surface-border hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white truncate">{s.keyword}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      s.status === "done"
                        ? "bg-green-500/20 text-green-400"
                        : s.status === "running"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {s.status === "done" ? "完了" : s.status === "running" ? "実行中" : "エラー"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {s.video_count}件 · {s.date_range} · {s.video_type}
                </p>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">履歴なし</p>
            )}
          </div>
        </div>

        {/* Session Detail */}
        <div className={`lg:col-span-2 ${!selectedSessionId ? "hidden lg:block" : "block"}`}>
          {!selectedSessionId && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
              <Search size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">左でセッションを選択</p>
            </div>
          )}

          {selectedSessionId && sessionDetail && (
            <div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="lg:hidden flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 active:text-white"
              >
                <ChevronLeft size={14} />
                リサーチ一覧に戻る
              </button>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    「{sessionDetail.keyword}」の結果
                  </h2>
                  {sessionDetail.status === "running" && (
                    <p className="text-yellow-400 text-xs flex items-center gap-1 mt-1">
                      <RefreshCw size={11} className="animate-spin" /> 収集中...
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(selectedSessionId)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Channel Ratio */}
              {sessionDetail.channel_ratio && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">ロング動画</p>
                    <p className="text-white font-semibold">{sessionDetail.channel_ratio.long.count}件</p>
                    <p className="text-xs text-slate-500">{formatNumber(sessionDetail.channel_ratio.long.total_views)} views</p>
                  </div>
                  <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                    <p className="text-xs text-slate-400 mb-1">ショート動画</p>
                    <p className="text-white font-semibold">{sessionDetail.channel_ratio.short.count}件</p>
                    <p className="text-xs text-slate-500">{formatNumber(sessionDetail.channel_ratio.short.total_views)} views</p>
                  </div>
                </div>
              )}

              {/* Videos */}
              <div className="space-y-3">
                {sessionDetail.videos?.map((v: any) => (
                  <div key={v.id} className="bg-surface-card border border-surface-border rounded-xl p-3 lg:p-4">
                    <div className="flex gap-2 lg:gap-3">
                      {v.thumbnail_url && (
                        <div className="flex-shrink-0 w-24 h-[54px] lg:w-28 lg:h-16 relative rounded-lg overflow-hidden bg-surface">
                          <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs lg:text-sm font-medium text-white leading-snug line-clamp-2">
                            {v.title}
                          </p>
                          <a
                            href={`https://www.youtube.com/watch?v=${v.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-slate-500 hover:text-accent-light"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 lg:mt-1">{v.channel_name}</p>
                        <div className="flex flex-wrap gap-2 lg:gap-3 mt-1.5 lg:mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Eye size={11} /> {formatNumber(v.view_count)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Users size={11} /> {formatNumber(v.subscriber_count)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                            <TrendingUp size={11} /> {v.viral_rate}x
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDuration(v.duration_seconds)}
                          </span>
                          {v.published_at ? (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <CalendarDays size={11} /> {new Date(v.published_at).toLocaleDateString('ja-JP')}
                            </span>
                          ) : null}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            v.video_type === "short"
                              ? "bg-pink-500/20 text-pink-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {v.video_type === "short" ? "ショート" : "ロング"}
                          </span>
                        </div>
                        {v.summary && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{v.summary}</p>
                        )}
                      </div>
                    </div>

                    {/* Expandable: Comments + Transcript */}
                    {(v.top_comments?.length > 0 || v.transcript) && (
                      <div className="mt-3 border-t border-surface-border pt-3">
                        <button
                          onClick={() => toggleVideoExpand(v.id)}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <MessageCircle size={12} />
                          <span>コメント {v.top_comments?.length ?? 0}件</span>
                          {v.transcript && (
                            <>
                              <span className="text-slate-600">·</span>
                              <FileText size={12} />
                              <span>文字おこし</span>
                            </>
                          )}
                          <ChevronDown
                            size={12}
                            className={`ml-1 transition-transform ${expandedVideoId === v.id ? "rotate-180" : ""}`}
                          />
                        </button>

                        {expandedVideoId === v.id && (
                          <div className="mt-3 space-y-3">
                            {/* Top Comments */}
                            {v.top_comments?.length > 0 && (
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                  人気コメント
                                </p>
                                <div className="space-y-2">
                                  {v.top_comments.slice(0, 5).map((c: any, i: number) => (
                                    <div key={i} className="bg-surface rounded-lg p-2.5">
                                      <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                                      <p className="text-[10px] text-slate-500 mt-1">
                                        👍 {formatNumber(c.likes)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Transcript */}
                            {v.transcript && (
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                  文字おこし
                                </p>
                                <div className="bg-surface rounded-lg p-3 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                    {v.transcript}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
