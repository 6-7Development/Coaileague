/**
 * Trinity Web Search — Live Knowledge via Gemini Google Search Grounding
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Gemini's built-in Google Search tool — already included in the
 * GEMINI_API_KEY subscription, no extra cost, no extra API keys.
 *
 * When Trinity is asked about something potentially outdated or missing
 * from her database, she calls Gemini with the googleSearch tool enabled.
 * Gemini automatically searches Google, reads the results, and answers
 * with inline citations. No Puppeteer. No Chromium. Pure API call.
 *
 * TIERS:
 *   1. Gemini Google Search grounding (primary — free, already configured)
 *   2. Direct URL fetch             (free, built-in Node fetch)
 *   3. Serper / Tavily              (optional env keys for structured results)
 */

import { createLogger } from '../../lib/logger';
const log = createLogger('TrinityWebSearch');

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface FetchResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  success: boolean;
  error?: string;
}

export interface WebSearchResult {
  query: string;
  answer?: string;           // Gemini's synthesized answer (with grounding)
  results: SearchResult[];
  citations: string[];
  tier: 'gemini_grounding' | 'serper' | 'tavily' | 'fetch' | 'fallback';
}

// ── Tier 1: Gemini Google Search Grounding ────────────────────────────────────

async function searchWithGeminiGrounding(query: string): Promise<WebSearchResult> {
  try {
    // Lazy import to avoid circular deps at startup
    const { geminiClient } = await import('./providers/geminiClient');
    const result = await (geminiClient as {
      generateWithSearch?: (prompt: string) => Promise<{ text: string; citations: string[] }>
    }).generateWithSearch?.(
      `Search for current, accurate information to answer this question. Be concise and cite your sources.\n\nQuestion: ${query}`
    );

    if (result && result.text) {
      log.info(`[TrinityWebSearch] Gemini grounding: ${result.citations.length} citations`);
      return {
        query,
        answer: result.text,
        results: result.citations.map(url => ({ title: url, url, snippet: '' })),
        citations: result.citations,
        tier: 'gemini_grounding',
      };
    }
  } catch (err: unknown) {
    log.warn(`[TrinityWebSearch] Gemini grounding failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { query, results: [], citations: [], tier: 'fallback' };
}

// ── Tier 2: Direct URL Fetch ──────────────────────────────────────────────────

export async function fetchUrl(url: string, maxChars = 8000): Promise<FetchResult> {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return { url, title: '', content: '', wordCount: 0, success: false, error: 'Only HTTP/HTTPS supported' };
    }
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CoAIleague-Trinity/1.0 (AI assistant; regulatory research)', Accept: 'text/html,text/plain,application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { url, title: '', content: '', wordCount: 0, success: false, error: `HTTP ${res.status}` };

    let text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('html')) {
      text = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;/g, m => ({'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"'})[m] || m)
        .replace(/\s{2,}/g, ' ').trim();
    }
    const title = text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || parsed.hostname;
    const content = text.length > maxChars ? text.slice(0, maxChars) + `\n[Truncated — ${text.length} total chars]` : text;
    return { url, title, content, wordCount: content.split(/\s+/).length, success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, title: '', content: '', wordCount: 0, success: false, error: msg };
  }
}

// ── Tier 3: Optional structured search (Serper / Tavily) ─────────────────────

async function searchSerper(query: string): Promise<SearchResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 5, gl: 'us', hl: 'en' }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { organic?: Array<{title:string;link:string;snippet:string}> };
    return (data.organic || []).map(r => ({ title: r.title||'', url: r.link||'', snippet: r.snippet||'', source:'serper' }));
  } catch { return []; }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function trinitySearch(query: string): Promise<WebSearchResult> {
  log.info(`[TrinityWebSearch] Query: "${query.slice(0, 80)}"`);

  // Primary: Gemini Google Search grounding
  const geminiResult = await searchWithGeminiGrounding(query);
  if (geminiResult.tier === 'gemini_grounding') return geminiResult;

  // Optional: Serper structured results
  if (process.env.SERPER_API_KEY) {
    const results = await searchSerper(query);
    if (results.length > 0) return { query, results, citations: results.map(r => r.url), tier: 'serper' };
  }

  return { query, results: [], citations: [], tier: 'fallback' };
}

// ── Gemini grounding tool config (for direct model calls) ─────────────────────
export const GEMINI_GOOGLE_SEARCH_TOOL = { googleSearch: {} } as const;

// ── Knowledge gap detection ────────────────────────────────────────────────────
export function shouldSearchWeb(message: string): boolean {
  return [
    /current.*(?:law|regulation|statute|code|requirement|fee|rate)/i,
    /(?:latest|new|recent|updated|202[4-6]).*(?:rule|law|policy|requirement)/i,
    /(?:dps|tcole|bsis|flhsmv|nysdol).*(?:require|fee|renewal|process)/i,
    /(?:current|latest).*(?:tax rate|sui rate|minimum wage|overtime threshold)/i,
    /(?:irs|fica|futa|suta).*(?:202[4-6]|current|rate)/i,
    /(?:what is|what are|how do i|where can i find|look up)/i,
    /(?:not sure|unsure|don't know|confused about|unclear)/i,
    /(?:search|look up|find out|check online|verify|confirm).*(?:online|web|internet)/i,
  ].some(p => p.test(message));
}
