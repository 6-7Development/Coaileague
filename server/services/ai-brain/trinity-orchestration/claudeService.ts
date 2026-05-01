/**
 * Claude Service — real Anthropic API integration for Trinity's Claude brain
 * Uses the actual claude-sonnet-4-6 model (production) or claude-haiku-4-5 (dev)
 *
 * @anthropic-ai/sdk is loaded via dynamic import so that the absence of the
 * package in install-time only environments doesn't break tsc. Runtime callers
 * must have the package installed; otherwise the call throws.
 */
import { createLogger } from '../../../lib/logger';
const log = createLogger('ClaudeService');

type AnthropicMessageParam = { role: 'user' | 'assistant'; content: string };

let _client: any | null = null;
async function getClient(): Promise<any> {
  if (_client) return _client;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — module may not be installed in every workspace
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = process.env.NODE_ENV === 'production' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';

export const claudeService = {
  async call(prompt: string, systemPrompt?: string, maxTokens = 1024): Promise<string> {
    try {
      const client = await getClient();
      const messages: AnthropicMessageParam[] = [{ role: 'user', content: prompt }];
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt ?? 'You are Trinity, an intelligent AI operations assistant for security workforce management.',
        messages,
      });
      const text = (response.content as any[]).find((b: any) => b.type === 'text')?.text ?? '';
      log.debug(`[ClaudeService] ${MODEL} responded (${response.usage.output_tokens} tokens)`);
      return text;
    } catch (err: any) {
      log.error(`[ClaudeService] API call failed: ${err?.message}`);
      throw err;
    }
  },

  async callWithContext(messages: AnthropicMessageParam[], systemPrompt?: string): Promise<string> {
    try {
      const client = await getClient();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt ?? 'You are Trinity, an intelligent AI operations assistant.',
        messages,
      });
      return (response.content as any[]).find((b: any) => b.type === 'text')?.text ?? '';
    } catch (err: any) {
      log.error(`[ClaudeService] Context call failed: ${err?.message}`);
      throw err;
    }
  },
};
