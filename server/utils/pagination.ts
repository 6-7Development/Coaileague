/**
 * Pagination input clamping helpers.
 *
 * Centralizes the parsing + bounds-checking of `limit` and `offset` query
 * parameters so we never interpolate unbounded user input into raw SQL.
 *
 * The Phase 7 security audit found 13 routes using
 *   `LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
 * which accepts values like `Number("1e10")` (10 billion) — feasible DoS
 * vector that lets a single request trigger an unbounded result set scan.
 *
 * Use clampLimit() / clampOffset() for raw-SQL pagination, or
 * clampPagination() to get both at once.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200; // Hard ceiling for any single request
const DEFAULT_OFFSET = 0;
const MAX_OFFSET = 100_000; // Practical ceiling — past this use cursor pagination

/**
 * Parse and clamp a `limit` query parameter into a safe integer.
 * Always returns a positive integer in [1, MAX_LIMIT].
 */
export function clampLimit(input: unknown, fallback = DEFAULT_LIMIT, max = MAX_LIMIT): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return Math.min(Math.max(1, fallback), max);
  return Math.min(Math.max(1, Math.floor(n)), max);
}

/**
 * Parse and clamp an `offset` query parameter into a safe integer.
 * Always returns a non-negative integer in [0, MAX_OFFSET].
 */
export function clampOffset(input: unknown, max = MAX_OFFSET): number {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_OFFSET;
  return Math.min(Math.floor(n), max);
}

/**
 * Convenience: parse and clamp both limit and offset in one call.
 */
export function clampPagination(
  rawLimit: unknown,
  rawOffset: unknown,
  opts: { defaultLimit?: number; maxLimit?: number; maxOffset?: number } = {}
): { limit: number; offset: number } {
  return {
    limit: clampLimit(rawLimit, opts.defaultLimit ?? DEFAULT_LIMIT, opts.maxLimit ?? MAX_LIMIT),
    offset: clampOffset(rawOffset, opts.maxOffset ?? MAX_OFFSET),
  };
}
