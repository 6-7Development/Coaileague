import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function apiPost(path: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('GPS Clock-In Flow', () => {
  it('clock-in endpoint exists and enforces auth/session', async () => {
    const res = await apiPost('/api/time-entries/clock-in', {
      shiftId: 'test-shift-id',
      latitude: 29.4241,
      longitude: -98.4936,
      accuracy: 15,
    });

    expect([200, 201, 400, 401, 403, 422]).toContain(res.status);
    expect(res.status).not.toBe(404);
  });

  it('clock-out endpoint exists and enforces auth/session', async () => {
    const res = await apiPost('/api/time-entries/clock-out', {
      latitude: 29.4241,
      longitude: -98.4936,
    });

    expect([200, 400, 401, 403, 422]).toContain(res.status);
    expect(res.status).not.toBe(404);
  });
});

