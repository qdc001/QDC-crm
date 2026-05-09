import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { workspaceId: req.user!.workspaceId };
    if (search) where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } },
    ];
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({ where, skip, take: Number(limit), orderBy: { firstName: 'asc' }, include: { tags: { include: { tag: true } }, _count: { select: { leads: true } } } }),
      prisma.contact.count({ where }),
    ]);
    res.json({ contacts, total });
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const contact = await prisma.contact.findFirst({ where: { id: req.params.id, workspaceId: req.user!.workspaceId }, include: { tags: { include: { tag: true } }, leads: { include: { stage: true, pipeline: true } } } });
    if (!contact) throw new AppError('Contacto não encontrado', 404);
    res.json(contact);
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const contact = await prisma.contact.create({ data: { ...req.body, workspaceId: req.user!.workspaceId } });
    res.status(201).json(contact);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: req.body });
    res.json(contact);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contacto eliminado' });
  } catch (e) { next(e); }
});

export default router;
