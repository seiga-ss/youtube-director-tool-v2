"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MockModeProvider } from "@/hooks/useMockMode";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <AuthProvider>
      <MockModeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MockModeProvider>
    </AuthProvider>
  );
}
