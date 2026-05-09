import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'customFields endpoint' }));
export default router;
