"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SummaryStat {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: LucideIcon;
}

interface SettingsSummaryGridProps {
  stats: SummaryStat[];
}

export function SettingsSummaryGrid({ stats }: SettingsSummaryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card className="gap-3 py-4" key={stat.label}>
            <CardHeader className="px-4 pb-0">
              <div className="flex items-center justify-between">
                <CardDescription>{stat.label}</CardDescription>
                {Icon ? (
                  <Icon className="size-4 text-muted-foreground" />
                ) : null}
              </div>
              <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
            </CardHeader>
            {stat.detail ? (
              <CardContent className="px-4 text-muted-foreground text-xs">
                {stat.detail}
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
