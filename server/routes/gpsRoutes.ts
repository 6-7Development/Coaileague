// GPS & Location tracking routes
// Status: Stub — GPS events handled via WebSocket
// Domain: Operations
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
