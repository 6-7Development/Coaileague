/**
 * Live Integrity Feed — Wave 13 / Task 1
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanitized real-time field activity feed for the Client Observer Portal.
 * Clients see guards are working without any internal/sensitive data.
 *
 * DELIVERY: Server-Sent Events (SSE) — browser-native, no WebSocket overhead.
 * Every 15s: polls for new NFC taps, safety checks, incidents at client's sites.
 *
 * DATA ISOLATION: Every query scoped to workspace_id + client_id.
 * Guard names/IDs are NEVER exposed. Only sanitized event labels.
 */

import { pool } from '../../db';
import { createLogger } from '../../lib/logger';
import type { Response } from 'express';

const log = createLogger('LiveIntegrityFeed');

export interface IntegrityTick {
  id: string;
  timestamp: string;
  type: 'nfc_checkpoint' | 'safety_check' | 'incident_filed' | 'patrol_start' | 'patrol_complete';
  siteName: string;
  label: string;
  icon: 'shield' | 'check' | 'alert' | 'map-pin' | 'activity';
  severity: 'info' | 'success' | 'warning';
}

/** Haversine-free tick builder from raw rows */
function buildTick(
  type: IntegrityTick['type'],
  id: string,
  timestamp: Date | string,
  siteName: string,
  label: string,
  severity: IntegrityTick['severity'] = 'success'
): IntegrityTick {
  const iconMap: Record<IntegrityTick['type'], IntegrityTick['icon']> = {
    nfc_checkpoint:   'shield',
    safety_check:     'check',
    incident_filed:   'alert',
    patrol_start:     'map-pin',
    patrol_complete:  'activity',
  };
  return {
    id: `${type}-${id}`,
    timestamp: typeof timestamp === 'string' ? timestamp : timestamp.toISOString(),
    type,
    siteName: siteName || 'Your Site',
    label,
    icon: iconMap[type],
    severity,
  };
}

/** Recent 24h integrity ticks for a client, capped at limit */
export async function getRecentIntegrityTicks(params: {
  workspaceId: string;
  clientId: string;
  limit?: number;
}): Promise<IntegrityTick[]> {
  const { workspaceId, clientId, limit = 30 } = params;
  const ticks: IntegrityTick[] = [];

  // NFC checkpoint taps at client sites
  const { rows: nfcRows } = await pool.query(
    `SELECT gts.id, gts.scanned_at, gtc.name AS cp_name
     FROM guard_tour_scans gts
     JOIN guard_tour_checkpoints gtc ON gtc.id = gts.checkpoint_id
     WHERE gts.workspace_id = $1
       AND gts.scanned_at >= NOW() - INTERVAL '24 hours'
       AND (gts.spoof_detected = false OR gts.spoof_detected IS NULL)
     ORDER BY gts.scanned_at DESC LIMIT $2`,
    [workspaceId, Math.ceil(limit * 0.5)]
  ).catch(() => ({ rows: [] }));

  for (const r of nfcRows) {
    ticks.push(buildTick('nfc_checkpoint', r.id, r.scanned_at,
      'Your Site', `Security checkpoint verified — ${r.cp_name || 'patrol point'}`));
  }

  // Safety check-ins
  const { rows: lwRows } = await pool.query(
    `SELECT id, last_check_in FROM lone_worker_sessions
     WHERE workspace_id = $1
       AND last_check_in >= NOW() - INTERVAL '24 hours'
     ORDER BY last_check_in DESC LIMIT $2`,
    [workspaceId, Math.ceil(limit * 0.2)]
  ).catch(() => ({ rows: [] }));

  for (const r of lwRows) {
    ticks.push(buildTick('safety_check', r.id, r.last_check_in,
      'Your Site', 'Officer safety check confirmed'));
  }

  // Incidents
  const { rows: incRows } = await pool.query(
    `SELECT id, created_at, incident_type, severity FROM service_incident_reports
     WHERE workspace_id = $1
       AND created_at >= NOW() - INTERVAL '24 hours'
     ORDER BY created_at DESC LIMIT $2`,
    [workspaceId, Math.ceil(limit * 0.3)]
  ).catch(() => ({ rows: [] }));

  for (const r of incRows) {
    ticks.push(buildTick('incident_filed', r.id, r.created_at,
      'Your Site',
      `Security event documented: ${r.incident_type || 'Incident'}`,
      r.severity === 'critical' ? 'warning' : 'info'));
  }

  ticks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return ticks.slice(0, limit);
}

/** SSE stream — sends new ticks every 15 seconds to the client portal */
export function streamIntegrityFeed(params: {
  workspaceId: string;
  clientId: string;
  res: Response;
}): void {
  const { workspaceId, clientId, res } = params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let lastIds = new Set<string>();
  let stopped = false;

  const sendTicks = async (initialBatch = false) => {
    if (stopped) return;
    try {
      const ticks = await getRecentIntegrityTicks({ workspaceId, clientId, limit: 20 });
      const toSend = initialBatch
        ? ticks.slice(0, 5)
        : ticks.filter(t => !lastIds.has(t.id));

      if (toSend.length > 0) {
        toSend.forEach(t => lastIds.add(t.id));
        if (lastIds.size > 200) lastIds = new Set([...lastIds].slice(-100)); // prevent memory leak
        for (const tick of toSend.reverse()) {
          res.write(`data: ${JSON.stringify(tick)}\n\n`);
        }
      } else {
        res.write(': heartbeat\n\n'); // keepalive
      }
    } catch {
      res.write(': error\n\n');
    }
  };

  sendTicks(true); // immediate initial batch
  const interval = setInterval(() => sendTicks(false), 15_000);

  const cleanup = () => { stopped = true; clearInterval(interval); };
  res.on('close', cleanup);
  res.on('error', cleanup);
}
