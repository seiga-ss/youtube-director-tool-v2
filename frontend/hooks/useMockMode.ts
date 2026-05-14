"use client";
import { createElement, createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

const LABELS: Record<string, string> = {
  youtube: "YouTube",
  anthropic: "Claude AI",
  openai: "OpenAI",
  discord: "Discord",
  notion: "Notion",
};

interface MockModeCtx {
  mockServices: string[];
  dismissed: boolean;
  setDismissed: (v: boolean) => void;
}

const MockModeContext = createContext<MockModeCtx>({
  mockServices: [],
  dismissed: false,
  setDismissed: () => {},
});

export function MockModeProvider({ children }: { children: ReactNode }) {
  const [mockServices, setMockServices] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/health`)
      .then((r) => {
        const mock = r.data.mock_mode || {};
        const active = Object.entries(mock)
          .filter(([, v]) => v)
          .map(([k]) => LABELS[k] || k);
        setMockServices(active);
      })
      .catch(() => {});
  }, []);

  return createElement(
    MockModeContext.Provider,
    { value: { mockServices, dismissed, setDismissed } },
    children
  );
}

export function useMockMode() {
  return useContext(MockModeContext);
}
