import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import MobileNav from "@/components/layout/MobileNav";
import MockBanner from "@/components/layout/MockBanner";
import { MainContent } from "@/components/layout/MainContent";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "YouTube Director Tool v2",
  description: "YouTubeディレクター業務90%削減ツール v2",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen bg-surface text-slate-100">
        <Providers>
          {/* PC: サイドバー */}
          <Sidebar />

          {/* SP: ハンバーガーナビ（ヘッダー＋ドロワー） */}
          <MobileNav />

          {/* モックバナー */}
          <MockBanner />

          {/* バナー表示時にSPのpadding-topを動的に増やす */}
          <MainContent>{children}</MainContent>

          {/* SP: ボトムナビゲーション */}
          <BottomNav />

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1d27",
                color: "#e2e8f0",
                border: "1px solid #2a2f45",
                fontSize: "14px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
