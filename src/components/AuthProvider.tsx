// File: src/components/AuthProvider.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

// This is a client component that wraps the SessionProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
