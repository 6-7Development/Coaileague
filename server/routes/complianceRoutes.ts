// Compliance management routes
// Status: Stub — compliance handled in complianceRoutes domain file
// Domain: Compliance
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
