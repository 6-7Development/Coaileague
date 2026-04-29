// Workflow configuration routes
// Status: Stub — workflow execution in WorkflowExecutor
// Domain: AI Brain
import { Router } from 'express';
const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'stub' }));
export default router;
