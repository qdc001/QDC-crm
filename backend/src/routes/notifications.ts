import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'notifications endpoint' }));
export default router;
