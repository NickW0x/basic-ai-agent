import { createMemoryState } from "@chat-adapter/state-memory";
import { createRedisState } from "@chat-adapter/state-redis";
import type { ActionEvent, Message, Thread } from "chat";
import { registerEnabledAdapters } from "../lib/register-adapters";
import { chatSdkChannel, messageToUserContent } from "eve/channels/chat-sdk";

const userName = process.env.BOT_USERNAME ?? "basic-ai-agent";

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
  adapters: registerEnabledAdapters(),
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
