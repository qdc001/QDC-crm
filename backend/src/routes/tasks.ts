import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
const prisma = new PrismaClient();
const router = Router();

const taskInclude = {
  assignedTo: { select: { id: true, name: true, avatar: true } },
  lead: { select: { id: true, title: true, pipelineId: true } },
};

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { leadId, status, type, assignedToId, dueFrom, dueTo, search } = req.query;
    const where: any = { assignedTo: { workspaceId: req.user!.workspaceId } };
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };
    if (dueFrom || dueTo) {
      where.dueAt = {};
      if (dueFrom) where.dueAt.gte = new Date(dueFrom as string);
      if (dueTo) where.dueAt.lte = new Date(dueTo as string);
    }
    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { dueAt: 'asc' },
    });
    res.json(tasks);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, description, type, status, dueAt, leadId, assignedToId } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        type: type || 'CALL',
        status: status || 'PENDING',
        dueAt: dueAt ? new Date(dueAt) : null,
        leadId: leadId || null,
        assignedToId: assignedToId || req.user!.id,
      },
      include: taskInclude,
    });
    if (task.leadId) {
      await prisma.activity.create({
        data: { type: 'TASK_CREATED', description: `Tarefa "${task.title}" criada`, leadId: task.leadId, userId: req.user!.id },
      });
    }
    res.status(201).json(task);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const data: any = { ...req.body };
    if (data.dueAt) data.dueAt = new Date(data.dueAt);
    if (data.status === 'COMPLETED') data.completedAt = new Date();
    if (data.status && data.status !== 'COMPLETED') data.completedAt = null;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: taskInclude,
    });
    if (req.body.status === 'COMPLETED' && task.leadId) {
      await prisma.activity.create({
        data: { type: 'TASK_COMPLETED', description: `Tarefa "${task.title}" concluída`, leadId: task.leadId, userId: req.user!.id },
      });
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
