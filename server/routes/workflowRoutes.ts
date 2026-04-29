// Workflow execution routes
// Status: Stub — primary workflow logic handled by orchestration services
// Domain: AI Brain
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
