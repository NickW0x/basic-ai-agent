"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  REPLACEMENT_HINTS,
  type ReplacementHint,
} from "@/lib/settings-runtime-contract";
import { CircleHelpIcon } from "lucide-react";

interface ReplacementHintProps {
  hintKey: keyof typeof REPLACEMENT_HINTS;
  hint?: ReplacementHint;
}

export function ReplacementHint({ hintKey, hint }: ReplacementHintProps) {
  const data = hint ?? REPLACEMENT_HINTS[hintKey];
  if (!data) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={`Runtime info for ${data.field}`}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          type="button"
        >
          <CircleHelpIcon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left" side="top">
        <p className="font-medium text-xs">{data.field}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          <span className="font-medium">Phase 2:</span> {data.phase2Target}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">{data.runtimeEffect}</p>
      </TooltipContent>
    </Tooltip>
  );
}
