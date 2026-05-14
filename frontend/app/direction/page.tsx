"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Kanban, Plus, X, ChevronRight, ChevronLeft, MessageSquare,
  Loader2, Trash2, Edit2, Check, Link2
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listProjects, createProject, getProject, updateProject,
  deleteProject, createTask, updateTask, deleteTask, addComment,
} from "@/lib/api";
import { STATUS_COLORS, STATUS_LABELS, cn } from "@/lib/utils";

const TASK_COLUMNS = [
  { key: "todo", label: "未着手" },
  { key: "in_progress", label: "進行中" },
  { key: "review", label: "確認待ち" },
  { key: "done", label: "完了" },
];

const PROJECT_STATUSES = ["planning", "scripting", "filming", "editing", "reviewing", "done"];

export default function DirectionPage() {
  const qc = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectConcept, setNewProjectConcept] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingVideoUrl, setEditingVideoUrl] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    refetchInterval: 10000,
  });

  const { data: projectDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["project", selectedProjectId],
    queryFn: () => getProject(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProjectId(data.id);
      setShowNewProject(false);
      setNewProjectTitle("");
      setNewProjectConcept("");
      toast.success("プロジェクトを作成しました");
    },
    onError: () => toast.error("作成に失敗しました"),
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      refetchDetail();
      setEditingStatus(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProjectId(null);
      toast.success("削除しました");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: any }) =>
      createTask(projectId, data),
    onSuccess: () => {
      refetchDetail();
      setShowNewTask(false);
      setNewTaskTitle("");
      setNewTaskAssignee("");
      toast.success("タスクを追加しました");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ projectId, taskId, data }: { projectId: number; taskId: number; data: any }) =>
      updateTask(projectId, taskId, data),
    onSuccess: () => refetchDetail(),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: number; taskId: number }) =>
      deleteTask(projectId, taskId),
    onSuccess: () => refetchDetail(),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: number; data: any }) =>
      addComment(projectId, data),
    onSuccess: () => {
      refetchDetail();
      setCommentText("");
    },
  });

  const tasksByStatus = (status: string) =>
    (projectDetail?.tasks || []).filter((t: any) => t.status === status);

  return (
    <div>
      <div className="mb-5 lg:mb-8 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">ディレクション管理</h1>
          <p className="text-slate-400 text-xs lg:text-sm">プロジェクト・タスク管理 / Discord通知</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex-shrink-0 flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">新規プロジェクト</span>
        </button>
      </div>

      {showNewProject && (
        <div className="bg-surface-card border border-accent/40 rounded-xl lg:rounded-2xl p-3 lg:p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">新規プロジェクト</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="プロジェクト名（動画タイトル）"
              className="bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
            <input
              value={newProjectConcept}
              onChange={(e) => setNewProjectConcept(e.target.value)}
              placeholder="企画概要（任意）"
              className="bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                createProjectMutation.mutate({ title: newProjectTitle, concept: newProjectConcept })
              }
              disabled={createProjectMutation.isPending || !newProjectTitle.trim()}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-dark disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {createProjectMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              作成
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className={`lg:col-span-1 ${selectedProjectId ? "hidden lg:block" : "block"}`}>
          <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            プロジェクト一覧 ({projects.length})
          </h2>
          <div className="space-y-2">
            {projects.map((p: any) => {
              const progress = p.task_count > 0
                ? Math.round((p.done_task_count / p.task_count) * 100)
                : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={cn(
                    "bg-surface-card border rounded-xl p-4 cursor-pointer transition-all",
                    selectedProjectId === p.id
                      ? "border-accent"
                      : "border-surface-border hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white truncate flex-1">{p.title}</p>
                    <ChevronRight size={14} className="text-slate-500 flex-shrink-0 ml-1" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full", STATUS_COLORS[p.status])}>
                      {STATUS_LABELS[p.status]}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {p.done_task_count}/{p.task_count} タスク
                    </span>
                  </div>
                  {p.task_count > 0 && (
                    <div className="h-1 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="text-center py-10">
                <Kanban size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">プロジェクトなし</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Detail */}
        <div className={`lg:col-span-2 ${!selectedProjectId ? "hidden lg:block" : "block"}`}>
          {!selectedProjectId && (
            <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center">
              <Kanban size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">左でプロジェクトを選択してください</p>
            </div>
          )}

          {selectedProjectId && projectDetail && (
            <div className="space-y-5">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="lg:hidden flex items-center gap-1.5 text-xs text-slate-400 hover:text-white active:text-white"
              >
                <ChevronLeft size={14} />
                プロジェクト一覧に戻る
              </button>
              {/* Header */}
              <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex-1 mr-3">
                    {projectDetail.title}
                  </h2>
                  <button
                    onClick={() => {
                      if (confirm("削除しますか？")) deleteProjectMutation.mutate(selectedProjectId);
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {projectDetail.concept && (
                  <p className="text-sm text-slate-400 mb-3">{projectDetail.concept}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {editingStatus ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={projectDetail.status}
                        onChange={(e) =>
                          updateProjectMutation.mutate({
                            id: selectedProjectId,
                            data: { status: e.target.value },
                          })
                        }
                        className="bg-surface border border-surface-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                      >
                        {PROJECT_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button onClick={() => setEditingStatus(false)} className="text-slate-500 hover:text-white">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingStatus(true)}
                      className={cn("text-xs px-2.5 py-1 rounded-full flex items-center gap-1", STATUS_COLORS[projectDetail.status])}
                    >
                      {STATUS_LABELS[projectDetail.status]}
                      <Edit2 size={10} />
                    </button>
                  )}
                  {projectDetail.notion_page_id && (
                    <span className="text-[10px] text-slate-500 bg-surface px-2 py-1 rounded-full">
                      Notion連携済み
                    </span>
                  )}
                </div>

                {/* 完成動画URL */}
                <div className="mt-3 pt-3 border-t border-surface-border">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">完成動画URL</p>
                  {editingVideoUrl ? (
                    <div className="flex gap-2">
                      <input
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => {
                          updateProjectMutation.mutate({
                            id: selectedProjectId!,
                            data: { video_url: videoUrlInput },
                          });
                          setEditingVideoUrl(false);
                        }}
                        className="bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditingVideoUrl(false)} className="text-slate-500 hover:text-white px-2 py-1.5 rounded-lg transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ) : projectDetail.video_url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={projectDetail.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 truncate max-w-xs"
                      >
                        <Link2 size={12} />
                        {projectDetail.video_url}
                      </a>
                      <button
                        onClick={() => { setVideoUrlInput(projectDetail.video_url || ""); setEditingVideoUrl(true); }}
                        className="text-slate-500 hover:text-white flex-shrink-0"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setVideoUrlInput(""); setEditingVideoUrl(true); }}
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={12} />
                      動画URLを登録
                    </button>
                  )}
                </div>
              </div>

              {/* Kanban Board */}
              <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">タスク管理</h3>
                  <button
                    onClick={() => setShowNewTask(!showNewTask)}
                    className="flex items-center gap-1.5 text-xs text-accent-light hover:text-white px-2.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
                  >
                    <Plus size={12} />タスク追加
                  </button>
                </div>

                {showNewTask && (
                  <div className="bg-surface rounded-xl p-3 mb-4 flex gap-2 flex-wrap">
                    <input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="タスク名"
                      className="flex-1 min-w-0 bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                    />
                    <input
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="担当者"
                      className="w-28 bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                    />
                    <button
                      onClick={() =>
                        createTaskMutation.mutate({
                          projectId: selectedProjectId,
                          data: { title: newTaskTitle, assignee: newTaskAssignee },
                        })
                      }
                      disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                      className="bg-accent hover:bg-accent-dark disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setShowNewTask(false)}
                      className="text-slate-500 hover:text-white px-2 py-2 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TASK_COLUMNS.map((col) => (
                    <div key={col.key}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-400">{col.label}</p>
                        <span className="text-[10px] text-slate-600 bg-surface px-1.5 py-0.5 rounded">
                          {tasksByStatus(col.key).length}
                        </span>
                      </div>
                      <div className="space-y-2 min-h-[60px]">
                        {tasksByStatus(col.key).map((task: any) => (
                          <div
                            key={task.id}
                            className="bg-surface rounded-lg p-2.5 group"
                          >
                            <p className="text-xs text-white mb-1 leading-snug">{task.title}</p>
                            {task.assignee && (
                              <p className="text-[10px] text-slate-500">{task.assignee}</p>
                            )}
                            <div className="flex items-center gap-1 mt-2 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity">
                              {TASK_COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                                <button
                                  key={c.key}
                                  onClick={() =>
                                    updateTaskMutation.mutate({
                                      projectId: selectedProjectId,
                                      taskId: task.id,
                                      data: { status: c.key },
                                    })
                                  }
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded transition-colors",
                                    STATUS_COLORS[c.key]
                                  )}
                                  title={`→ ${c.label}`}
                                >
                                  {c.label[0]}
                                </button>
                              ))}
                              <button
                                onClick={() =>
                                  deleteTaskMutation.mutate({
                                    projectId: selectedProjectId,
                                    taskId: task.id,
                                  })
                                }
                                className="ml-auto text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-surface-card border border-surface-border rounded-xl lg:rounded-2xl p-3 lg:p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400" />
                  コメント・連絡事項
                </h3>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {projectDetail.comments?.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-xs text-accent-light font-medium">
                        {c.author[0]}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-0.5">{c.author}</p>
                        <p className="text-sm text-slate-200 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {projectDetail.comments?.length === 0 && (
                    <p className="text-slate-500 text-xs">コメントなし</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        addCommentMutation.mutate({
                          projectId: selectedProjectId,
                          data: { content: commentText },
                        });
                      }
                    }}
                    placeholder="コメントを入力（Enterで送信）"
                    className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() =>
                      addCommentMutation.mutate({
                        projectId: selectedProjectId,
                        data: { content: commentText },
                      })
                    }
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="bg-accent hover:bg-accent-dark disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
