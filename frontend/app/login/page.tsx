"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clapperboard, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      toast.error(err.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Clapperboard size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Director Tool</h1>
          <p className="text-slate-400 text-sm mt-1">ログインしてください</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">パスワード</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                placeholder="パスワード"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mt-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
