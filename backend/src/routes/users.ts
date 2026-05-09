// users.ts
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { workspaceId: req.user!.workspaceId },
      omit: { password: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.patch('/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) },
      omit: { password: true },
    });
    res.json(user);
  } catch (e) { next(e); }
});

export default router;
