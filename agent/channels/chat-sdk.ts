import { createGitHubAdapter } from "@chat-adapter/github";
import { createGoogleChatAdapter } from "@chat-adapter/gchat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import type { ActionEvent, Adapter, Message, Thread } from "chat";
import { chatSdkChannel, messageToUserContent } from "eve/channels/chat-sdk";

const userName = process.env.BOT_USERNAME ?? "basic-ai-agent";

// Register only adapters whose credentials are configured so local dev can boot incrementally.
const adapters: Record<string, Adapter> = {};

if (process.env.SLACK_BOT_TOKEN) {
  adapters.slack = createSlackAdapter();
}

if (process.env.TELEGRAM_BOT_TOKEN) {
  adapters.telegram = createTelegramAdapter({ mode: "auto" });
}

if (process.env.WHATSAPP_ACCESS_TOKEN) {
  adapters.whatsapp = createWhatsAppAdapter();
}

if (process.env.GOOGLE_CHAT_CREDENTIALS || process.env.GOOGLE_CHAT_USE_ADC) {
  adapters.gchat = createGoogleChatAdapter();
}

const hasGitHubAuth =
  process.env.GITHUB_TOKEN ||
  (process.env.GITHUB_APP_ID && process.env.GITHUB_PRIVATE_KEY);

if (hasGitHubAuth && process.env.GITHUB_WEBHOOK_SECRET) {
  adapters.github = createGitHubAdapter();
}

function resolveInputAuth(event: ActionEvent) {
  const userId = event.user?.userId ?? "unknown";

  return {
    authenticator: "chat-sdk",
    principalType: "user",
    principalId: userId,
    attributes: {
      userName: event.user?.userName ?? null,
      fullName: event.user?.fullName ?? null,
    },
  };
}

function createChatState() {
  const redisUrl = process.env.REDIS_URL?.trim();

  // Skip placeholder/example Redis URLs from .env.example copies.
  if (
    redisUrl &&
    !redisUrl.includes("your-host.upstash.io") &&
    !redisUrl.includes("your-password")
  ) {
    return createRedisState({ url: redisUrl });
  }

  return createMemoryState();
}

export const { bot, channel, send } = chatSdkChannel({
  userName,
  adapters,
  state: createChatState(),
  route: "/api/webhooks",
  dedupeTtlMs: 600_000,
  concurrency: "queue",
  resolveInputAuth,
});

// Telegram auto-mode needs async adapter initialization before webhooks run.
void bot.initialize();

async function dispatchThreadMessage(thread: Thread, message: Message) {
  await send(messageToUserContent(message), { thread });
}

bot.onNewMention(async (thread: Thread, message: Message) => {
  await thread.subscribe();
  await dispatchThreadMessage(thread, message);
});

bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
  await dispatchThreadMessage(thread, message);
});

bot.onDirectMessage(async (thread: Thread, message: Message) => {
  await dispatchThreadMessage(thread, message);
});

export default channel;
