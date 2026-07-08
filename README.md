# basic-ai-agent

A multi-platform AI chat bot built with [Chat SDK](https://chat-sdk.dev), with a polished web UI powered by [Vercel AI Elements](https://elements.ai-sdk.dev).

## Web UI

The browser chat at `/` uses [AI Elements](https://elements.ai-sdk.dev/components) and shadcn/ui:

- Streaming markdown responses with tool-call cards
- Model picker, file attachments, and web-search toggle
- System-aware light/dark theme

The web API at `/api/chat` streams full UIMessage parts (tools, files, text) via AI SDK's `createAgentUIStreamResponse`. Slack, Telegram, GitHub, and other platforms continue to use Chat SDK webhook handlers in `src/lib/bot.ts`.

## Getting Started

1. Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

3. Expose your local server to the internet (ngrok, Cloudflare Tunnel, or a Vercel preview) and configure platform webhook URLs in each messenger's developer console.

Adapters are registered conditionally — only platforms with credentials in `.env.local` are enabled.

## Endpoints

| Platform | Webhook URL |
| --- | --- |
| Web | `/api/webhooks/web` |
| Web chat API | `/api/chat` |
| Slack | `/api/webhooks/slack` |
| Telegram | `/api/webhooks/telegram` |
| WhatsApp | `/api/webhooks/whatsapp` |
| Google Chat | `/api/webhooks/gchat` |
| GitHub | `/api/webhooks/github` |

Replace `https://your-domain.com` with your deployed URL or tunnel address.

## Platform Setup

### Redis (production)

Set `REDIS_URL` to your [Upstash Redis](https://upstash.com) connection string. Redis is required in production so thread subscriptions and distributed locks survive serverless cold starts and multi-instance deploys. Without it, the bot falls back to in-memory state (development only).

### Slack

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps).
2. Enable **Event Subscriptions** with request URL `https://your-domain.com/api/webhooks/slack`.
3. Subscribe to bot events: `app_mention`, and optionally `message.im` / `message.channels`.
4. Install the app to your workspace and copy the **Bot User OAuth Token** and **Signing Secret**.
5. Set `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` in `.env.local`.

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, and `TELEGRAM_BOT_USERNAME`.
3. Register the webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/webhooks/telegram", "secret_token": "your-webhook-secret"}'
```

In local dev, the adapter uses polling automatically when no webhook is configured.

### WhatsApp Business Cloud

1. Create a Meta app at [developers.facebook.com/apps](https://developers.facebook.com/apps) and add the **WhatsApp** product.
2. Set callback URL to `https://your-domain.com/api/webhooks/whatsapp`.
3. Set a verify token and subscribe to the `messages` field.
4. Copy **App Secret**, **Access Token**, and **Phone Number ID** from the Meta dashboard.
5. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_VERIFY_TOKEN`.

### Google Chat

1. Create a GCP project and enable the Google Chat API, Google Workspace Events API, and Cloud Pub/Sub API.
2. Create a service account, download the JSON key, and configure a Google Chat app with App URL `https://your-domain.com/api/webhooks/gchat`.
3. Set `GOOGLE_CHAT_CREDENTIALS` (single-line JSON) and `GOOGLE_CHAT_PROJECT_NUMBER`.
4. Optional: configure Pub/Sub for all space messages — set `GOOGLE_CHAT_PUBSUB_TOPIC`, `GOOGLE_CHAT_IMPERSONATE_USER`, and `GOOGLE_CHAT_PUBSUB_AUDIENCE`.

See the [Google Chat adapter docs](https://chat-sdk.dev/adapters/official/gchat) for domain-wide delegation and Pub/Sub setup.

### GitHub

The bot responds to `@mentions` in issue and pull request comment threads.

**Option A — Personal Access Token** (quickest for your own repos):

1. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` scope.
2. Add a repository webhook:
   - **Payload URL:** `https://your-domain.com/api/webhooks/github`
   - **Content type:** `application/json`
   - **Secret:** match `GITHUB_WEBHOOK_SECRET`
   - **Events:** Issue comments, Pull request review comments
3. Set `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, and `GITHUB_BOT_USERNAME` in `.env.local`.

**Option B — GitHub App** (recommended for production):

1. Create an app at [github.com/settings/apps/new](https://github.com/settings/apps/new).
2. Set **Webhook URL** to `https://your-domain.com/api/webhooks/github` and generate a **Webhook secret**.
3. Set permissions: Issues (Read & write), Pull requests (Read & write), Metadata (Read-only).
4. Subscribe to events: **Issue comment**, **Pull request review comment**.
5. Create the app, generate a **private key**, then **Install App** on your account/repos.
6. Set `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_BOT_USERNAME` (e.g. `my-app[bot]`), and `GITHUB_INSTALLATION_ID` (from the install URL) in `.env.local`.

Test by @mentioning your bot on a PR or issue comment.

## Project Structure

```
src/
  app/
    page.tsx                              Web chat UI (AI Elements)
    api/chat/route.ts                     Web chat API (full UIMessage stream)
    api/webhooks/[platform]/route.ts      Webhook endpoint for platform adapters
  components/
    ai-elements/                          Vercel AI Elements (installed via CLI)
    chat/                                 App-specific chat layout components
    ui/                                   shadcn/ui primitives
  lib/
    agent.ts                              ToolLoopAgent with per-request options
    bot.ts                                Chat SDK bot for Slack, GitHub, etc.
    web-chat.ts                           Web-specific streaming handler
    chat-config.ts                        Models and UI config
    tools.ts                              Agent tools (weather, calculate, search)
.env.example                              Required environment variables
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | Type-check the project |

## Learn More

- [Chat SDK Documentation](https://chat-sdk.dev/docs)
- [AI Elements Documentation](https://elements.ai-sdk.dev/docs)
- [Adapter Setup Guides](https://chat-sdk.dev/adapters)
- [GitHub Repository](https://github.com/vercel/chat)
