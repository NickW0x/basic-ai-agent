"use client";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { AttachmentPreviewBar } from "@/components/chat/attachment-preview";
import {
  CHAT_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_VISION_MODEL_ID,
  getModelById,
} from "@/lib/chat-config";
import type { ChatStatus } from "ai";
import type { UseEveAgentStatus } from "eve/react";
import { GlobeIcon } from "lucide-react";
import { useCallback, useState } from "react";

type ComposerStatus = ChatStatus | UseEveAgentStatus;

interface PromptAreaProps {
  status: ComposerStatus;
  onSubmit: (
    message: PromptInputMessage,
    options: { model: string; webSearch: boolean },
  ) => void;
  onStop: () => void;
}

export function PromptArea({ status, onSubmit, onStop }: PromptAreaProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL_ID);
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);

      if (!hasText && !hasAttachments) {
        return;
      }

      // Switch to a vision model when files are attached and current model lacks vision.
      let selectedModel = model;
      const currentModel = getModelById(model);

      if (hasAttachments && currentModel && !currentModel.vision) {
        selectedModel = DEFAULT_VISION_MODEL_ID;
        setModel(selectedModel);
      }

      onSubmit(message, { model: selectedModel, webSearch });
      setText("");
    },
    [model, onSubmit, webSearch],
  );

  const submitStatus =
    status === "streaming" || status === "submitted" ? status : "ready";

  return (
    <PromptInput
      className="w-full"
      globalDrop
      multiple
      onSubmit={handleSubmit}
    >
      <PromptInputHeader>
        <AttachmentPreviewBar />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          disabled={status === "streaming" || status === "submitted"}
          onChange={(event) => setText(event.currentTarget.value)}
          placeholder="Ask the agent..."
          value={text}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            onClick={() => setWebSearch((current) => !current)}
            tooltip={{ content: "Search the web" }}
            variant={webSearch ? "default" : "ghost"}
          >
            <GlobeIcon className="size-4" />
            <span className="hidden sm:inline">Search</span>
          </PromptInputButton>
          <PromptInputSelect onValueChange={setModel} value={model}>
            <PromptInputSelectTrigger className="w-[180px]">
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {CHAT_MODELS.map((chatModel) => (
                <PromptInputSelectItem key={chatModel.id} value={chatModel.id}>
                  {chatModel.name}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!text.trim() && status === "ready"}
          onStop={onStop}
          status={submitStatus}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
