// users.ts
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
const prisma = new PrismaClient();
const router = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  phone: true,
  role: true,
  isActive: true,
  workspaceId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { workspaceId: req.user!.workspaceId },
      select: userSelect,
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
      select: userSelect,
    });
    res.json(user);
  } catch (e) { next(e); }
});

export default router;
