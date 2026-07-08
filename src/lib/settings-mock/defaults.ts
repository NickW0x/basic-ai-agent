import type {
  KnowledgeDocument,
  KnowledgeSource,
  RagSettings,
  SkillEntry,
  SoulProfile,
  VoiceSettings,
} from "@/lib/settings-runtime-contract";

export const DEFAULT_GLOBAL_SOUL: SoulProfile = {
  scopeId: "global",
  inheritFromGlobal: false,
  identityName: "Assistant",
  tagline: "Multi-agent orchestrator for chat and web",
  tonePreset: "friendly",
  formality: 45,
  verbosity: 50,
  allowEmoji: false,
  traits: ["clear", "helpful", "concise"],
  customInstructions:
    "Synthesize specialist output into one user-facing reply. Delegate when a task needs focused tools.",
  channelOverrides: {},
};

export const DEFAULT_ORCHESTRATOR_SOUL: SoulProfile = {
  scopeId: "orchestrator",
  inheritFromGlobal: true,
  identityName: "Orchestrator",
  tagline: "Routes tasks and synthesizes replies",
  tonePreset: "professional",
  formality: 55,
  verbosity: 45,
  allowEmoji: false,
  traits: ["decisive", "synthesizing"],
  customInstructions: "",
  channelOverrides: {
    slack: { tonePreset: "direct", traits: ["concise"] },
    whatsapp: { tonePreset: "friendly", traits: ["brief"] },
  },
};

export const DEFAULT_SPECIALIST_SOULS: Record<string, SoulProfile> = {
  researcher: {
    scopeId: "researcher",
    inheritFromGlobal: true,
    identityName: "Researcher",
    tagline: "Web search, URLs, and weather",
    tonePreset: "professional",
    formality: 60,
    verbosity: 55,
    allowEmoji: false,
    traits: ["curious", "cited"],
    customInstructions: "Cite sources. Prefer primary URLs when available.",
    channelOverrides: {},
  },
  marketer: {
    scopeId: "marketer",
    inheritFromGlobal: false,
    identityName: "Marketer",
    tagline: "Copy, social posts, campaigns",
    tonePreset: "playful",
    formality: 35,
    verbosity: 60,
    allowEmoji: true,
    traits: ["creative", "persuasive"],
    customInstructions: "Load copy-frameworks before drafting ad or social copy.",
    channelOverrides: {},
  },
};

export function createDefaultSoulsState(): Record<string, SoulProfile> {
  return {
    global: { ...DEFAULT_GLOBAL_SOUL, traits: [...DEFAULT_GLOBAL_SOUL.traits] },
    orchestrator: {
      ...DEFAULT_ORCHESTRATOR_SOUL,
      traits: [...DEFAULT_ORCHESTRATOR_SOUL.traits],
      channelOverrides: { ...DEFAULT_ORCHESTRATOR_SOUL.channelOverrides },
    },
    ...Object.fromEntries(
      Object.entries(DEFAULT_SPECIALIST_SOULS).map(([id, soul]) => [
        id,
        { ...soul, traits: [...soul.traits], channelOverrides: { ...soul.channelOverrides } },
      ]),
    ),
  };
}

export const DEFAULT_SKILLS: SkillEntry[] = [
  {
    id: "chat-reply-format",
    name: "chat-reply-format",
    scope: "orchestrator",
    description:
      "Synthesize final replies for chat platforms with length and formatting constraints.",
    triggerHint:
      "Use when synthesizing final replies for chat platforms with length, markdown, or formatting constraints.",
    body: `Use when synthesizing final replies for chat platforms with length, markdown, or formatting constraints.

## General
- Prefer short paragraphs (2–4 sentences) and bullet lists over tables.
- Synthesize specialist output into one clear user-facing reply.

## When to load this skill
- The user is on a mobile or terse platform.
- Specialist output is long and needs condensation before sending.`,
    status: "active",
    replacesPath: "agent/skills/chat-reply-format.md",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "copy-frameworks",
    name: "copy-frameworks",
    scope: "marketer",
    description:
      "Draft marketing copy, ad text, social posts, email subjects, or campaign messaging.",
    triggerHint:
      "Use when drafting marketing copy, ad text, social posts, email subjects, or campaign messaging.",
    body: `Use when drafting marketing copy, ad text, social posts, email subjects, or campaign messaging.

## Frameworks
### AIDA
- Attention — hook with a specific pain or outcome
- Interest — one concrete benefit
- Desire — who it is for and why now
- Action — one clear CTA`,
    status: "active",
    replacesPath: "agent/subagents/marketer/skills/copy-frameworks.md",
    updatedAt: "2026-01-10T14:30:00Z",
  },
];

export const DEFAULT_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: "upload",
    name: "File upload",
    type: "upload",
    status: "connected",
    documentCount: 3,
    collectionId: "collection_mock_a1b2",
  },
  {
    id: "website",
    name: "Website crawl",
    type: "website",
    status: "unconfigured",
    documentCount: 0,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    type: "google_drive",
    status: "unconfigured",
    documentCount: 0,
  },
  {
    id: "notion",
    name: "Notion",
    type: "notion",
    status: "unconfigured",
    documentCount: 0,
  },
];

export const DEFAULT_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc-1",
    name: "product-faq.md",
    sourceId: "upload",
    sourceName: "File upload",
    chunkCount: 12,
    indexStatus: "indexed",
    updatedAt: "2026-02-01T09:00:00Z",
    fileType: "markdown",
  },
  {
    id: "doc-2",
    name: "onboarding-guide.pdf",
    sourceId: "upload",
    sourceName: "File upload",
    chunkCount: 48,
    indexStatus: "indexed",
    updatedAt: "2026-01-28T16:20:00Z",
    fileType: "pdf",
  },
  {
    id: "doc-3",
    name: "api-reference.md",
    sourceId: "upload",
    sourceName: "File upload",
    chunkCount: 24,
    indexStatus: "stale",
    updatedAt: "2026-01-20T11:45:00Z",
    fileType: "markdown",
  },
];

export const DEFAULT_RAG_SETTINGS: RagSettings = {
  topK: 8,
  chunkSize: 512,
  overlap: 64,
  embeddingModel: "xai-embedding-v1",
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  proxyUrl: "https://voice.example.railway.app",
  defaultVoiceId: "ara",
  model: "grok-voice-think-fast-1.0",
  speed: 1,
  stability: 0.75,
  collectionIds: ["collection_mock_a1b2"],
  channelOverrides: {
    web: null,
    slack: null,
    whatsapp: null,
  },
};

export interface SettingsMockState {
  souls: Record<string, SoulProfile>;
  skills: SkillEntry[];
  knowledgeSources: KnowledgeSource[];
  knowledgeDocuments: KnowledgeDocument[];
  ragSettings: RagSettings;
  voice: VoiceSettings;
}

export function createDefaultSettingsMockState(): SettingsMockState {
  return {
    souls: createDefaultSoulsState(),
    skills: DEFAULT_SKILLS.map((s) => ({ ...s })),
    knowledgeSources: DEFAULT_KNOWLEDGE_SOURCES.map((s) => ({ ...s })),
    knowledgeDocuments: DEFAULT_KNOWLEDGE_DOCUMENTS.map((d) => ({ ...d })),
    ragSettings: { ...DEFAULT_RAG_SETTINGS },
    voice: {
      ...DEFAULT_VOICE_SETTINGS,
      channelOverrides: { ...DEFAULT_VOICE_SETTINGS.channelOverrides },
      collectionIds: [...DEFAULT_VOICE_SETTINGS.collectionIds],
    },
  };
}
