import { sanitizeError } from '../middleware/errorHandler';
import { Router } from 'express';
import { db } from '../db';
import {
  clientServiceRequests,
  insertClientServiceRequestSchema,
  supportTickets,
} from '@shared/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { requireAuth } from '../auth';
import { hasManagerAccess, type AuthenticatedRequest } from '../rbac';
import { platformEventBus } from '../services/platformEventBus';
import { createLogger } from '../lib/logger';
const log = createLogger('clientServiceRequestRoutes');

const router = Router();

// GET /api/service-requests — management view of all requests
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(403).json({ error: 'Workspace context required' });

    const { clientId, status } = req.query;

    const requests = await db
      .select()
      .from(clientServiceRequests)
      .where(and(
        eq(clientServiceRequests.workspaceId, workspaceId),
        ...(clientId && typeof clientId === 'string' ? [eq(clientServiceRequests.clientId, clientId)] : []),
        ...(status && typeof status === 'string' ? [eq(clientServiceRequests.status, status)] : []),
      ))
      .orderBy(desc(clientServiceRequests.createdAt));

    res.json(requests);
  } catch (err: unknown) {
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// POST /api/service-requests — client submits a request
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(403).json({ error: 'Workspace context required' });

    const parsed = insertClientServiceRequestSchema.safeParse({
      ...req.body,
      workspaceId,
      status: 'submitted',
    });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const [request] = await db.insert(clientServiceRequests).values(parsed.data).returning();

    // [PHASE-9-2] Create a linked support ticket for every service request
    let linkedTicket: { id: string; ticketNumber: string } | null = null;
    try {
      const urgencyToPriority: Record<string, string> = {
        urgent: 'urgent',
        high: 'high',
        medium: 'normal',
        low: 'low',
      };
      const ticketNumber = `TKT-SR-${Date.now().toString(36).toUpperCase()}`;
      const [ticket] = await db.insert(supportTickets).values({
        workspaceId,
        ticketNumber,
        type: 'service_request',
        priority: urgencyToPriority[parsed.data.urgency ?? ''] ?? 'normal',
        clientId: parsed.data.clientId,
        requestedBy: parsed.data.submittedByEmail ?? parsed.data.submittedBy ?? 'client',
        subject: `Service Request: ${parsed.data.requestType}`,
        description: parsed.data.description ?? `Client service request (${parsed.data.requestType})`,
        status: 'open',
        submissionMethod: 'portal',
      }).returning({ id: supportTickets.id, ticketNumber: supportTickets.ticketNumber });
      linkedTicket = ticket;
      log.info(`[ServiceRequest→Ticket] Created ticket ${ticketNumber} for SR ${request.id}`);
    } catch (ticketErr: any) {
      log.error('[ServiceRequest→Ticket] Failed to create linked ticket (non-fatal):', ticketErr?.message);
    }

    platformEventBus.publish({
      type: 'service_request_submitted',
      category: 'operations',
      title: `Service Request — ${parsed.data.requestType}`,
      description: `Client submitted a ${parsed.data.requestType} request`,
      workspaceId,
      metadata: {
        requestId: request.id,
        clientId: parsed.data.clientId,
        requestType: parsed.data.requestType,
        urgency: parsed.data.urgency,
        linkedTicketId: linkedTicket?.id,
        linkedTicketNumber: linkedTicket?.ticketNumber,
      },
      visibility: 'supervisor',
    }).catch((err: any) => log.warn('[EventBus] Publish failed (non-blocking):', err?.message));

    res.status(201).json({ ...request, linkedTicket });
  } catch (err: unknown) {
    res.status(500).json({ error: sanitizeError(err) });
  }
});

// PATCH /api/service-requests/:id — update status, assign, add notes
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(403).json({ error: 'Workspace context required' });
    // @ts-expect-error — TS migration: fix in refactoring sprint
    if (!hasManagerAccess(req)) return res.status(403).json({ error: 'Manager access required' });

    const { id } = req.params;
    const { status, assignedTo, internalNotes, resolvedAt } = req.body;

    const [updated] = await db
      .update(clientServiceRequests)
      .set({
        ...(status !== undefined && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(resolvedAt !== undefined && { resolvedAt: new Date(resolvedAt) }),
        updatedAt: new Date(),
      })
      .where(and(eq(clientServiceRequests.id, id), eq(clientServiceRequests.workspaceId, workspaceId)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Request not found' });
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: sanitizeError(err) });
  }
});

export default router;
