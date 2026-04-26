/**
 * AUTONOMOUS SCHEDULING IMPORT ROUTES
 * ===================================
 *
 * Active endpoint for importing historical schedules so Trinity can learn
 * scheduling patterns. Dead autonomous execution/template/daemon endpoints were
 * removed after caller audit showed no frontend consumers.
 */

import { sanitizeError } from '../middleware/errorHandler';
import { Express, Response } from 'express';
import { historicalScheduleImporter } from '../services/scheduling/historicalScheduleImporter';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { platformEventBus } from '../services/platformEventBus';
import multer from 'multer';
import { localVirusScan } from '../middleware/virusScan';
import { createLogger } from '../lib/logger';
const log = createLogger('AutonomousSchedulingRoutes');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for schedule import'));
    }
  },
});

export function registerAutonomousSchedulingRoutes(app: Express) {
  // ============================================================================
  // HISTORICAL SCHEDULE IMPORT
  // ============================================================================

  /**
   * Import historical schedule from CSV
   * POST /api/trinity/import-schedule
   */
  app.post('/api/trinity/import-schedule', requireAuth, upload.single('file'), localVirusScan, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const userWorkspace = await storage.getWorkspaceMemberByUserId(userId);
      
      if (!userWorkspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      
      const options = {
        createShifts: req.body.createShifts === 'true',
        learnPatterns: req.body.learnPatterns !== 'false',
        dateFormat: (req.body.dateFormat || 'MM/DD/YYYY') as 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY',
        timeFormat: (req.body.timeFormat || '12h') as '12h' | '24h',
      };

      log.info(`[HistoricalImport] Importing schedule for workspace ${userWorkspace.workspaceId}`);

      const result = await historicalScheduleImporter.importFromCSV(
        userWorkspace.workspaceId,
        csvContent,
        options
      );

      if (result.success && result.shiftsImported > 0) {
        const importMeta = {
          importedCount: result.shiftsImported,
          patternsLearned: result.patternsLearned,
          triggerPreBuild: options.createShifts,
        };
        platformEventBus.publish({
          type: 'prior_schedules_imported',
          category: 'automation',
          title: `Historical Schedule Imported — ${result.shiftsImported} Shifts`,
          description: `Imported ${result.shiftsImported} historical shifts, learned ${result.patternsLearned} scheduling patterns`,
          workspaceId: userWorkspace.workspaceId,
          metadata: importMeta,
        }).catch((err: Error) => log.error('[HistoricalImport] prior_schedules_imported publish failed:', err.message));

        platformEventBus.publish({
          type: 'schedule_analysis_requested',
          category: 'automation',
          title: 'Schedule Pattern Analysis Queued',
          description: `Analyzing ${result.shiftsImported} imported shifts to build scheduling intelligence`,
          workspaceId: userWorkspace.workspaceId,
          metadata: { shiftCount: result.shiftsImported, source: 'historical_import', ...importMeta },
        }).catch((err: Error) => log.error('[HistoricalImport] schedule_analysis_requested publish failed:', err.message));
      }

      res.json({
        success: result.success,
        message: `Imported ${result.shiftsImported} shifts, learned ${result.patternsLearned} patterns`,
        shiftsImported: result.shiftsImported,
        patternsLearned: result.patternsLearned,
        patterns: result.patterns,
        errors: result.errors,
      });

    } catch (error: unknown) {
      log.error('[HistoricalImport] Error:', error);
      res.status(500).json({ 
        success: false,
        message: sanitizeError(error) || 'Import failed' 
      });
    }
  });

  log.info('[Routes] Autonomous scheduling import route registered');
}
