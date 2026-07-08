import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "chat",
    "eve",
    "@chat-adapter/slack",
    "@chat-adapter/telegram",
    "@chat-adapter/whatsapp",
    "@chat-adapter/messenger",
    "@chat-adapter/x",
    "@chat-adapter/gchat",
    "@chat-adapter/github",
    "@chat-adapter/discord",
    "@chat-adapter/teams",
    "@chat-adapter/linear",
    "@resend/chat-sdk-adapter",
    "chat-adapter-sendblue",
    "@chat-adapter/state-redis",
    "@chat-adapter/state-memory",
  ],
};

export default withEve(nextConfig);
