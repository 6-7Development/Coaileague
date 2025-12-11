/**
 * INTEGRATION MANAGEMENT ROUTES
 * ==============================
 * API routes for managing workspace integrations and API keys.
 * 
 * End-user routes (/api/integrations/*):
 * - List available integrations
 * - Manage workspace connections
 * - Create/manage API keys
 * - Service health monitoring
 * 
 * Support role routes (/api/admin/partners/*):
 * - Manage partner catalog
 * - Suspend/reactivate partners
 * - View usage statistics
 */

import { Router, Request, Response } from 'express';
import { integrationManagementService, type IntegrationAccessContext } from '../services/ai-brain/integrationManagementService';
import { integrationPartnerService, type SupportContext } from '../services/ai-brain/integrationPartnerService';

const router = Router();

function getIntegrationContext(req: Request): IntegrationAccessContext {
  const user = (req as any).user || {};
  return {
    userId: user.id || '',
    workspaceId: user.activeWorkspaceId || (req as any).session?.activeWorkspaceId || '',
    platformRole: user.platformRole || '',
    workspaceRole: user.workspaceRole || '',
    accessLevel: integrationManagementService.determineAccessLevel(
      user.platformRole || '',
      user.workspaceRole || ''
    )
  };
}

function getSupportContext(req: Request): SupportContext {
  const user = (req as any).user || {};
  return {
    userId: user.id || '',
    platformRole: user.platformRole || '',
    accessLevel: integrationPartnerService.determineSupportAccessLevel(user.platformRole || '')
  };
}

router.get('/available', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const integrations = await integrationManagementService.listAvailableIntegrations(context);
    
    res.json({
      success: true,
      data: integrations,
      count: integrations.length
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/connections', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const connections = await integrationManagementService.getWorkspaceConnections(context);
    
    res.json({
      success: true,
      data: connections,
      count: connections.length
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { integrationId, displayName, authType, credentials, syncConfig } = req.body;
    
    if (!integrationId || !displayName || !authType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: integrationId, displayName, authType'
      });
    }
    
    const result = await integrationManagementService.connectIntegration(context, {
      integrationId,
      displayName,
      authType,
      credentials: credentials || {},
      syncConfig
    });
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/connections/:connectionId', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { connectionId } = req.params;
    
    const result = await integrationManagementService.disconnectIntegration(context, connectionId);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.patch('/connections/:connectionId/credentials', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { connectionId } = req.params;
    const { credentials } = req.body;
    
    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: credentials'
      });
    }
    
    const result = await integrationManagementService.updateConnectionCredentials(context, connectionId, credentials);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const keys = await integrationManagementService.listApiKeys(context);
    
    const sanitizedKeys = keys.map(k => ({ ...k, keyHash: undefined }));
    
    res.json({
      success: true,
      data: sanitizedKeys,
      count: keys.length
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { name, scopes, expiresAt } = req.body;
    
    if (!name || !scopes || !Array.isArray(scopes)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, scopes (array)'
      });
    }
    
    const result = await integrationManagementService.createApiKey(
      context,
      name,
      scopes,
      expiresAt ? new Date(expiresAt) : undefined
    );
    
    res.status(result.success ? 201 : 400).json({
      success: result.success,
      keyId: result.keyId,
      apiKey: result.apiKey,
      message: result.success 
        ? 'API key created. Save this key securely - it will only be shown once.'
        : result.error
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/api-keys/:keyId', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { keyId } = req.params;
    
    const result = await integrationManagementService.revokeApiKey(context, keyId);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/health', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const health = await integrationManagementService.getServiceHealth(context);
    
    const unhealthyCount = health.filter(h => !h.isHealthy).length;
    
    res.json({
      success: true,
      data: health,
      summary: {
        total: health.length,
        healthy: health.length - unhealthyCount,
        unhealthy: unhealthyCount
      }
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/analyze/:integrationId', async (req: Request, res: Response) => {
  try {
    const context = getIntegrationContext(req);
    const { integrationId } = req.params;
    
    const analysis = await integrationManagementService.analyzeServiceOutage(context, integrationId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

export const integrationRoutes = router;

export const partnerRoutes = Router();

partnerRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    
    if (!integrationPartnerService.canViewPartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view integration partners. Platform support role required.'
      });
    }
    
    const { category, status, search, limit, offset } = req.query;
    
    const result = await integrationPartnerService.listAllPartners(context, {
      category: category as string,
      status: status as 'active' | 'suspended' | 'all',
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json({
      success: true,
      data: result.partners,
      total: result.total
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.get('/stats', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    
    if (!integrationPartnerService.canViewPartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view partner statistics. Platform support role required.'
      });
    }
    
    const { partnerId } = req.query;
    
    const stats = await integrationPartnerService.getPartnerUsageStats(context, partnerId as string);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.get('/:partnerId', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    
    if (!integrationPartnerService.canViewPartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view partner details. Platform support role required.'
      });
    }
    
    const { partnerId } = req.params;
    
    const details = await integrationPartnerService.getPartnerDetails(context, partnerId);
    
    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }
    
    res.json({
      success: true,
      data: details
    });
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    
    if (!context.accessLevel || !integrationPartnerService.canManagePartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to create partners'
      });
    }
    
    const result = await integrationPartnerService.createPartner(context, req.body);
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.patch('/:partnerId', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    const { partnerId } = req.params;
    
    if (!context.accessLevel || !integrationPartnerService.canManagePartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update partners'
      });
    }
    
    const result = await integrationPartnerService.updatePartner(context, partnerId, req.body);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.post('/:partnerId/suspend', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    const { partnerId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reason'
      });
    }
    
    if (!context.accessLevel || !integrationPartnerService.canSuspendPartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to suspend partners'
      });
    }
    
    const result = await integrationPartnerService.suspendPartner(context, partnerId, reason);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.post('/:partnerId/reactivate', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    const { partnerId } = req.params;
    
    if (!context.accessLevel || !integrationPartnerService.canSuspendPartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to reactivate partners'
      });
    }
    
    const result = await integrationPartnerService.reactivatePartner(context, partnerId);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});

partnerRoutes.delete('/:partnerId', async (req: Request, res: Response) => {
  try {
    const context = getSupportContext(req);
    const { partnerId } = req.params;
    const { force } = req.query;
    
    if (!context.accessLevel || !integrationPartnerService.canDeletePartners(context.accessLevel)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete partners'
      });
    }
    
    const result = await integrationPartnerService.deletePartner(context, partnerId, force === 'true');
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(error.message.includes('permission') ? 403 : 500).json({
      success: false,
      error: error.message
    });
  }
});
