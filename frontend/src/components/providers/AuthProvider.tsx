"use client";

import { type ReactNode } from "react";

// Auth disabled - personal use only
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
