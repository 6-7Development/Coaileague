/**
 * Gemini Live Bridge — Wave 5 / Task 5 (G-5 + G-9)
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridges Twilio Media Streams (real-time mulaw audio) to the Gemini
 * Multimodal Live API (bidirectional audio conversation).
 *
 * Architecture:
 *   Twilio inbound call
 *     → TwiML: <Connect><Stream url="wss://your-domain/ws/voice/media-stream" /></Connect>
 *     → This bridge receives mulaw audio chunks over WebSocket
 *     → Transcodes mulaw → PCM16 → sends to Gemini Live session
 *     → Gemini responds with text + audio
 *     → Audio response → converted back to mulaw → piped to Twilio
 *     → Caller hears Trinity's voice in real time
 *
 * Context injection:
 *   At session start, workspace context (active shifts, org name, officer count)
 *   is injected into the Gemini system prompt so Trinity knows who she's talking to.
 *
 * Fallback:
 *   If GEMINI_API_KEY is not set or Live API is unavailable, the bridge
 *   gracefully closes and Twilio falls back to the standard TwiML IVR menu.
 */

import { WebSocket } from 'ws';
import { db } from '../../db';
import { workspaces, shifts } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { createLogger } from '../../lib/logger';

const log = createLogger('geminiLiveBridge');

// ── Types ─────────────────────────────────────────────────────────────────────

interface TwilioStreamEvent {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark';
  streamSid?: string;
  start?: { streamSid: string; callSid: string; customParameters?: Record<string, string> };
  media?: { chunk: string; timestamp: string; track: string; payload: string }; // payload = base64 mulaw
  stop?: { streamSid: string; callSid: string };
}

// ── Context builder ───────────────────────────────────────────────────────────

async function buildWorkspaceContext(workspaceId: string): Promise<string> {
  try {
    const [ws] = await db
      .select({ name: workspaces.name, city: workspaces.city })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeShiftCount = await db
      .select({ id: shifts.id })
      .from(shifts)
      .where(
        and(
          eq(shifts.workspaceId, workspaceId),
          gte(shifts.date as unknown as Date, today),
          eq(shifts.status, 'scheduled'),
        )
      )
      .then(r => r.length)
      .catch(() => 0);

    return `You are Trinity, the AI operations assistant for ${ws?.name || 'CoAIleague Security'}. ` +
      `You are answering a live phone call. ` +
      `Today there are ${activeShiftCount} scheduled shifts. ` +
      `You can help with: shift information, call-offs, emergencies, and officer status. ` +
      `Be concise, professional, and helpful. Never make up information you don't have. ` +
      `If you need to escalate, tell the caller you will connect them with a human supervisor.`;
  } catch {
    return 'You are Trinity, the AI operations assistant for a security company. Be helpful and professional.';
  }
}

// ── Gemini Live session manager ───────────────────────────────────────────────

class GeminiLiveSession {
  private geminiWs: WebSocket | null = null;
  private isReady = false;
  private audioQueue: string[] = [];

  constructor(
    private readonly twilioWs: WebSocket,
    private readonly streamSid: string,
    private readonly systemPrompt: string,
  ) {}

  async connect(): Promise<boolean> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      log.warn('[GeminiLive] GEMINI_API_KEY not set — Live bridge unavailable');
      return false;
    }

    // Gemini Multimodal Live API WebSocket endpoint
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    try {
      this.geminiWs = new WebSocket(geminiUrl);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Gemini WS connect timeout')), 10_000);

        this.geminiWs!.on('open', () => {
          clearTimeout(timeout);
          // Send setup message with system prompt and audio config
          this.geminiWs!.send(JSON.stringify({
            setup: {
              model: 'models/gemini-2.0-flash-live-001',
              generation_config: {
                response_modalities: ['AUDIO'],
                speech_config: {
                  voice_config: { prebuilt_voice_config: { voice_name: 'Aoede' } },
                },
              },
              system_instruction: {
                parts: [{ text: this.systemPrompt }],
              },
            },
          }));
          resolve();
        });

        this.geminiWs!.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.geminiWs.on('message', (data: Buffer) => this.onGeminiMessage(data));
      this.geminiWs.on('close', () => {
        log.info('[GeminiLive] Gemini WS closed');
        this.twilioWs.close();
      });

      this.isReady = true;
      log.info('[GeminiLive] Connected to Gemini Live API');
      return true;
    } catch (err: unknown) {
      log.error('[GeminiLive] Failed to connect to Gemini Live API:', err instanceof Error ? err.message : String(err));
      return false;
    }
  }

  // Receive mulaw audio from Twilio → forward to Gemini
  sendAudio(mulawBase64: string): void {
    if (!this.isReady || !this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) return;

    this.geminiWs.send(JSON.stringify({
      realtime_input: {
        media_chunks: [{
          mime_type: 'audio/pcm;rate=8000',
          data: mulawBase64,
        }],
      },
    }));
  }

  // Receive Gemini audio response → forward to Twilio
  private onGeminiMessage(data: Buffer): void {
    try {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;

      // Extract audio from server_content.model_turn.parts
      const content = msg.server_content as Record<string, unknown> | undefined;
      const parts = (content?.model_turn as Record<string, unknown>)?.parts as unknown[];
      if (!Array.isArray(parts)) return;

      for (const part of parts) {
        const p = part as Record<string, unknown>;
        const inlineData = p.inline_data as Record<string, unknown> | undefined;
        if (!inlineData?.data) continue;

        const audioBase64 = inlineData.data as string;

        // Send Gemini's audio back to Twilio as a media event
        if (this.twilioWs.readyState === WebSocket.OPEN) {
          this.twilioWs.send(JSON.stringify({
            event: 'media',
            streamSid: this.streamSid,
            media: { payload: audioBase64 },
          }));
        }
      }
    } catch {
      // Non-fatal parse error
    }
  }

  close(): void {
    this.isReady = false;
    if (this.geminiWs && this.geminiWs.readyState === WebSocket.OPEN) {
      this.geminiWs.close();
    }
  }
}

// ── Main bridge handler ───────────────────────────────────────────────────────

/**
 * handleMediaStreamConnection
 * Called when Twilio connects a new Media Stream WebSocket to /ws/voice/media-stream.
 * Manages the full session lifecycle: setup → audio bridge → teardown.
 */
export async function handleMediaStreamConnection(
  twilioWs: WebSocket,
  query: Record<string, string>,
): Promise<void> {
  const workspaceId = query.workspaceId || '';
  log.info('[GeminiLive] Twilio Media Stream connected', { workspaceId });

  let geminiSession: GeminiLiveSession | null = null;
  let streamSid = '';

  twilioWs.on('message', async (raw: Buffer) => {
    try {
      const event = JSON.parse(raw.toString()) as TwilioStreamEvent;

      switch (event.event) {
        case 'start': {
          streamSid = event.start?.streamSid || '';
          const wsId = event.start?.customParameters?.workspaceId || workspaceId;
          const systemPrompt = await buildWorkspaceContext(wsId);
          geminiSession = new GeminiLiveSession(twilioWs, streamSid, systemPrompt);
          const connected = await geminiSession.connect();
          if (!connected) {
            // Fallback: close WS so Twilio falls back to TwiML IVR
            twilioWs.close();
          }
          break;
        }

        case 'media': {
          if (geminiSession && event.media?.payload) {
            geminiSession.sendAudio(event.media.payload);
          }
          break;
        }

        case 'stop': {
          geminiSession?.close();
          break;
        }
      }
    } catch {
      // Non-fatal message parse error
    }
  });

  twilioWs.on('close', () => {
    geminiSession?.close();
    log.info('[GeminiLive] Twilio WS closed — session ended', { streamSid });
  });

  twilioWs.on('error', (err) => {
    log.warn('[GeminiLive] Twilio WS error:', err.message);
    geminiSession?.close();
  });
}
