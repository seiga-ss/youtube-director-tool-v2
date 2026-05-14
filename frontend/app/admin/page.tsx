"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Building2, Plus, Trash2, Loader2, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  listUsers, createUser, updateUser, deleteUser,
  listCompanies, createCompany, deleteCompany,
} from "@/lib/api";

type Role = "employee" | "admin" | "super_admin";

export default function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === "super_admin";

  const [tab, setTab] = useState<"users" | "companies">("users");
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "employee" as Role, company_id: "" });
  const [newCompanyName, setNewCompanyName] = useState("");

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: listCompanies,
    enabled: isSuperAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowNewUser(false);
      setNewUser({ email: "", password: "", name: "", role: "employee", company_id: "" });
      toast.success("ユーザーを作成しました");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "作成に失敗しました"),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("更新しました");
    },
    onError: () => toast.error("更新に失敗しました"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("削除しました");
    },
    onError: () => toast.error("削除に失敗しました"),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (name: string) => createCompany(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-companies"] });
      setShowNewCompany(false);
      setNewCompanyName("");
      toast.success("会社を作成しました");
    },
    onError: () => toast.error("作成に失敗しました"),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-companies"] }),
    onError: () => toast.error("削除に失敗しました"),
  });

  const roleLabel = (r: string) => ({ employee: "社員", admin: "管理者", super_admin: "スーパー管理者" }[r] ?? r);
  const roleBadgeClass = (r: string) => ({
    employee: "bg-slate-500/20 text-slate-300",
    admin: "bg-blue-500/20 text-blue-300",
    super_admin: "bg-purple-500/20 text-purple-300",
  }[r] ?? "bg-slate-500/20 text-slate-300");

  return (
    <div>
      <div className="mb-5 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">管理者パネル</h1>
        <p className="text-slate-400 text-xs lg:text-sm">ユーザーと会社の管理</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "users" ? "bg-accent/20 text-accent-light" : "text-slate-400 hover:text-slate-200"}`}
        >
          <Users size={15} /> ユーザー
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setTab("companies")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "companies" ? "bg-accent/20 text-accent-light" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Building2 size={15} /> 会社
          </button>
        )}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{users.length}名のユーザー</p>
            <button
              onClick={() => setShowNewUser(!showNewUser)}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={13} /> ユーザー追加
            </button>
          </div>

          {showNewUser && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-white">新規ユーザー</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">名前</label>
                  <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">メール</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">パスワード</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">権限</label>
                  <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as Role }))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent">
                    <option value="employee">社員</option>
                    <option value="admin">管理者</option>
                    {isSuperAdmin && <option value="super_admin">スーパー管理者</option>}
                  </select>
                </div>
                {isSuperAdmin && (
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">会社</label>
                    <select value={newUser.company_id} onChange={e => setNewUser(p => ({ ...p, company_id: e.target.value }))}
                      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent">
                      <option value="">なし (super_admin用)</option>
                      {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createUserMutation.mutate({ ...newUser, company_id: newUser.company_id || undefined })}
                  disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.name}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {createUserMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  作成
                </button>
                <button onClick={() => setShowNewUser(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {loadingUsers ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-500" /></div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-border">
                  <tr className="text-xs text-slate-400 uppercase tracking-wider">
                    <th className="text-left px-4 py-3">名前</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">メール</th>
                    <th className="text-left px-4 py-3">権限</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">状態</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs ${u.is_active ? "text-green-400" : "text-red-400"}`}>
                          {u.is_active ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {u.id !== user?.id && (
                            <>
                              <button
                                onClick={() => updateUserMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                                className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                                title={u.is_active ? "無効化" : "有効化"}
                              >
                                {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`${u.name} を削除しますか？`)) deleteUserMutation.mutate(u.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Companies Tab (super_admin only) */}
      {tab === "companies" && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{companies.length}社</p>
            <button
              onClick={() => setShowNewCompany(!showNewCompany)}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={13} /> 会社追加
            </button>
          </div>

          {showNewCompany && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-white">新規会社</h3>
              <input
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                placeholder="会社名"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => createCompanyMutation.mutate(newCompanyName)}
                  disabled={createCompanyMutation.isPending || !newCompanyName.trim()}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {createCompanyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  作成
                </button>
                <button onClick={() => setShowNewCompany(false)} className="px-4 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border">
                <tr className="text-xs text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">会社名</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">ID</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {companies.map((c: any) => (
                  <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono hidden md:table-cell">{c.id}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`${c.name} を削除しますか？`)) deleteCompanyMutation.mutate(c.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors float-right"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
