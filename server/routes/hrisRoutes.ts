/**
 * HRIS Integration Routes
 * ========================
 * API endpoints for HRIS (Human Resource Information Systems) integrations.
 * Handles OAuth flows, data synchronization, and provider management.
 */

import { Router, Request, Response } from 'express';
import { hrisIntegrationService, HRISProvider, SyncDirection, EntityType, HRIS_PROVIDERS } from '../services/hris/hrisIntegrationService';
import { requireAuth } from '../auth';
import { z } from 'zod';

const router = Router();

const syncRequestSchema = z.object({
  direction: z.enum(['inbound', 'outbound', 'bidirectional']).default('bidirectional'),
  entities: z.array(z.enum(['employee', 'department', 'payroll', 'time_off', 'benefits', 'compensation'])).default(['employee']),
  fullSync: z.boolean().default(false),
});

router.get('/providers', requireAuth, async (req: Request, res: Response) => {
  try {
    const providers = hrisIntegrationService.getAvailableProviders();
    res.json({ success: true, providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/connections', requireAuth, async (req: Request, res: Response) => {
  try {
    const workspaceId = req.session?.workspaceId || (req as any).workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'Workspace ID required' });
    }

    const connections = await hrisIntegrationService.getConnectedProviders(workspaceId);
    res.json({ success: true, connections });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/auth/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as HRISProvider;
    const workspaceId = req.session?.workspaceId || (req as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'Workspace ID required' });
    }

    if (!HRIS_PROVIDERS[provider]) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    const redirectUri = `${process.env.REPLIT_DEV_DOMAIN || req.protocol + '://' + req.get('host')}/api/hris/callback/${provider}`;
    
    const { url, state } = hrisIntegrationService.generateAuthUrl({
      provider,
      workspaceId,
      redirectUri,
    });

    req.session.hrisOAuthState = state;

    res.json({ success: true, authUrl: url });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/callback/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as HRISProvider;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/integrations?error=${encodeURIComponent(String(oauthError))}`);
    }

    if (!code || !state) {
      return res.redirect('/integrations?error=missing_parameters');
    }

    const redirectUri = `${process.env.REPLIT_DEV_DOMAIN || req.protocol + '://' + req.get('host')}/api/hris/callback/${provider}`;

    const result = await hrisIntegrationService.handleOAuthCallback({
      provider,
      code: String(code),
      state: String(state),
      redirectUri,
    });

    if (result.success) {
      res.redirect(`/integrations?success=true&provider=${provider}`);
    } else {
      res.redirect(`/integrations?error=${encodeURIComponent(result.error || 'Unknown error')}`);
    }
  } catch (error: any) {
    console.error('[HRISRoutes] Callback error:', error);
    res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

router.post('/sync/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as HRISProvider;
    const workspaceId = req.session?.workspaceId || (req as any).workspaceId;
    const userId = req.session?.userId || (req as any).userId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'Workspace ID required' });
    }

    if (!HRIS_PROVIDERS[provider]) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    const parsed = syncRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid request body', details: parsed.error.flatten() });
    }

    const result = await hrisIntegrationService.syncData({
      workspaceId,
      provider,
      options: {
        direction: parsed.data.direction as SyncDirection,
        entities: parsed.data.entities as EntityType[],
        fullSync: parsed.data.fullSync,
      },
      userId,
    });

    res.json({ success: result.success, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/disconnect/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as HRISProvider;
    const workspaceId = req.session?.workspaceId || (req as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'Workspace ID required' });
    }

    if (!HRIS_PROVIDERS[provider]) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    const success = await hrisIntegrationService.disconnectProvider(workspaceId, provider);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sync-status/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as HRISProvider;
    const workspaceId = req.session?.workspaceId || (req as any).workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'Workspace ID required' });
    }

    const actions = hrisIntegrationService.getAIBrainActions();
    const getSyncStatusAction = actions.find(a => a.name === 'hris.get_sync_status');
    
    if (getSyncStatusAction) {
      const result = await getSyncStatusAction.handler({ workspaceId, provider });
      res.json(result);
    } else {
      res.status(500).json({ success: false, error: 'Action not found' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
