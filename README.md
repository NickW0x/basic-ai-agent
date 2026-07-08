# basic-ai-agent

A multi-platform multi-agent assistant built with [eve](https://eve.dev), [Chat SDK](https://chat-sdk.dev), and a polished web UI powered by [Vercel AI Elements](https://elements.ai-sdk.dev).

## Architecture

The root **orchestrator** (`agent/instructions.md`) delegates focused work to declared specialist subagents:

| Subagent | Role | Tools |
| --- | --- | --- |
| `researcher` | Web search, current facts, weather | `search_web`, `get_weather` |
| `analyst` | Math and numeric calculations | `calculate` |

- **Web UI** talks to eve over the HTTP channel (`/eve/v1/session`) via `useEveAgent`.
- **Slack, Telegram, WhatsApp, Google Chat, GitHub** connect through eve's Chat SDK channel at `/api/webhooks/{platform}`.
- **Durable sessions** survive cold starts and redeploys via Vercel Workflows (eve runtime).
- **Redis** persists Chat SDK thread subscriptions across serverless instances.

Requires **Node 24+**.

## Web UI

The browser chat at `/` uses [AI Elements](https://elements.ai-sdk.dev/components) and shadcn/ui:

- Durable eve sessions with streaming markdown and tool-call cards
- Specialist delegation badges (`researcher`, `analyst`) from the eve event stream
- Model picker, file attachments, and web-search toggle (passed as ephemeral `clientContext`)
- System-aware light/dark theme

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

`withEve()` in `next.config.ts` runs the Next.js app and eve agent runtime together. The browser calls eve same-origin; no separate agent URL is needed.

3. Expose your local server to the internet (ngrok, Cloudflare Tunnel, or a Vercel preview) and configure platform webhook URLs in each messenger's developer console.

Adapters are registered conditionally — only platforms with credentials in `.env.local` are enabled.

## Endpoints

| Surface | URL |
| --- | --- |
| Web chat UI | `/` |
| eve HTTP API | `/eve/v1/session` |
| Slack webhook | `/api/webhooks/slack` |
| Telegram webhook | `/api/webhooks/telegram` |
| WhatsApp webhook | `/api/webhooks/whatsapp` |
| Google Chat webhook | `/api/webhooks/gchat` |
| GitHub webhook | `/api/webhooks/github` |

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
agent/
  agent.ts                              Root runtime config (model, limits)
  instructions.md                         Orchestrator system prompt
  lib/                                  Shared helpers (Tavily, math, UI context)
  tools/                                Harness overrides (disable shell/filesystem)
  subagents/
    researcher/                           Web search and weather specialist
    analyst/                              Math specialist
  channels/
    chat-sdk.ts                           Slack, Telegram, WhatsApp, GChat, GitHub
    eve.ts                                Browser HTTP channel auth
src/
  app/
    page.tsx                              Web chat UI (useEveAgent + AI Elements)
  components/
    ai-elements/                          Vercel AI Elements
    chat/                                 Chat layout, eve shell, subagent badges
    ui/                                   shadcn/ui primitives
  lib/
    chat-config.ts                        Models and UI config
.env.example                              Required environment variables
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js + eve dev servers (via `withEve`) |
| `npm run build` | Create a production build (Next.js + eve) |
| `npm run start` | Start the production server |
| `npm run typecheck` | Type-check the project |

## Learn More

- [eve Documentation](https://eve.dev/docs)
- [Chat SDK Documentation](https://chat-sdk.dev/docs)
- [AI Elements Documentation](https://elements.ai-sdk.dev/docs)
- [Adapter Setup Guides](https://chat-sdk.dev/adapters)
