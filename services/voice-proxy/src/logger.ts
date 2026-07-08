/**
 * Structured JSON logger for the voice-proxy service.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerContext {
  module?: string;
  connectionId?: string;
  agentId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
  child(extraContext: LoggerContext): Logger;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL =
  LEVEL_ORDER[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? LEVEL_ORDER.info;

function normalizeMeta(meta: unknown): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) {
    return undefined;
  }
  if (meta instanceof Error) {
    return { err: meta.message, stack: meta.stack };
  }
  if (typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return { data: meta };
}

function emit(level: LogLevel, ctx: LoggerContext, msg: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < MIN_LEVEL) {
    return;
  }

  const line = {
    timestamp: new Date().toISOString(),
    level,
    service: "grok-voice-proxy",
    ...ctx,
    msg,
    ...normalizeMeta(meta),
  };

  const out = JSON.stringify(line);
  if (level === "error" || level === "warn") {
    process.stderr.write(`${out}\n`);
  } else {
    process.stdout.write(`${out}\n`);
  }
}

export function createLogger(initialContext: LoggerContext = {}): Logger {
  const context = { ...initialContext };
  return {
    debug: (msg, meta) => emit("debug", context, msg, meta),
    info: (msg, meta) => emit("info", context, msg, meta),
    warn: (msg, meta) => emit("warn", context, msg, meta),
    error: (msg, meta) => emit("error", context, msg, meta),
    child: (extraContext) => createLogger({ ...context, ...extraContext }),
  };
}
