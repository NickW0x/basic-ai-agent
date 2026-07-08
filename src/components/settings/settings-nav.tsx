"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings", label: "Connectors", match: "/settings" },
  {
    href: "/settings/agents",
    label: "Agents & Tools",
    match: "/settings/agents",
  },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-1 border-b px-4 md:px-6"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.match === "/settings/agents"
            ? pathname.startsWith("/settings/agents")
            : pathname === "/settings";

        return (
          <Link
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
