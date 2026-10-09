"use client";

import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <FeedbackProvider>{children}</FeedbackProvider>;
}
