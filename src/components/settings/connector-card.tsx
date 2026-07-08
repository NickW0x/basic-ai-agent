"use client";

import { ConnectorLogo } from "@/components/settings/connector-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  CheckIcon,
  CircleDashedIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

export interface ConnectorStatus {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  missingEnv: string[];
  webhookPath: string;
  docsUrl: string;
}

interface ConnectorCardProps {
  connector: ConnectorStatus;
}

export function ConnectorCard({ connector }: ConnectorCardProps) {
  const [copied, setCopied] = useState(false);
  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${connector.webhookPath}`
      : connector.webhookPath;

  const copyWebhook = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [webhookUrl]);

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-colors",
        connector.enabled
          ? "border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]"
          : "border-border/80",
      )}
    >
      <CardHeader className="gap-4 border-b border-border/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <ConnectorLogo name={connector.name} slug={connector.slug} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base leading-none">
                {connector.name}
              </h3>
              <Badge
                className="gap-1"
                title="Credentials detected in env — not a live webhook check"
                variant={connector.enabled ? "default" : "secondary"}
              >
                {connector.enabled ? (
                  <CheckCircle2Icon className="size-3" />
                ) : (
                  <CircleDashedIcon className="size-3" />
                )}
                {connector.enabled ? "Configured" : "Needs setup"}
              </Badge>
            </div>
            <p className="mt-1.5 text-muted-foreground text-sm leading-snug">
              {connector.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4">
        <div>
          <p className="mb-1.5 text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
            Webhook endpoint
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border bg-muted/60 px-2.5 py-2 font-mono text-[11px]">
              {webhookUrl}
            </code>
            <Button
              aria-label={`Copy webhook URL for ${connector.name}`}
              onClick={() => void copyWebhook()}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              {copied ? (
                <CheckIcon className="size-3.5 text-emerald-600" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>

        {!connector.enabled && connector.missingEnv.length > 0 ? (
          <div>
            <p className="mb-2 text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
              Add to <code className="normal-case">.env.local</code>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {connector.missingEnv.map((envVar) => (
                <code
                  className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  key={envVar}
                >
                  {envVar}
                </code>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-emerald-700 text-sm dark:text-emerald-400">
            Credentials detected in env — not verified as a live webhook.
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-muted/20 px-4 py-3">
        <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
          <a href={connector.docsUrl} rel="noreferrer" target="_blank">
            View setup guide
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
