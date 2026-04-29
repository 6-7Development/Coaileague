// Training & Certification routes
// Status: Stub — primary training logic in trainingCertificationRouter
// Domain: Compliance
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
