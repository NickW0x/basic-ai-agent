"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettingsDraft } from "@/components/settings/settings-draft-context";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface RuntimeConnectionPanelProps {
  title?: string;
  children: React.ReactNode;
}

export function RuntimeConnectionPanel({
  title = "How this connects to runtime",
  children,
}: RuntimeConnectionPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger asChild>
        <Button
          className="h-auto w-full justify-between gap-2 px-4 py-3"
          type="button"
          variant="outline"
        >
          <span className="font-medium text-sm">{title}</span>
          <ChevronDownIcon
            className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border bg-muted/30 px-4 py-3 text-muted-foreground text-sm leading-relaxed">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SettingsPageHeaderProps {
  title: string;
  description: string;
  stat?: string;
}

export function SettingsPageHeader({
  title,
  description,
  stat,
}: SettingsPageHeaderProps) {
  const { isDirty } = useSettingsDraft();

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-semibold text-2xl tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isDirty ? (
          <Badge variant="secondary">Unsaved changes</Badge>
        ) : null}
        {stat ? <Badge variant="outline">{stat}</Badge> : null}
      </div>
    </div>
  );
}
