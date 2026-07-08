import { createGitHubAdapter } from "@chat-adapter/github";
import { createGoogleChatAdapter } from "@chat-adapter/gchat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createWebAdapter } from "@chat-adapter/web";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { Chat, type Adapter, type Message, type Thread } from "chat";
import { toAiMessages } from "chat/ai";
import { agent } from "./agent";
import { getUser } from "./auth-stub";

const userName = process.env.BOT_USERNAME ?? "basic-ai-agent";

// Register only adapters whose credentials are configured so local dev can boot incrementally.
const adapters: Record<string, Adapter> = {
  web: createWebAdapter({
    userName,
    getUser,
  }),
};

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

export const bot = new Chat({
  userName,
  adapters,
  state: process.env.REDIS_URL
    ? createRedisState({ url: process.env.REDIS_URL })
    : createMemoryState(),
  dedupeTtlMs: 600_000,
  concurrency: "queue",
});

// Lazy init for adapters that need async setup (e.g. Telegram polling in local dev).
let initPromise: Promise<void> | undefined;

export function ensureBotInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = bot.initialize();
  }

  return initPromise;
}

async function collectMessages(thread: Thread): Promise<Message[]> {
  const messages: Message[] = [];

  for await (const message of thread.allMessages) {
    messages.push(message);
  }

  return messages;
}

async function respondWithAgent(thread: Thread) {
  const history = await toAiMessages(await collectMessages(thread));
  const result = await agent.stream({
    messages: history,
    options: {},
  });
  await thread.post(result.fullStream);
}

bot.onNewMention(async (thread) => {
  await thread.subscribe();
  await respondWithAgent(thread);
});

bot.onSubscribedMessage(async (thread) => {
  await respondWithAgent(thread);
});

bot.onDirectMessage(async (thread) => {
  await respondWithAgent(thread);
});
