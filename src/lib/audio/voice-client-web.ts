import {
  base64PCM16ToFloat32,
  float32ToPCM16Base64,
} from "@/lib/voice-client/audio/pcm";
import type { VoiceAudioCapture, VoiceAudioPlayer } from "@/lib/voice-client/types";

/** PCM16 audio player for Grok Voice streaming chunks. */
export class GrokAudioPlayer implements VoiceAudioPlayer {
  private audioContext: AudioContext;
  private audioQueue: AudioBufferSourceNode[] = [];
  private nextPlayTime = 0;
  private isPlaying = false;

  constructor(sampleRate = 24000) {
    this.audioContext = new AudioContext({ sampleRate });
  }

  async playChunk(base64Audio: string): Promise<void> {
    const float32Data = base64PCM16ToFloat32(base64Audio);
    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32Data.length,
      this.audioContext.sampleRate,
    );
    const channelData = new Float32Array(float32Data.length);
    channelData.set(float32Data);
    audioBuffer.copyToChannel(channelData, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    const playTime = Math.max(currentTime, this.nextPlayTime);
    source.start(playTime);
    this.nextPlayTime = playTime + audioBuffer.duration;
    this.isPlaying = true;
    this.audioQueue.push(source);

    source.onended = () => {
      const index = this.audioQueue.indexOf(source);
      if (index > -1) {
        this.audioQueue.splice(index, 1);
      }
      if (this.audioQueue.length === 0) {
        this.isPlaying = false;
      }
    };
  }

  stop(): void {
    for (const source of this.audioQueue) {
      try {
        source.stop();
      } catch {
        // Source may have already stopped.
      }
    }
    this.audioQueue = [];
    this.nextPlayTime = 0;
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  async close(): Promise<void> {
    this.stop();
    await this.audioContext.close();
  }
}

/** Web Audio API microphone capture at 24kHz PCM16. */
export class AudioCapture implements VoiceAudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private onAudioData:
    | ((pcm16Base64: string, audioLevel: number) => void)
    | null = null;

  async start(
    onData: (pcm16Base64: string, audioLevel: number) => void,
  ): Promise<number> {
    const targetSampleRate = 24000;
    this.audioContext = new AudioContext({ sampleRate: targetSampleRate });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.onAudioData = onData;

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    let chunkCount = 0;
    this.processorNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i]! * inputData[i]!;
      }
      const rms = Math.sqrt(sum / inputData.length);

      chunkCount += 1;
      if (chunkCount <= 10 || rms < 0.01) {
        return;
      }

      const base64Audio = float32ToPCM16Base64(inputData);
      this.onAudioData?.(base64Audio, rms);
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
    return this.audioContext.sampleRate;
  }

  stop(): void {
    this.processorNode?.disconnect();
    this.processorNode = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.onAudioData = null;
  }
}

/** Web adapter for GrokVoiceClient audio player interface. */
export class WebVoiceAudioPlayer implements VoiceAudioPlayer {
  private player: GrokAudioPlayer;

  constructor(sampleRate = 24000) {
    this.player = new GrokAudioPlayer(sampleRate);
  }

  async playChunk(base64Audio: string): Promise<void> {
    await this.player.playChunk(base64Audio);
  }

  stop(): void {
    this.player.stop();
  }

  async close(): Promise<void> {
    await this.player.close();
  }

  getIsPlaying(): boolean {
    return this.player.getIsPlaying();
  }
}

/** Web adapter for GrokVoiceClient audio capture interface. */
export class WebVoiceAudioCapture implements VoiceAudioCapture {
  private capture: AudioCapture | null = null;

  async start(
    onData: (pcm16Base64: string, audioLevel: number) => void,
  ): Promise<number> {
    this.capture = new AudioCapture();
    return this.capture.start(onData);
  }

  stop(): void {
    this.capture?.stop();
    this.capture = null;
  }
}
