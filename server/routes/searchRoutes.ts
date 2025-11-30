import type { Express, Request, Response } from 'express';
import type { User } from '@shared/schema';
import express from 'express';
import { aiSearchService } from '../services/aiSearchService';
import { storage } from '../storage';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export function registerSearchRoutes(app: Express, requireAuth: any) {
  const searchRouter = express.Router();

  searchRouter.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user?.currentWorkspaceId) {
        return res.status(403).json({ success: false, error: 'No workspace selected' });
      }

      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json({
          success: true,
          data: {
            query: query || '',
            results: [],
            totalCount: 0,
            categories: {
              employees: 0,
              clients: 0,
              schedules: 0,
              invoices: 0,
              timeEntries: 0,
            },
          },
        });
      }

      const searchResults = await aiSearchService.performSearch(
        user.currentWorkspaceId,
        query
      );

      res.json({
        success: true,
        data: searchResults,
      });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message,
      });
    }
  });

  searchRouter.get('/suggestions', requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await storage.getUser(userId);
      if (!user?.currentWorkspaceId) {
        return res.status(403).json({ success: false, error: 'No workspace selected' });
      }

      const query = req.query.q as string;
      if (!query || query.trim().length < 1) {
        return res.json({
          success: true,
          data: {
            query: query || '',
            suggestions: [],
          },
        });
      }

      const suggestions = await aiSearchService.getSuggestions(
        user.currentWorkspaceId,
        query
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error: any) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions',
        message: error.message,
      });
    }
  });

  app.use('/api/search', searchRouter);
}
