import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "chat",
    "@chat-adapter/web",
    "@chat-adapter/slack",
    "@chat-adapter/telegram",
    "@chat-adapter/whatsapp",
    "@chat-adapter/gchat",
    "@chat-adapter/github",
    "@chat-adapter/state-redis",
    "@chat-adapter/state-memory",
  ],
};

export default nextConfig;
