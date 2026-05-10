import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
const prisma = new PrismaClient();
const router = Router();

// GET /api/messages/conversations - lista de conversas (uma por contacto/telefone)
router.get('/conversations', async (req: AuthRequest, res: Response, next) => {
  try {
    const { channel, search, unreadOnly } = req.query;
    // Buscar todas as mensagens do workspace
    const messageWhere: any = { OR: [
      { contact: { workspaceId: req.user!.workspaceId } },
      { lead: { workspaceId: req.user!.workspaceId } },
    ] };
    if (channel) messageWhere.channel = channel;

    const messages = await prisma.message.findMany({
      where: messageWhere,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true, whatsapp: true, email: true, avatar: true, type: true } },
        lead: { select: { id: true, title: true } },
        sentBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por contactId (ou se nao tiver contactId, por leadId)
    const byKey: Record<string, any> = {};
    for (const m of messages) {
      const key = m.contactId || (m.leadId ? `lead:${m.leadId}` : `none:${m.channel}`);
      if (!byKey[key]) {
        byKey[key] = {
          key,
          contact: m.contact || null,
          leadId: m.leadId || null,
          channel: m.channel,
          lastMessage: m,
          messages: [m],
          unread: 0,
        };
      } else {
        byKey[key].messages.push(m);
      }
      if (m.direction === 'INBOUND' && !m.readAt) {
        byKey[key].unread++;
      }
    }

    let conversations = Object.values(byKey).map((c: any) => ({
      key: c.key,
      contact: c.contact,
      leadId: c.leadId,
      channel: c.channel,
      lastMessage: c.lastMessage,
      unread: c.unread,
      total: c.messages.length,
    }));

    // Filtros
    if (unreadOnly === 'true') conversations = conversations.filter((c: any) => c.unread > 0);
    if (search) {
      const q = (search as string).toLowerCase();
      conversations = conversations.filter((c: any) => {
        const name = c.contact ? `${c.contact.firstName || ''} ${c.contact.lastName || ''}`.toLowerCase() : '';
        const last = (c.lastMessage?.content || '').toLowerCase();
        const phone = (c.contact?.phone || c.contact?.whatsapp || '').toLowerCase();
        return name.includes(q) || last.includes(q) || phone.includes(q);
      });
    }

    res.json(conversations);
  } catch (e) { next(e); }
});

// GET /api/messages?contactId=X ou ?leadId=X - mensagens de uma conversa
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { leadId, contactId, page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (contactId) where.contactId = contactId;
    if (!leadId && !contactId) {
      // Limita ao workspace
      where.OR = [
        { contact: { workspaceId: req.user!.workspaceId } },
        { lead: { workspaceId: req.user!.workspaceId } },
      ];
    }
    const messages = await prisma.message.findMany({
      where,
      skip, take: Number(limit),
      orderBy: { createdAt: 'asc' },
      include: {
        sentBy: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(messages);
  } catch (e) { next(e); }
});

// POST /api/messages
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { content, channel, contactId, leadId, type, mediaUrl, mediaType } = req.body;
    if (!content) throw new AppError('Conteudo da mensagem obrigatorio', 400);
    if (!channel) throw new AppError('Canal obrigatorio', 400);
    const message = await prisma.message.create({
      data: {
        content,
        channel,
        type: type || 'TEXT',
        direction: 'OUTBOUND',
        status: 'SENT',
        contactId: contactId || null,
        leadId: leadId || null,
        mediaUrl, mediaType,
        sentById: req.user!.id,
      },
      include: {
        sentBy: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const io = req.app.get('io');
    if (message.leadId) io.to(`lead:${message.leadId}`).emit('message:new', message);
    io.to(`workspace:${req.user!.workspaceId}`).emit('message:new', message);
    res.status(201).json(message);
  } catch (e) { next(e); }
});

// PATCH /api/messages/:id/read - marcar uma mensagem como lida
router.patch('/:id/read', async (req: AuthRequest, res: Response, next) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { readAt: new Date(), status: 'READ' },
    });
    res.json(message);
  } catch (e) { next(e); }
});

// POST /api/messages/mark-conversation-read - marcar todas de uma conversa
router.post('/mark-conversation-read', async (req: AuthRequest, res: Response, next) => {
  try {
    const { contactId, leadId } = req.body;
    const where: any = { direction: 'INBOUND', readAt: null };
    if (contactId) where.contactId = contactId;
    if (leadId) where.leadId = leadId;
    const result = await prisma.message.updateMany({
      where,
      data: { readAt: new Date(), status: 'READ' },
    });
    res.json({ updated: result.count });
  } catch (e) { next(e); }
});

// DELETE /api/messages/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mensagem eliminada' });
  } catch (e) { next(e); }
});

export default router;
