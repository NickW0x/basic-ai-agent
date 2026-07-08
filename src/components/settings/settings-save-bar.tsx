"use client";

import { useSettingsDraft } from "@/components/settings/settings-draft-context";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const BEHAVIOR_PREFIXES = [
  "/settings/souls",
  "/settings/skills",
  "/settings/knowledge",
  "/settings/voice",
];

function isBehaviorRoute(pathname: string): boolean {
  return BEHAVIOR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function SettingsPreviewBar() {
  const pathname = usePathname();
  if (!isBehaviorRoute(pathname)) return null;

  return (
    <div
      className="shrink-0 border-b bg-amber-500/10 px-4 py-2 text-amber-950 text-sm dark:bg-amber-500/15 dark:text-amber-100 md:px-6"
      role="status"
    >
      <span className="font-medium">Preview mode</span>
      <span className="text-amber-900/80 dark:text-amber-100/80">
        {" "}
        — changes are not saved to your agent yet. Phase 2 wires these to eve,
        xAI, and Railway.
      </span>
    </div>
  );
}

export function SettingsSaveBar() {
  const pathname = usePathname();
  const { isDirty, save, reset } = useSettingsDraft();

  if (!isBehaviorRoute(pathname) || !isDirty) return null;

  return (
    <div
      aria-label="Unsaved changes"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6"
      role="region"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="font-medium text-sm">Unsaved preview changes</p>
        <div className="flex gap-2">
          <Button onClick={reset} size="sm" type="button" variant="outline">
            Reset
          </Button>
          <Button onClick={save} size="sm" type="button">
            Save preview
          </Button>
        </div>
      </div>
    </div>
  );
}
