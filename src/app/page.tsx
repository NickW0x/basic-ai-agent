/** @jsxImportSource react */
"use client";

import { useChat } from "@chat-adapter/web/react";
import { useState } from "react";

function renderPart(part: { type: string; [key: string]: unknown }, key: string) {
  if (part.type === "text" && typeof part.text === "string") {
    return <p key={key}>{part.text}</p>;
  }

  if (part.type.startsWith("tool-")) {
    return (
      <pre
        key={key}
        style={{
          margin: "0.5rem 0",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          background: "#18181b",
          fontSize: "0.8rem",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(part, null, 2)}
      </pre>
    );
  }

  return null;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat();

  return (
    <main
      style={{
        maxWidth: "42rem",
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem 6rem",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Basic AI Agent</h1>
        <p style={{ margin: "0.5rem 0 0", color: "#a1a1aa" }}>
          Powered by Vercel AI SDK and Chat SDK
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
        {messages.length === 0 ? (
          <p style={{ color: "#71717a" }}>
            Ask about the weather, request a calculation, or say hello.
          </p>
        ) : null}

        {messages.map((message) => (
          <article
            key={message.id}
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: message.role === "user" ? "#18181b" : "#111827",
              border: "1px solid #27272a",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#a1a1aa",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
              }}
            >
              {message.role}
            </div>
            {message.parts.map((part, index) =>
              renderPart(part, `${message.id}-${index}`),
            )}
          </article>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const text = input.trim();
          if (!text || status === "streaming") return;
          sendMessage({ text });
          setInput("");
        }}
        style={{
          position: "fixed",
          left: "50%",
          bottom: "1rem",
          transform: "translateX(-50%)",
          width: "min(42rem, calc(100% - 2rem))",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the agent..."
          disabled={status === "streaming"}
          style={{
            flex: 1,
            padding: "0.875rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid #3f3f46",
            background: "#18181b",
            color: "#f4f4f5",
          }}
        />
        {status === "streaming" ? (
          <button
            type="button"
            onClick={() => stop()}
            style={{
              padding: "0 1rem",
              borderRadius: "0.75rem",
              border: "1px solid #3f3f46",
              background: "#27272a",
              color: "#f4f4f5",
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              padding: "0 1rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: input.trim() ? "pointer" : "not-allowed",
              opacity: input.trim() ? 1 : 0.6,
            }}
          >
            Send
          </button>
        )}
      </form>
    </main>
  );
}