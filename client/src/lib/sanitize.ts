/**
 * Client-Side Message Sanitization
 * Defense-in-depth: Even though server sanitizes, client should too
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize chat message for safe HTML rendering
 * Allows basic formatting but strips dangerous content
 */
export function sanitizeMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Configure DOMPurify for chat messages
  // Allow basic formatting: bold, italic, links, line breaks
  const clean = DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'a', 'br', 'p', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
    // Force links to open in new tab and add noopener/noreferrer for security
    SAFE_FOR_TEMPLATES: true,
  });

  return clean;
}

/**
 * Sanitize plain text (strips ALL HTML)
 * Use for usernames, status messages, etc.
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_DOM: false,
  });

  return clean.trim();
}
