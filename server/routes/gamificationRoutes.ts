// Gamification routes — points, badges, leaderboards
// Status: Stub — gamification event system initialized in index.ts
// Domain: Engagement
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
