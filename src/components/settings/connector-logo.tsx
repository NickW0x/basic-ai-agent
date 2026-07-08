import {
  MicrosoftTeamsBrandIcon,
  SlackBrandIcon,
} from "@/components/settings/connector-brand-icons";
import { CONNECTOR_BRANDS } from "@/lib/connector-meta";
import { cn } from "@/lib/utils";
import { MessageCircleIcon } from "lucide-react";

interface ConnectorLogoProps {
  slug: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    tile: "size-9 rounded-lg",
    icon: "size-5",
    slack: "size-5",
  },
  md: {
    tile: "size-11 rounded-xl",
    icon: "size-6",
    slack: "size-6",
  },
  lg: {
    tile: "size-14 rounded-2xl",
    icon: "size-8",
    slack: "size-8",
  },
};

// Brand logo tile — inline SVG for Slack/Teams, CDN fallback for others.
export function ConnectorLogo({
  slug,
  name,
  size = "md",
  className,
}: ConnectorLogoProps) {
  const brand = CONNECTOR_BRANDS[slug];
  const sizes = sizeClasses[size];
  const background = brand?.brandColor ?? "var(--muted)";
  const isLightTile = brand?.lightTile ?? false;

  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center shadow-sm ring-1",
        isLightTile
          ? "bg-white ring-black/10 dark:bg-zinc-900 dark:ring-white/15"
          : "ring-black/5 dark:ring-white/10",
        sizes.tile,
        className,
      )}
      style={isLightTile ? undefined : { backgroundColor: background }}
    >
      {slug === "slack" ? (
        <SlackBrandIcon className={sizes.slack} />
      ) : slug === "teams" ? (
        <MicrosoftTeamsBrandIcon className={cn(sizes.icon, "text-white")} />
      ) : brand?.simpleIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className={cn(
            "object-contain brightness-0 invert",
            sizes.icon,
          )}
          src={`https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${brand.simpleIcon}.svg`}
        />
      ) : slug === "sendblue" ? (
        <MessageCircleIcon
          className={cn(sizes.icon, "text-white")}
          strokeWidth={2.25}
        />
      ) : (
        <span className="font-semibold text-white text-xs">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
