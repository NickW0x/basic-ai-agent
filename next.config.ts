import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "chat",
    "eve",
    "@chat-adapter/slack",
    "@chat-adapter/telegram",
    "@chat-adapter/whatsapp",
    "@chat-adapter/gchat",
    "@chat-adapter/github",
    "@chat-adapter/state-redis",
    "@chat-adapter/state-memory",
  ],
};

export default withEve(nextConfig);
