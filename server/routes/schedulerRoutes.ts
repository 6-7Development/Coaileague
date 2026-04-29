// Autonomous scheduler API routes
// Status: Stub — scheduler logic in autonomousSchedulingDaemon.ts
// Domain: Scheduling
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
