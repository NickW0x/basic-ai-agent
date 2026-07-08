import { createDiscordAdapter } from "@chat-adapter/discord";
import { createGitHubAdapter } from "@chat-adapter/github";
import { createGoogleChatAdapter } from "@chat-adapter/gchat";
import { createLinearAdapter } from "@chat-adapter/linear";
import { createMessengerAdapter } from "@chat-adapter/messenger";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createXAdapter } from "@chat-adapter/x";
import { createTeamsAdapter } from "@chat-adapter/teams";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { createResendAdapter } from "@resend/chat-sdk-adapter";
import type { Adapter } from "chat";
import { createSendblueAdapter } from "chat-adapter-sendblue";
import { envSet, hasGitHubAuth, hasLinearAuth, hasXAuth } from "./connectors";

// Register only adapters whose credentials are configured so local dev can boot incrementally.
export function registerEnabledAdapters(): Record<string, Adapter> {
  const adapters: Record<string, Adapter> = {};

  if (envSet("SLACK_BOT_TOKEN")) {
    adapters.slack = createSlackAdapter();
  }

  if (envSet("TELEGRAM_BOT_TOKEN")) {
    adapters.telegram = createTelegramAdapter({ mode: "auto" });
  }

  if (envSet("WHATSAPP_ACCESS_TOKEN")) {
    adapters.whatsapp = createWhatsAppAdapter();
  }

  if (
    envSet("FACEBOOK_APP_SECRET") &&
    envSet("FACEBOOK_PAGE_ACCESS_TOKEN") &&
    envSet("FACEBOOK_VERIFY_TOKEN")
  ) {
    adapters.messenger = createMessengerAdapter();
  }

  if (envSet("X_CONSUMER_SECRET") && hasXAuth()) {
    adapters.x = createXAdapter();
  }

  if (envSet("GOOGLE_CHAT_CREDENTIALS") || envSet("GOOGLE_CHAT_USE_ADC")) {
    adapters.gchat = createGoogleChatAdapter();
  }

  if (hasGitHubAuth() && envSet("GITHUB_WEBHOOK_SECRET")) {
    adapters.github = createGitHubAdapter();
  }

  if (
    envSet("SENDBLUE_API_KEY") &&
    envSet("SENDBLUE_API_SECRET") &&
    envSet("SENDBLUE_FROM_NUMBER")
  ) {
    adapters.sendblue = createSendblueAdapter({
      allowedServices: ["iMessage", "SMS", "RCS"],
    });
  }

  if (
    envSet("DISCORD_BOT_TOKEN") &&
    envSet("DISCORD_PUBLIC_KEY") &&
    envSet("DISCORD_APPLICATION_ID")
  ) {
    adapters.discord = createDiscordAdapter();
  }

  if (envSet("TEAMS_APP_ID") && envSet("TEAMS_APP_PASSWORD")) {
    adapters.teams = createTeamsAdapter({
      appType: envSet("TEAMS_APP_TENANT_ID") ? "SingleTenant" : "MultiTenant",
    });
  }

  if (hasLinearAuth() && envSet("LINEAR_WEBHOOK_SECRET")) {
    adapters.linear = createLinearAdapter({
      mode:
        process.env.LINEAR_MODE === "agent-sessions"
          ? "agent-sessions"
          : "comments",
    });
  }

  if (
    envSet("RESEND_API_KEY") &&
    envSet("RESEND_WEBHOOK_SECRET") &&
    envSet("RESEND_FROM_ADDRESS")
  ) {
    adapters.resend = createResendAdapter({
      fromAddress: process.env.RESEND_FROM_ADDRESS!,
      fromName: process.env.RESEND_FROM_NAME,
    });
  }

  return adapters;
}
