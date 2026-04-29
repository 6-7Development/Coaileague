// AI Credit management routes
// Status: Stub — credit logic in billing/creditBalanceService
// Domain: Billing
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
