import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { leadId, status } = req.query;
    const where: any = { assignedTo: { workspaceId: req.user!.workspaceId } };
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;
    const tasks = await prisma.task.findMany({ where, include: { assignedTo: { select: { id: true, name: true } }, lead: { select: { id: true, title: true } } }, orderBy: { dueAt: 'asc' } });
    res.json(tasks);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const task = await prisma.task.create({ data: { ...req.body, assignedToId: req.body.assignedToId || req.user!.id }, include: { assignedTo: { select: { id: true, name: true } } } });
    if (task.leadId) await prisma.activity.create({ data: { type: 'TASK_CREATED', description: `Tarefa "${task.title}" criada`, leadId: task.leadId, userId: req.user!.id } });
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { ...req.body, ...(req.body.status === 'COMPLETED' && { completedAt: new Date() }) }, include: { assignedTo: { select: { id: true, name: true } } } });
    if (req.body.status === 'COMPLETED' && task.leadId) {
      await prisma.activity.create({ data: { type: 'TASK_COMPLETED', description: `Tarefa "${task.title}" concluída`, leadId: task.leadId, userId: req.user!.id } });
    }
    res.json(task);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tarefa eliminada' });
  } catch (e) { next(e); }
});

export default router;
