import { NextResponse } from "next/server";

const XAI_TRANSCRIBE_URL = "https://api.x.ai/v1/audio/transcriptions";

/** Server-side STT for SpeechInput MediaRecorder fallback (Firefox/Safari). */
export async function POST(req: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Speech transcription is not configured (XAI_API_KEY missing)" },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("file", file, "audio.webm");
    upstream.append("model", "whisper-large-v3");

    const response = await fetch(XAI_TRANSCRIBE_URL, {
      body: upstream,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[transcribe] xAI error:", response.status, detail);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status === 429 ? 429 : 500 },
      );
    }

    const data = (await response.json()) as { text?: string };
    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    console.error("[transcribe] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
