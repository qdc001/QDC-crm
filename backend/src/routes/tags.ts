import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'tags endpoint' }));
export default router;
