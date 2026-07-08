import { envSet, getEnvValue, isPlaceholderEnv } from "./env-helpers";

export { envSet };

export interface ConnectorDefinition {
  slug: string;
  name: string;
  description: string;
  docsUrl: string;
  webhookPath: string;
  isEnabled: () => boolean;
  missingEnv: () => string[];
}

export function hasGitHubAuth(): boolean {
  return (
    envSet("GITHUB_TOKEN") ||
    (envSet("GITHUB_APP_ID") && envSet("GITHUB_PRIVATE_KEY"))
  );
}

export function hasLinearAuth(): boolean {
  return (
    envSet("LINEAR_API_KEY") ||
    envSet("LINEAR_ACCESS_TOKEN") ||
    (envSet("LINEAR_CLIENT_CREDENTIALS_CLIENT_ID") &&
      envSet("LINEAR_CLIENT_CREDENTIALS_CLIENT_SECRET")) ||
    (envSet("LINEAR_CLIENT_ID") && envSet("LINEAR_CLIENT_SECRET"))
  );
}

export function hasXAuth(): boolean {
  return (
    envSet("X_USER_ACCESS_TOKEN") ||
    (envSet("X_CLIENT_ID") && envSet("X_REFRESH_TOKEN"))
  );
}

function xMissingEnv(): string[] {
  const missing: string[] = [];

  if (!envSet("X_CONSUMER_SECRET")) {
    missing.push("X_CONSUMER_SECRET");
  }

  if (!hasXAuth()) {
    missing.push(
      "X_USER_ACCESS_TOKEN (or X_CLIENT_ID + X_REFRESH_TOKEN)",
    );
  }

  return missing;
}

function linearMissingEnv(): string[] {
  const missing: string[] = [];

  if (!hasLinearAuth()) {
    missing.push(
      "LINEAR_API_KEY (or LINEAR_ACCESS_TOKEN / LINEAR_CLIENT_CREDENTIALS_* / LINEAR_CLIENT_ID+SECRET)",
    );
  }

  if (!envSet("LINEAR_WEBHOOK_SECRET")) {
    missing.push("LINEAR_WEBHOOK_SECRET");
  }

  return missing;
}

function githubMissingEnv(): string[] {
  const missing: string[] = [];

  if (!hasGitHubAuth()) {
    missing.push(
      "GITHUB_TOKEN (or GITHUB_APP_ID + GITHUB_PRIVATE_KEY)",
    );
  }

  if (!envSet("GITHUB_WEBHOOK_SECRET")) {
    missing.push("GITHUB_WEBHOOK_SECRET");
  }

  return missing;
}

function gchatMissingEnv(): string[] {
  if (envSet("GOOGLE_CHAT_CREDENTIALS") || envSet("GOOGLE_CHAT_USE_ADC")) {
    return [];
  }

  return ["GOOGLE_CHAT_CREDENTIALS (or GOOGLE_CHAT_USE_ADC=true)"];
}

export const CONNECTOR_DEFINITIONS: ConnectorDefinition[] = [
  {
    slug: "slack",
    name: "Slack",
    description: "Workspace mentions and direct messages.",
    docsUrl: "https://chat-sdk.dev/adapters/official/slack",
    webhookPath: "/api/webhooks/slack",
    isEnabled: () => envSet("SLACK_BOT_TOKEN"),
    missingEnv: () =>
      envSet("SLACK_BOT_TOKEN") ? [] : ["SLACK_BOT_TOKEN"],
  },
  {
    slug: "telegram",
    name: "Telegram",
    description: "Bot messages via webhook or polling.",
    docsUrl: "https://chat-sdk.dev/adapters/official/telegram",
    webhookPath: "/api/webhooks/telegram",
    isEnabled: () => envSet("TELEGRAM_BOT_TOKEN"),
    missingEnv: () =>
      envSet("TELEGRAM_BOT_TOKEN") ? [] : ["TELEGRAM_BOT_TOKEN"],
  },
  {
    slug: "whatsapp",
    name: "WhatsApp",
    description: "WhatsApp Business Cloud messages.",
    docsUrl: "https://chat-sdk.dev/adapters/official/whatsapp",
    webhookPath: "/api/webhooks/whatsapp",
    isEnabled: () => envSet("WHATSAPP_ACCESS_TOKEN"),
    missingEnv: () =>
      envSet("WHATSAPP_ACCESS_TOKEN") ? [] : ["WHATSAPP_ACCESS_TOKEN"],
  },
  {
    slug: "messenger",
    name: "Messenger",
    description: "Facebook Messenger Page DMs and @mentions.",
    docsUrl: "https://chat-sdk.dev/adapters/official/messenger",
    webhookPath: "/api/webhooks/messenger",
    isEnabled: () =>
      envSet("FACEBOOK_APP_SECRET") &&
      envSet("FACEBOOK_PAGE_ACCESS_TOKEN") &&
      envSet("FACEBOOK_VERIFY_TOKEN"),
    missingEnv: () => {
      const missing: string[] = [];
      if (!envSet("FACEBOOK_APP_SECRET")) missing.push("FACEBOOK_APP_SECRET");
      if (!envSet("FACEBOOK_PAGE_ACCESS_TOKEN")) {
        missing.push("FACEBOOK_PAGE_ACCESS_TOKEN");
      }
      if (!envSet("FACEBOOK_VERIFY_TOKEN")) missing.push("FACEBOOK_VERIFY_TOKEN");
      return missing;
    },
  },
  {
    slug: "x",
    name: "X",
    description: "Public @mentions and direct messages on X.",
    docsUrl: "https://chat-sdk.dev/adapters/official/x",
    webhookPath: "/api/webhooks/x",
    isEnabled: () => envSet("X_CONSUMER_SECRET") && hasXAuth(),
    missingEnv: xMissingEnv,
  },
  {
    slug: "gchat",
    name: "Google Chat",
    description: "Google Chat spaces and direct messages.",
    docsUrl: "https://chat-sdk.dev/adapters/official/gchat",
    webhookPath: "/api/webhooks/gchat",
    isEnabled: () =>
      envSet("GOOGLE_CHAT_CREDENTIALS") || envSet("GOOGLE_CHAT_USE_ADC"),
    missingEnv: gchatMissingEnv,
  },
  {
    slug: "github",
    name: "GitHub",
    description: "Issue and pull request comment threads.",
    docsUrl: "https://chat-sdk.dev/adapters/official/github",
    webhookPath: "/api/webhooks/github",
    isEnabled: () => hasGitHubAuth() && envSet("GITHUB_WEBHOOK_SECRET"),
    missingEnv: githubMissingEnv,
  },
  {
    slug: "sendblue",
    name: "Sendblue",
    description: "iMessage, SMS, and RCS via Sendblue.",
    docsUrl: "https://chat-sdk.dev/adapters/vendor-official/sendblue",
    webhookPath: "/api/webhooks/sendblue",
    isEnabled: () =>
      envSet("SENDBLUE_API_KEY") &&
      envSet("SENDBLUE_API_SECRET") &&
      envSet("SENDBLUE_FROM_NUMBER"),
    missingEnv: () => {
      const missing: string[] = [];
      if (!envSet("SENDBLUE_API_KEY")) missing.push("SENDBLUE_API_KEY");
      if (!envSet("SENDBLUE_API_SECRET")) missing.push("SENDBLUE_API_SECRET");
      if (!envSet("SENDBLUE_FROM_NUMBER")) missing.push("SENDBLUE_FROM_NUMBER");
      return missing;
    },
  },
  {
    slug: "discord",
    name: "Discord",
    description: "Slash commands and @mentions via HTTP interactions.",
    docsUrl: "https://chat-sdk.dev/adapters/official/discord",
    webhookPath: "/api/webhooks/discord",
    isEnabled: () =>
      envSet("DISCORD_BOT_TOKEN") &&
      envSet("DISCORD_PUBLIC_KEY") &&
      envSet("DISCORD_APPLICATION_ID"),
    missingEnv: () => {
      const missing: string[] = [];
      if (!envSet("DISCORD_BOT_TOKEN")) missing.push("DISCORD_BOT_TOKEN");
      if (!envSet("DISCORD_PUBLIC_KEY")) missing.push("DISCORD_PUBLIC_KEY");
      if (!envSet("DISCORD_APPLICATION_ID")) missing.push("DISCORD_APPLICATION_ID");
      return missing;
    },
  },
  {
    slug: "teams",
    name: "Microsoft Teams",
    description: "Teams channels and direct messages.",
    docsUrl: "https://chat-sdk.dev/adapters/official/teams",
    webhookPath: "/api/webhooks/teams",
    isEnabled: () => envSet("TEAMS_APP_ID") && envSet("TEAMS_APP_PASSWORD"),
    missingEnv: () => {
      const missing: string[] = [];
      if (!envSet("TEAMS_APP_ID")) missing.push("TEAMS_APP_ID");
      if (!envSet("TEAMS_APP_PASSWORD")) missing.push("TEAMS_APP_PASSWORD");
      return missing;
    },
  },
  {
    slug: "linear",
    name: "Linear",
    description: "Issue comment threads and agent sessions.",
    docsUrl: "https://chat-sdk.dev/adapters/official/linear",
    webhookPath: "/api/webhooks/linear",
    isEnabled: () => hasLinearAuth() && envSet("LINEAR_WEBHOOK_SECRET"),
    missingEnv: linearMissingEnv,
  },
  {
    slug: "resend",
    name: "Resend",
    description: "Bidirectional email with threading.",
    docsUrl: "https://chat-sdk.dev/adapters/vendor-official/resend",
    webhookPath: "/api/webhooks/resend",
    isEnabled: () =>
      envSet("RESEND_API_KEY") &&
      envSet("RESEND_WEBHOOK_SECRET") &&
      envSet("RESEND_FROM_ADDRESS"),
    missingEnv: () => {
      const missing: string[] = [];
      if (!envSet("RESEND_API_KEY")) missing.push("RESEND_API_KEY");
      if (!envSet("RESEND_WEBHOOK_SECRET")) missing.push("RESEND_WEBHOOK_SECRET");
      if (!envSet("RESEND_FROM_ADDRESS")) missing.push("RESEND_FROM_ADDRESS");
      return missing;
    },
  },
];

export interface ConnectorStatus {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  missingEnv: string[];
  webhookPath: string;
  docsUrl: string;
}

export function getConnectorStatuses(): ConnectorStatus[] {
  return CONNECTOR_DEFINITIONS.map((connector) => ({
    slug: connector.slug,
    name: connector.name,
    description: connector.description,
    enabled: connector.isEnabled(),
    missingEnv: connector.missingEnv(),
    webhookPath: connector.webhookPath,
    docsUrl: connector.docsUrl,
  }));
}

// Mirrors the Redis fallback logic in chat-sdk.ts for the settings dashboard.
export function getStateStorageStatus(): {
  mode: "redis" | "memory";
  configured: boolean;
} {
  const redisUrl = getEnvValue("REDIS_URL");

  if (redisUrl && !isPlaceholderEnv("REDIS_URL", redisUrl)) {
    return { mode: "redis", configured: true };
  }

  return { mode: "memory", configured: false };
}
