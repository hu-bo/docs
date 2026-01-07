import { Router } from 'express';
import * as accessController from '../controllers/access-request.js';

const router = Router();

// 权限申请
router.post('/apply', accessController.applyAccess);
router.get('/pending-requests', accessController.getPendingRequests);
router.put('/approve', accessController.approveAccess);

export default router;
