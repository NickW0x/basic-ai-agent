# Coding Agent Guidance

This is a multi-platform multi-agent assistant built with [eve](https://eve.dev), [Chat SDK](https://chat-sdk.dev), and a web UI powered by [Vercel AI Elements](https://elements.ai-sdk.dev).

## Commands

```bash
npm run dev      # Start Next.js + eve dev servers (via withEve)
npm run build    # Production build (Next.js + eve)
npm run start    # Start production server
npm run typecheck
```

Requires **Node 24+**.

## Project structure

```
agent/
  agent.ts                    # Root runtime config (model, limits)
  instructions.md             # Orchestrator system prompt
  skills/                     # eve load_skill markdown (e.g. chat-reply-format.md)
  tools/                      # Root tools (disableTool overrides)
  subagents/                  # researcher, analyst, summarizer, coder, marketer
  channels/
    chat-sdk.ts               # Slack, Telegram, WhatsApp, Messenger, X, GChat, GitHub, Sendblue, Discord, Teams, Linear, Resend
    eve.ts                    # Browser HTTP channel auth
services/
  voice-proxy/                # Grok Voice WebSocket proxy (Railway; see README Voice mode)
    src/                      # server.ts, proxy-handler.ts, xai-config.ts
src/
  app/page.tsx                # Web chat UI (useEveAgent + AI Elements)
  app/settings/               # Sidebar settings (Runtime + Behavior tabs)
    page.tsx                  # Connectors
    agents/page.tsx           # Agents & Tools
    souls/page.tsx            # Soul profiles (instructions / defineDynamic)
    skills/page.tsx           # eve load_skill scoped markdown
    knowledge/page.tsx        # xAI Collections + search_knowledge
    voice/page.tsx            # Grok Voice via Railway proxy (phase 2)
  app/api/status/             # Unified live status API
  app/api/voice/              # Session token mint for Grok Voice
  app/api/transcribe/         # xAI STT fallback for SpeechInput
  components/chat/            # Eve shell, message list, subagent badges, voice panel
  components/settings/        # Shell, dashboards, draft context, runtime panels
  hooks/use-grok-voice.ts     # Grok Voice realtime hook
  lib/voice/                  # persona-state, runtime, settings-resolver
  lib/voice-client/           # GrokVoiceClient protocol
  lib/audio/                  # Web Audio capture/playback
  lib/settings-runtime-contract.ts  # Mock field → eve/xAI/Railway replacement hints
  lib/settings-mock/          # Preview seed data for Behavior tabs
  lib/agent-meta.ts           # Shared agent roster metadata
  lib/resolve-eve-origin.ts   # Eve origin resolver for probes
  lib/eve-host.ts             # Local eve dev server origin helper
.env.example                  # Required environment variables
next.config.ts                # withEve() wraps Next.js config
.cursor/skills/
  ai-elements/                # Cursor project skill (AI Elements reference + demos)
```

## How it works

1. **Web UI** at `/` uses `useEveAgent` to talk to eve over `/eve/v1/session`.
2. **Platform messengers** send webhooks to `/api/webhooks/{platform}`; eve's Chat SDK channel in `agent/channels/chat-sdk.ts` handles verification, parsing, and routing.
3. The **orchestrator** in `agent/instructions.md` delegates to subagents (`researcher`, `analyst`, `summarizer`, `coder`, `marketer`) for focused work.
4. `withEve()` in `next.config.ts` runs the Next.js app and eve agent runtime together.
5. **Settings dashboards** poll `GET /api/status` where live probes apply (Connectors, Agents). **Behavior tabs** (Souls, Skills, Knowledge, Voice) use client-side mock state via `SettingsDraftProvider` — preview mode with sticky save bar and Sonner toasts; persistence is phase 2.
6. **Voice mode** mints ephemeral tokens via `POST /api/voice/session`, connects through the Railway `services/voice-proxy/` WebSocket proxy, and uses `POST /api/transcribe` as SpeechInput STT fallback. Deploy and env setup: see [README.md — Voice mode](README.md#voice-mode).

## Settings (preview scaffold)

| Route | Group | Runtime target (phase 2) |
|-------|-------|--------------------------|
| `/settings` | Runtime | Chat SDK connectors + webhooks |
| `/settings/agents` | Runtime | eve subagents, tools, `/api/status` |
| `/settings/souls` | Behavior | `agent/instructions.md`, `defineDynamic` per channel |
| `/settings/skills` | Behavior | `agent/skills/`, `subagents/<id>/skills/` (`load_skill`) |
| `/settings/knowledge` | Behavior | xAI Collections → `search_knowledge` tool |
| `/settings/voice` | Behavior | New Railway `grok-voice-proxy` (fork fieldflow; not `voice.tradecraft.nexus`) |

Field mappings and `replacementHint` metadata live in `src/lib/settings-runtime-contract.ts`. Mock defaults in `src/lib/settings-mock/`.

## Key concepts

- **eve agent** — filesystem-first agent definition under `agent/` (instructions, tools, subagents, skills, channels).
- **Subagents** — declared specialists with their own instructions, tools, and optional skills.
- **Skills** — load-on-demand procedures via `load_skill` (scoped per agent; see `node_modules/eve/docs/skills.mdx`).
- **Channels** — entry points for web (`eve`) and chat platforms (`chat-sdk`).
- **State adapter** — Redis (production) or in-memory (dev) for Chat SDK thread subscriptions.
- **Durable sessions** — eve runtime uses Vercel Workflows in production; local dev persists under `.workflow-data/` (gitignored).

## Docs

When dependencies are installed, inspect bundled docs before writing code:

```txt
node_modules/eve/docs/                     # eve framework docs
node_modules/chat/docs/                    # Chat SDK docs
node_modules/chat/dist/index.d.ts          # core API types
node_modules/chat/dist/adapters/index.d.ts # adapter catalog types
```

Start with:

- `node_modules/eve/docs/README.md`
- `node_modules/eve/docs/getting-started.mdx`
- `node_modules/eve/docs/skills.mdx`
- `node_modules/eve/docs/subagents.mdx`
- `node_modules/chat/docs/platform-adapters.mdx`
- `node_modules/chat/docs/state-adapters.mdx`
