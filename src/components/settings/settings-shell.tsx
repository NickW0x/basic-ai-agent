"use client";

import {
  SettingsStatusContext,
  type SettingsStatusContextValue,
} from "@/components/settings/settings-status-context";
import { SettingsDraftProvider } from "@/components/settings/settings-draft-context";
import {
  SettingsMobileNav,
  SettingsSidebar,
} from "@/components/settings/settings-sidebar";
import {
  SettingsPreviewBar,
  SettingsSaveBar,
} from "@/components/settings/settings-save-bar";
import { ThemeToggle } from "@/components/chat/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import type { StatusSection } from "@/lib/status-types";
import { useStatusPoll } from "@/components/settings/use-status-poll";
import { ArrowLeftIcon, RefreshCwIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function sectionsForPath(pathname: string): StatusSection[] {
  if (pathname.startsWith("/settings/agents")) {
    return ["system", "agents"];
  }
  if (
    pathname.startsWith("/settings/souls") ||
    pathname.startsWith("/settings/skills") ||
    pathname.startsWith("/settings/knowledge") ||
    pathname.startsWith("/settings/voice")
  ) {
    return ["system"];
  }
  return ["system", "connectors"];
}

interface SettingsShellProps {
  children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const pathname = usePathname();
  const sections = sectionsForPath(pathname);
  const poll = useStatusPoll({ sections, intervalMs: 15_000 });

  const contextValue: SettingsStatusContextValue = {
    data: poll.data,
    error: poll.error,
    loading: poll.loading,
    lastCheckedAt: poll.lastCheckedAt,
    refresh: poll.refresh,
  };

  return (
    <SettingsStatusContext.Provider value={contextValue}>
      <SettingsDraftProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
          <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Button asChild size="icon-sm" variant="ghost">
                <Link aria-label="Back to chat" href="/">
                  <ArrowLeftIcon className="size-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <SettingsIcon className="size-4" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg tracking-tight">
                    Settings
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Connectors, agents, knowledge, and runtime status
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                aria-label="Refresh status"
                disabled={poll.loading}
                onClick={() => void poll.refresh()}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <RefreshCwIcon
                  className={poll.loading ? "size-4 animate-spin" : "size-4"}
                />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <SettingsPreviewBar />
          <SettingsMobileNav />

          <div className="flex min-h-0 flex-1">
            <SettingsSidebar />
            <div className="min-h-0 flex-1 overflow-y-auto pb-20">{children}</div>
          </div>

          <SettingsSaveBar />
          <Toaster richColors position="top-center" />
        </div>
      </SettingsDraftProvider>
    </SettingsStatusContext.Provider>
  );
}
