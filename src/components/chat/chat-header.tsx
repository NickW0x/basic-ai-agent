"use client";

import { ThemeToggle } from "@/components/chat/theme-toggle";

export function ChatHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
      <div>
        <h1 className="font-semibold text-lg tracking-tight">Basic AI Agent</h1>
        <p className="text-muted-foreground text-sm">
          Powered by Vercel AI SDK and Chat SDK
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
