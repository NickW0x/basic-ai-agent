"use client";

import { createContext, useContext } from "react";
import type { StatusResponse } from "@/lib/status-types";

export interface SettingsStatusContextValue {
  data: StatusResponse | null;
  error: string | null;
  loading: boolean;
  lastCheckedAt: string | null;
  refresh: () => Promise<void>;
}

export const SettingsStatusContext =
  createContext<SettingsStatusContextValue | null>(null);

export function useSettingsStatus(): SettingsStatusContextValue {
  const context = useContext(SettingsStatusContext);

  if (!context) {
    throw new Error("useSettingsStatus must be used within SettingsShell");
  }

  return context;
}
