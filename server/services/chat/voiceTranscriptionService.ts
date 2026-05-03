/**
 * Voice Message Transcription Service
 *
 * When a user sends a voice note in ChatDock, this service:
 * 1. Fetches the audio file from object storage
 * 2. Transcribes via OpenAI Whisper API
 * 3. Returns the transcript text
 *
 * Called from ChatServerHub when a message contains [Shared audio]
 */

import OpenAI from 'openai';
import { createLogger } from '../../lib/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

const log = createLogger('VoiceTranscription');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function transcribeVoiceMessage(audioUrl: string): Promise<string | null> {
  if (!openai) {
    log.warn('[Transcription] OpenAI not configured — skipping transcription');
    return null;
  }

  if (!audioUrl || typeof audioUrl !== 'string') {
    return null;
  }

  let tmpPath: string | null = null;
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      log.warn('[Transcription] Failed to fetch audio:', audioUrl, response.status);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 25 * 1024 * 1024) {
      log.warn('[Transcription] Audio too large or empty:', buffer.length);
      return null;
    }

    const extMatch = audioUrl.match(/\.(webm|mp3|wav|m4a|ogg|mp4)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'webm';
    tmpPath = path.join(os.tmpdir(), `voice-${randomUUID()}.${ext}`);

    fs.writeFileSync(tmpPath, buffer);
    const fileStream = fs.createReadStream(tmpPath);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    const text = typeof transcription === 'string'
      ? transcription
      : ((transcription as Record<string,unknown>)?.text || null);

    return text && text.trim().length > 0 ? text.trim() : null;
  } catch (err: unknown) {
    log.warn('[Transcription] Error:', (err instanceof Error ? err.message : String(err)));
    return null;
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch { /* non-fatal */ }
    }
  }
}

// ── Wave 5 / Task 5: Gemini Live streaming transcription path (G-9) ──────────
// Parallel transcription path using Gemini for real-time or near-real-time
// voice note transcription. Used as primary when GEMINI_API_KEY is set;
// Whisper above is the fallback.
//
// For ChatDock voice notes (stored files), Gemini Flash is used for fast
// single-shot transcription. For the Twilio Media Stream live bridge,
// the full Gemini Live session in geminiLiveBridge.ts handles the audio.

export async function transcribeWithGemini(audioUrl: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // Fetch the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 20 * 1024 * 1024) return null;

    const extMatch = audioUrl.match(/\.(webm|mp3|wav|m4a|ogg|opus)(?:\?|$)/i);
    const ext = extMatch?.[1]?.toLowerCase() || 'webm';

    // Gemini Flash transcription via REST API
    const base64Audio = buffer.toString('base64');
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/webm';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Transcribe this audio exactly. Return only the transcript text, nothing else.' },
              { inline_data: { mime_type: mimeType, data: base64Audio } },
            ],
          }],
        }),
      }
    );

    if (!geminiRes.ok) return null;

    const data = await geminiRes.json() as Record<string, unknown>;
    const text = (
      ((data.candidates as unknown[])?.[0] as Record<string, unknown>)
        ?.content as Record<string, unknown>
    )?.parts;

    if (Array.isArray(text) && text.length > 0) {
      const transcript = (text[0] as Record<string, unknown>)?.text as string | undefined;
      return transcript?.trim() || null;
    }

    return null;
  } catch (err: unknown) {
    log.warn('[Transcription/Gemini] Error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * transcribeVoiceMessageAuto — smart transcription router.
 * Uses Gemini if GEMINI_API_KEY is set (faster, multimodal).
 * Falls back to Whisper if OPENAI_API_KEY is set.
 * Returns null if neither is configured.
 */
export async function transcribeVoiceMessageAuto(audioUrl: string): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) {
    const geminiResult = await transcribeWithGemini(audioUrl);
    if (geminiResult) return geminiResult;
  }
  // Whisper fallback
  return transcribeVoiceMessage(audioUrl);
}
