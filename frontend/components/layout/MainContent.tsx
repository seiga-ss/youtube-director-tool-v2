"use client";
import { useMockMode } from "@/hooks/useMockMode";

// バナー表示時(SP): pt-14(ヘッダー56px) + バナー高さ~36px = pt-24(96px)
// バナー非表示時(SP): pt-14(ヘッダー56px)
// PC: pt-8 固定(サイドバーあり、バナーはtop-0に別途配置)
export function MainContent({ children }: { children: React.ReactNode }) {
  const { mockServices, dismissed } = useMockMode();
  const showBanner = !dismissed && mockServices.length > 0;

  return (
    <main className="flex-1 lg:ml-60 min-h-screen overflow-auto">
      <div
        className={`max-w-6xl mx-auto px-4 lg:px-6 pb-24 lg:pb-8 lg:pt-8 transition-[padding] duration-200 ${
          showBanner ? "pt-24" : "pt-14"
        }`}
      >
        {children}
      </div>
    </main>
  );
}
