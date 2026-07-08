"use client";

import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { UIMessage } from "ai";
import {
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type FileUIPart,
  type ToolUIPart,
} from "ai";

interface MessagePartsProps {
  message: UIMessage;
  isStreaming?: boolean;
}

const SUBAGENT_DISPLAY_NAMES: Record<string, string> = {
  researcher: "Researcher subagent",
  analyst: "Analyst subagent",
  summarizer: "Summarizer subagent",
  coder: "Coder subagent",
  marketer: "Marketer subagent",
};

function formatToolOutput(output: ToolUIPart["output"]): string {
  if (output == null) {
    return "";
  }

  if (typeof output === "string") {
    return output;
  }

  const record = output as Record<string, unknown>;

  if ("location" in record && "temperatureF" in record) {
    return `**${record.location}**: ${record.temperatureF}°F, ${record.condition}`;
  }

  if ("expression" in record && "result" in record) {
    return `${record.expression} = **${record.result}**`;
  }

  if ("answer" in record && record.answer) {
    return String(record.answer);
  }

  if ("message" in record && record.message) {
    return String(record.message);
  }

  if ("results" in record && Array.isArray(record.results)) {
    return record.results
      .map((result: { title?: string; snippet?: string; url?: string }) => {
        const title = result.title ?? "Result";
        const snippet = result.snippet ?? "";
        const url = result.url ?? "";
        return `- **${title}**${snippet ? `: ${snippet}` : ""}${url ? ` (${url})` : ""}`;
      })
      .join("\n");
  }

  if ("variants" in record && Array.isArray(record.variants)) {
    return record.variants
      .map(
        (variant: {
          platform?: string;
          text?: string;
          charCount?: number;
          limit?: number;
          withinLimit?: boolean;
        }) => {
          const platform = variant.platform ?? "unknown";
          const text = variant.text ?? "";
          const count = variant.charCount ?? text.length;
          const limit = variant.limit ?? "?";
          const status = variant.withinLimit ? "ok" : "truncated";
          return `- **${platform}** (${count}/${limit}, ${status}): ${text}`;
        },
      )
      .join("\n\n");
  }

  if ("matches" in record && Array.isArray(record.matches)) {
    return record.matches
      .map(
        (match: { path?: string; line?: number; text?: string }) =>
          `- \`${match.path}:${match.line}\` ${match.text ?? ""}`,
      )
      .join("\n");
  }

  if ("files" in record && Array.isArray(record.files)) {
    return record.files.map((file: string) => `- \`${file}\``).join("\n");
  }

  if ("path" in record && "content" in record) {
    const path = String(record.path);
    const start = record.startLine ? `:${record.startLine}` : "";
    const end = record.endLine ? `-${record.endLine}` : "";
    return `**\`${path}${start}${end}\`**\n\n\`\`\`\n${String(record.content)}\n\`\`\``;
  }

  if ("text" in record && "url" in record) {
    const title = record.title ? `**${String(record.title)}**\n\n` : "";
    return `${title}${String(record.text).slice(0, 2000)}`;
  }

  return JSON.stringify(output, null, 2);
}

// Renders a single message part: text, tool call, or file attachment.
export function MessageParts({ message, isStreaming }: MessagePartsProps) {
  const hasVisibleContent = message.parts.some(
    (part) =>
      part.type === "text" ||
      isToolUIPart(part) ||
      part.type === "file",
  );

  if (isStreaming && !hasVisibleContent) {
    return <Shimmer className="text-sm">Thinking...</Shimmer>;
  }

  return (
    <>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${part.type}-${index}`;

        if (part.type === "text") {
          return (
            <MessageResponse key={key}>{part.text}</MessageResponse>
          );
        }

        if (isToolUIPart(part)) {
          const toolName = getToolName(part);
          const displayName =
            SUBAGENT_DISPLAY_NAMES[toolName] ?? toolName;

          const toolHeaderProps =
            part.type === "dynamic-tool"
              ? {
                  type: part.type as DynamicToolUIPart["type"],
                  state: part.state,
                  toolName: displayName,
                }
              : {
                  type: part.type as ToolUIPart["type"],
                  state: part.state,
                };

          return (
            <Tool defaultOpen={part.state === "output-available"} key={key}>
              <ToolHeader {...toolHeaderProps} />
              <ToolContent>
                {"input" in part && part.input != null ? (
                  <ToolInput input={part.input} />
                ) : null}
                <ToolOutput
                  errorText={part.errorText}
                  output={
                    part.state === "output-available" ? (
                      <MessageResponse>
                        {formatToolOutput(part.output)}
                      </MessageResponse>
                    ) : null
                  }
                />
              </ToolContent>
            </Tool>
          );
        }

        if (part.type === "file") {
          const filePart = part as FileUIPart & { id?: string };

          return (
            <Attachments key={key} variant="grid">
              <Attachment
                data={{
                  ...filePart,
                  id: filePart.id ?? `${message.id}-file-${index}`,
                }}
              >
                <AttachmentPreview />
                <AttachmentInfo showMediaType />
              </Attachment>
            </Attachments>
          );
        }

        return null;
      })}
    </>
  );
}
