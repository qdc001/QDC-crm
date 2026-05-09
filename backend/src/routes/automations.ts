import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'automations endpoint' }));
export default router;
