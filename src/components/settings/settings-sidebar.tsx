"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  BookOpenIcon,
  BotIcon,
  DatabaseIcon,
  MicIcon,
  PlugIcon,
  SparklesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Runtime",
    items: [
      {
        href: "/settings",
        label: "Connectors",
        icon: PlugIcon,
        match: "/settings",
      },
      {
        href: "/settings/agents",
        label: "Agents & Tools",
        icon: BotIcon,
        match: "/settings/agents",
      },
    ],
  },
  {
    label: "Behavior",
    items: [
      {
        href: "/settings/souls",
        label: "Souls",
        icon: SparklesIcon,
        match: "/settings/souls",
      },
      {
        href: "/settings/skills",
        label: "Skills",
        icon: BookOpenIcon,
        match: "/settings/skills",
      },
      {
        href: "/settings/knowledge",
        label: "Knowledge Base",
        icon: DatabaseIcon,
        match: "/settings/knowledge",
      },
      {
        href: "/settings/voice",
        label: "Voice",
        icon: MicIcon,
        match: "/settings/voice",
      },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === "/settings") {
    return pathname === "/settings";
  }
  return pathname.startsWith(item.match);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
      href={item.href}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[220px] shrink-0 border-r md:block">
      <nav aria-label="Settings sections" className="flex h-full flex-col p-3">
        {NAV_GROUPS.map((group) => (
          <div className="mb-4 last:mb-0" key={group.label}>
            <p className="mb-2 px-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink item={item} key={item.href} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function SettingsMobileNav() {
  const pathname = usePathname();
  const allItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="border-b px-4 py-2 md:hidden">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-2 pb-1">
          {allItems.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
