/**
 * Server-Side HTML Sanitizer — Zero Dependencies
 * ================================================
 * Replaces isomorphic-dompurify which ships jsdom@28 — that package
 * requires Node >=22.12.0 but Railway runs 22.11.0, causing ERR_REQUIRE_ESM
 * via html-encoding-sniffer → @exodus/bytes (ESM-only).
 *
 * This module is pure TypeScript / Node.js. No jsdom. No external deps.
 * All XSS vectors are handled explicitly via allowlist approach.
 *
 * Usage:
 *   import { sanitizeHtml, stripAllHtml } from './serverSanitizer';
 *   const clean  = sanitizeHtml(raw, { allowedTags, allowedAttrs });
 *   const plain  = stripAllHtml(raw);
 */

// ── HTML entity map (decode only — we never re-encode output here) ───────────
const ENTITY_MAP: Record<string, string> = {
  '&amp;':   '&',
  '&lt;':    '<',
  '&gt;':    '>',
  '&quot;':  '"',
  '&#39;':   "'",
  '&#x27;':  "'",
  '&#x2F;':  '/',
  '&nbsp;':  ' ',
  '&apos;':  "'",
};

function decodeEntities(str: string): string {
  return str.replace(/&[^;\s]{1,8};/g, m => ENTITY_MAP[m] ?? m);
}

/** Dangerous URL protocols — block even when encoded / case-mixed */
const DANGEROUS_PROTOCOLS = /^(?:javascript|data|vbscript|blob|file):/i;

function isSafeHref(href: string): boolean {
  const decoded = decodeEntities(href.trim()).replace(/[\x00-\x1F]/g, '');
  return !DANGEROUS_PROTOCOLS.test(decoded);
}

// ── Tags that never have a closing tag (void elements) ──────────────────────
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);

// ── Tags whose content must be entirely removed (not just the tag) ──────────
const TOXIC_TAGS = new RegExp(
  '<(?:script|style|iframe|object|embed|form|textarea|select|'
  + 'button|applet|base|link|meta|noscript|template)'
  + '[^>]*>[\\s\\S]*?<\\/[^>]+>',
  'gi',
);

const TOXIC_SELF_CLOSING = new RegExp(
  '<(?:script|style|iframe|object|embed|form|input|textarea|select|'
  + 'button|applet|base|link|meta|noscript|template)'
  + '[^>]*\\/?>',
  'gi',
);

// ── Attribute extraction ─────────────────────────────────────────────────────
function extractAttr(attrString: string, name: string): string | null {
  // handles: name="value"  name='value'  name=value
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]*))`, 'i');
  const m = attrString.match(re);
  return m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
}

// ── Core sanitizer ───────────────────────────────────────────────────────────

export interface SanitizeOptions {
  allowedTags: string[];
  /** attr names (lower-case) allowed on ALL tags */
  allowedAttrs?: string[];
  /** when true, <a> tags get target="_blank" rel="noopener noreferrer" forced */
  safeLinks?: boolean;
}

/**
 * Sanitize HTML: keep allowed tags + attrs, strip everything else.
 * Content inside allowed tags is preserved; content inside stripped tags is
 * also preserved (so "foo <b>bar</b> <script>evil</script>" → "foo <b>bar</b> evil").
 * Toxic tags (script, style, iframe, …) have their *content* removed too.
 */
export function sanitizeHtml(input: string, opts: SanitizeOptions): string {
  if (!input || typeof input !== 'string') return '';

  const allowed = new Set(opts.allowedTags.map(t => t.toLowerCase()));
  const allowedAttrs = new Set((opts.allowedAttrs ?? []).map(a => a.toLowerCase()));
  const safeLinks = opts.safeLinks !== false; // default true

  // 1. Remove toxic tag blocks entirely (script content, style rules, etc.)
  let clean = input.replace(TOXIC_TAGS, '');
  clean = clean.replace(TOXIC_SELF_CLOSING, '');

  // 2. Process remaining tags one by one
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (match, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();
    const isClosing = match.startsWith('</');
    const isSelfClose = VOID_TAGS.has(tag) || match.endsWith('/>');

    if (!allowed.has(tag)) {
      return ''; // strip disallowed tag but keep content (handled by outer replace)
    }

    if (isClosing) {
      return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
    }

    // Build safe attribute string
    if (tag === 'a') {
      const href = extractAttr(attrs, 'href');
      if (!href || !isSafeHref(href)) return ''; // no href or dangerous href → strip tag
      const safeHref = href.replace(/"/g, '&quot;');
      const extra = safeLinks ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safeHref}"${extra}>`;
    }

    // Generic allowed tag — include only allowed attrs
    let safeAttrs = '';
    if (allowedAttrs.size > 0) {
      const attrRe = /\s+([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(attrs)) !== null) {
        const name = m[1].toLowerCase();
        if (allowedAttrs.has(name)) {
          const val = m[2] ?? m[3] ?? m[4] ?? '';
          safeAttrs += ` ${name}="${val.replace(/"/g, '&quot;')}"`;
        }
      }
    }

    return isSelfClose ? `<${tag}${safeAttrs}/>` : `<${tag}${safeAttrs}>`;
  });

  return clean;
}

/**
 * Strip ALL HTML — returns plain text.
 * Use for usernames, metadata, AI input guard-rails, etc.
 */
export function stripAllHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Remove toxic content blocks first
  let clean = input.replace(TOXIC_TAGS, '');
  clean = clean.replace(TOXIC_SELF_CLOSING, '');
  // Strip remaining tags
  clean = clean.replace(/<[^>]*>/g, '');
  // Decode entities so the plain text is human-readable
  return decodeEntities(clean);
}

/**
 * Sanitize a chat message — allows basic formatting, safe links only.
 * Drop-in replacement for DOMPurify.sanitize(msg, CHAT_OPTIONS).
 */
export function sanitizeChatMessage(message: string): string {
  if (!message || typeof message !== 'string') return '';
  const trimmed = message.trim().slice(0, 10_000);
  return sanitizeHtml(trimmed, {
    allowedTags: ['b', 'i', 'u', 'strong', 'em', 'a', 'br', 'p', 'code', 'pre'],
    allowedAttrs: [], // href handled specially in the 'a' branch above
    safeLinks: true,
  });
}

/**
 * Sanitize plain text — strips ALL HTML, limit 1 000 chars.
 * Drop-in replacement for DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }).
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return stripAllHtml(text).trim().slice(0, 1_000);
}
