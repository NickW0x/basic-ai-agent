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
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { AttachmentPreviewBar } from "@/components/chat/attachment-preview";
import { Button } from "@/components/ui/button";
import {
  CHAT_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_VISION_MODEL_ID,
  getModelById,
} from "@/lib/chat-config";
import type { ChatStatus } from "ai";
import type { UseEveAgentStatus } from "eve/react";
import { ChevronDownIcon, ChevronUpIcon, GlobeIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ComposerStatus = ChatStatus | UseEveAgentStatus;

interface PromptAreaProps {
  status: ComposerStatus;
  voiceMode?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onSubmit: (
    message: PromptInputMessage,
    options: { model: string; webSearch: boolean },
  ) => void;
  onStop: () => void;
}

/** Send recorded audio to server STT for Firefox/Safari fallback. */
async function transcribeAudioBlob(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");

  const response = await fetch("/api/transcribe", {
    body: formData,
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string }).error ?? "Transcription failed",
    );
  }

  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

export function PromptArea({
  status,
  voiceMode = false,
  onListeningChange,
  onSubmit,
  onStop,
}: PromptAreaProps) {
  const [text, setText] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL_ID);
  const [webSearch, setWebSearch] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

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

  const handleAudioRecorded = useCallback(async (audioBlob: Blob) => {
    try {
      return await transcribeAudioBlob(audioBlob);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Transcription unavailable",
      );
      return "";
    }
  }, []);

  const handleTranscriptionChange = useCallback(
    (transcript: string) => {
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      onListeningChange?.(false);
    },
    [onListeningChange],
  );

  const submitStatus =
    status === "streaming" || status === "submitted" ? status : "ready";

  const isBusy = status === "streaming" || status === "submitted";
  const showCollapsedComposer = voiceMode && !showTextInput;

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
      {showCollapsedComposer ? (
        <PromptInputBody>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="truncate text-muted-foreground text-sm">
              {text.trim() || "Tap mic to speak, or type a message"}
            </p>
            <Button
              className="shrink-0"
              onClick={() => setShowTextInput(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ChevronUpIcon className="mr-1 size-3.5" />
              Type instead
            </Button>
          </div>
        </PromptInputBody>
      ) : (
        <PromptInputBody>
          {voiceMode ? (
            <div className="flex justify-end px-2 pt-1">
              <Button
                className="h-7 text-xs"
                onClick={() => setShowTextInput(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <ChevronDownIcon className="mr-1 size-3.5" />
                Collapse
              </Button>
            </div>
          ) : null}
          <PromptInputTextarea
            disabled={isBusy}
            onChange={(event) => setText(event.currentTarget.value)}
            placeholder={voiceMode ? "Type a message…" : "Ask the agent..."}
            value={text}
          />
        </PromptInputBody>
      )}
      <PromptInputFooter>
        <PromptInputTools>
          <SpeechInput
            className="size-8"
            disabled={isBusy}
            onAudioRecorded={handleAudioRecorded}
            onListeningChange={onListeningChange}
            onTranscriptionChange={handleTranscriptionChange}
            size="icon"
            variant="ghost"
          />
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
