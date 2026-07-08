"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  createDefaultSettingsMockState,
  type SettingsMockState,
} from "@/lib/settings-mock";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface SettingsDraftContextValue {
  state: SettingsMockState;
  defaults: SettingsMockState;
  isDirty: boolean;
  updateState: (updater: (prev: SettingsMockState) => SettingsMockState) => void;
  save: () => void;
  reset: () => void;
}

const SettingsDraftContext = createContext<SettingsDraftContextValue | null>(
  null,
);

export function SettingsDraftProvider({ children }: { children: ReactNode }) {
  const defaults = useMemo(() => createDefaultSettingsMockState(), []);
  const [state, setState] = useState<SettingsMockState>(defaults);

  const isDirty = useMemo(
    () => !deepEqual(state, defaults),
    [state, defaults],
  );

  const updateState = useCallback(
    (updater: (prev: SettingsMockState) => SettingsMockState) => {
      setState((prev) => updater(prev));
    },
    [],
  );

  const save = useCallback(() => {
    toast.success("Saved in preview — persistence coming soon");
  }, []);

  const reset = useCallback(() => {
    setState(createDefaultSettingsMockState());
    toast.info("Reset to default preview values");
  }, []);

  const value = useMemo(
    () => ({
      state,
      defaults,
      isDirty,
      updateState,
      save,
      reset,
    }),
    [state, defaults, isDirty, updateState, save, reset],
  );

  return (
    <SettingsDraftContext.Provider value={value}>
      {children}
    </SettingsDraftContext.Provider>
  );
}

export function useSettingsDraft() {
  const context = useContext(SettingsDraftContext);
  if (!context) {
    throw new Error("useSettingsDraft must be used within SettingsDraftProvider");
  }
  return context;
}
