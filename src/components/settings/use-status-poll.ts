"use client";

import type { StatusResponse, StatusSection } from "@/lib/status-types";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseStatusPollOptions {
  sections: StatusSection[];
  intervalMs?: number;
  enabled?: boolean;
}

function buildStatusUrl(sections: StatusSection[]): string {
  return `/api/status?sections=${sections.join(",")}`;
}

export function useStatusPoll({
  sections,
  intervalMs = 15_000,
  enabled = true,
}: UseStatusPollOptions) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const dataRef = useRef<StatusResponse | null>(null);

  const sectionsKey = sections.join(",");

  const loadStatus = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildStatusUrl(sections), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load status (${response.status})`);
      }

      const json = (await response.json()) as StatusResponse;
      dataRef.current = json;
      setData(json);
      setLastCheckedAt(json.checkedAt);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load status",
      );
      // Keep stale data visible when a refresh fails.
      if (dataRef.current) {
        setData(dataRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, sectionsKey]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadStatus();
      }
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, loadStatus]);

  return {
    data,
    error,
    loading,
    lastCheckedAt,
    refresh: loadStatus,
  };
}
