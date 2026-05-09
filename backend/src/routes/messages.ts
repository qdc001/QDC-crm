import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { leadId, contactId, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (contactId) where.contactId = contactId;
    const messages = await prisma.message.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'asc' }, include: { sentBy: { select: { id: true, name: true, avatar: true } } } });
    res.json(messages);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const message = await prisma.message.create({ data: { ...req.body, sentById: req.user!.id }, include: { sentBy: { select: { id: true, name: true, avatar: true } } } });
    const io = req.app.get('io');
    if (message.leadId) io.to(`lead:${message.leadId}`).emit('message:new', message);
    res.status(201).json(message);
  } catch (e) { next(e); }
});

export default router;
