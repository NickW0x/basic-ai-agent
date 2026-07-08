/** Strip internal identifiers from tool output shown to the voice model. */
export function stripMachineIdentifiers(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMachineIdentifiers);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !/(^id$|Id$|SID$|Sid$|sessionId|conversationId)/.test(key))
      .map(([key, nestedValue]) => [key, stripMachineIdentifiers(nestedValue)]),
  );
}

/** Build model-facing tool output. */
export function buildVoiceModelToolOutput(_toolName: string, result: unknown): unknown {
  if (!result || typeof result !== "object") {
    return result;
  }
  return stripMachineIdentifiers(result);
}
