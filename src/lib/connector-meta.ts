export type ConnectorCategory =
  | "messaging"
  | "collaboration"
  | "developer"
  | "email";

export interface ConnectorBrand {
  slug: string;
  category: ConnectorCategory;
  // Simple Icons slug for CDN fallback; omit when using a custom inline logo.
  simpleIcon?: string;
  brandColor: string;
  // Light tile background (e.g. Slack multicolor logo on white).
  lightTile?: boolean;
}

export const CONNECTOR_CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  messaging: "Messaging & SMS",
  collaboration: "Workplace & Teams",
  developer: "Developer Tools",
  email: "Email",
};

export const CONNECTOR_BRANDS: Record<string, ConnectorBrand> = {
  slack: {
    slug: "slack",
    category: "messaging",
    brandColor: "#FFFFFF",
    lightTile: true,
  },
  telegram: {
    slug: "telegram",
    category: "messaging",
    simpleIcon: "telegram",
    brandColor: "#26A5E4",
  },
  whatsapp: {
    slug: "whatsapp",
    category: "messaging",
    simpleIcon: "whatsapp",
    brandColor: "#25D366",
  },
  messenger: {
    slug: "messenger",
    category: "messaging",
    simpleIcon: "facebook",
    brandColor: "#0866FF",
  },
  x: {
    slug: "x",
    category: "messaging",
    simpleIcon: "x",
    brandColor: "#000000",
  },
  sendblue: {
    slug: "sendblue",
    category: "messaging",
    brandColor: "#0B5FFF",
  },
  discord: {
    slug: "discord",
    category: "messaging",
    simpleIcon: "discord",
    brandColor: "#5865F2",
  },
  gchat: {
    slug: "gchat",
    category: "collaboration",
    simpleIcon: "googlechat",
    brandColor: "#00AC47",
  },
  teams: {
    slug: "teams",
    category: "collaboration",
    brandColor: "#464EB8",
  },
  github: {
    slug: "github",
    category: "developer",
    simpleIcon: "github",
    brandColor: "#181717",
  },
  linear: {
    slug: "linear",
    category: "developer",
    simpleIcon: "linear",
    brandColor: "#5E6AD2",
  },
  resend: {
    slug: "resend",
    category: "email",
    simpleIcon: "resend",
    brandColor: "#000000",
  },
};

export const CONNECTOR_CATEGORY_ORDER: ConnectorCategory[] = [
  "messaging",
  "collaboration",
  "developer",
  "email",
];
