import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
const prisma = new PrismaClient();
const router = Router();

// Helper: envia WhatsApp via canal disponível (Evolution preferido, depois Cloud API)
async function sendWhatsAppOut(workspaceId: string, phone: string, content: string, type: string, mediaUrl?: string): Promise<{ ok: boolean; externalId?: string; via?: string; error?: string }> {
  // 1. Tentar Evolution
  const evo = await prisma.integration.findFirst({
    where: { workspaceId, type: 'WEBHOOK', name: { contains: 'evolution', mode: 'insensitive' }, isActive: true },
  });
  if (evo) {
    const creds: any = evo.credentials || {};
    if (creds.baseUrl && creds.apiKey && creds.instanceName) {
      try {
        const isMedia = type !== 'TEXT' && mediaUrl;
        const path = isMedia ? `/message/sendMedia/${creds.instanceName}` : `/message/sendText/${creds.instanceName}`;
        const body: any = { number: phone.replace(/\D/g, '') };
        if (isMedia) {
          const mtype = type === 'IMAGE' ? 'image' : type === 'VIDEO' ? 'video' : type === 'AUDIO' ? 'audio' : 'document';
          body.mediatype = mtype;
          body.media = mediaUrl;
          body.caption = content || '';
          body.fileName = (mediaUrl || '').split('/').pop() || 'file';
        } else {
          body.text = content;
        }
        const r = await fetch(`${creds.baseUrl.replace(/\/$/, '')}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: creds.apiKey },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (r.ok) return { ok: true, externalId: data?.key?.id, via: 'evolution' };
        return { ok: false, error: data?.message || data?.error || `HTTP ${r.status}` };
      } catch (e: any) {
        return { ok: false, error: e.message };
      }
    }
  }

  // 2. Tentar WhatsApp Cloud (Meta)
  const cloud = await prisma.integration.findFirst({
    where: { workspaceId, type: 'WHATSAPP', isActive: true },
  });
  if (cloud) {
    const creds: any = cloud.credentials || {};
    const token = creds.accessToken || creds.token;
    const phoneId = creds.phoneNumberId || creds.phoneId;
    if (token && phoneId) {
      try {
        let body: any;
        if (type === 'TEXT' || !mediaUrl) {
          body = { messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: content } };
        } else {
          const mtype = type.toLowerCase();
          body = { messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: mtype, [mtype]: { link: mediaUrl, caption: content } };
        }
        const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (r.ok) return { ok: true, externalId: data.messages?.[0]?.id, via: 'cloud' };
        return { ok: false, error: data?.error?.message || `HTTP ${r.status}` };
      } catch (e: any) { return { ok: false, error: e.message }; }
    }
  }

  return { ok: false, error: 'Sem integração WhatsApp activa' };
}

const messageInclude = {
  sentBy: { select: { id: true, name: true, avatar: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  replyTo: { select: { id: true, content: true, direction: true, sentBy: { select: { name: true } } } },
};

// GET /api/messages/conversations - lista de conversas
router.get('/conversations', async (req: AuthRequest, res: Response, next) => {
  try {
    const { channel, search, unreadOnly, combineByContact } = req.query;
    const messageWhere: any = {
      OR: [
        { contact: { workspaceId: req.user!.workspaceId } },
        { lead: { workspaceId: req.user!.workspaceId } },
      ],
      isInternal: false,
    };
    if (channel) messageWhere.channel = channel;

    // Visibilidade restrita: só vê conversas do próprio (lead atribuído ou conversa atribuída)
    if (req.user!.viewOnlyOwn && req.user!.role === 'AGENT') {
      const myMetas = await prisma.conversationMeta.findMany({
        where: { workspaceId: req.user!.workspaceId, assignedToId: req.user!.id },
        select: { contactId: true, channel: true },
      });
      const myContactIds = myMetas.map((m) => m.contactId).filter((x) => x) as string[];
      messageWhere.OR = [
        { lead: { workspaceId: req.user!.workspaceId, assignedToId: req.user!.id } },
        ...(myContactIds.length ? [{ contactId: { in: myContactIds } }] : []),
      ];
    }

    const messages = await prisma.message.findMany({
      where: messageWhere,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true, whatsapp: true, email: true, avatar: true, type: true } },
        lead: { select: { id: true, title: true } },
        sentBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byKey: Record<string, any> = {};
    for (const m of messages) {
      let key: string;
      if (combineByContact === 'true' && m.contactId) {
        key = m.contactId;
      } else {
        key = m.contactId
          ? `${m.contactId}:${m.channel}`
          : m.leadId ? `lead:${m.leadId}:${m.channel}` : `none:${m.channel}`;
      }
      if (!byKey[key]) {
        byKey[key] = {
          key,
          contact: m.contact || null,
          leadId: m.leadId || null,
          channel: m.channel,
          channels: new Set([m.channel]),
          lastMessage: m,
          messages: [m],
          unread: 0,
          combined: combineByContact === 'true',
        };
      } else {
        byKey[key].messages.push(m);
        byKey[key].channels.add(m.channel);
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
      channels: Array.from(c.channels),
      lastMessage: c.lastMessage,
      unread: c.unread,
      total: c.messages.length,
      combined: c.combined,
    }));

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

// GET /api/messages
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { leadId, contactId, allChannels, page = 1, limit = 200 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (contactId) where.contactId = contactId;
    // Quando combinado por contacto, queremos todos os canais mas limita ao workspace
    if (!leadId && !contactId) {
      where.OR = [
        { contact: { workspaceId: req.user!.workspaceId } },
        { lead: { workspaceId: req.user!.workspaceId } },
      ];
    }
    const messages = await prisma.message.findMany({
      where, skip, take: Number(limit),
      orderBy: { createdAt: 'asc' },
      include: messageInclude,
    });
    res.json(messages);
  } catch (e) { next(e); }
});

// POST /api/messages
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { content, channel, contactId, leadId, type, direction, mediaUrl, mediaType, replyToId, isInternal } = req.body;
    if (!content) throw new AppError('Conteudo obrigatorio', 400);
    if (!channel) throw new AppError('Canal obrigatorio', 400);

    let externalId: string | undefined;
    let status = 'PENDING';
    let sendError: string | undefined;

    // Enviar via canal externo (WhatsApp) se não for nota interna nem inbound
    const shouldSend = !isInternal && channel === 'WHATSAPP' && (direction || 'OUTBOUND') === 'OUTBOUND' && contactId;
    if (shouldSend) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      const phone = contact?.whatsapp || contact?.phone;
      if (!phone) {
        sendError = 'Contacto sem número de WhatsApp';
      } else {
        const result = await sendWhatsAppOut(req.user!.workspaceId, phone, content, type || 'TEXT', mediaUrl);
        if (result.ok) {
          externalId = result.externalId;
          status = 'SENT';
        } else {
          sendError = result.error;
          status = 'FAILED';
        }
      }
    } else {
      status = 'SENT'; // notas internas ou outros canais: marca SENT
    }

    const message = await prisma.message.create({
      data: {
        content,
        channel,
        type: type || 'TEXT',
        direction: direction || 'OUTBOUND',
        status: status as any,
        contactId: contactId || null,
        leadId: leadId || null,
        replyToId: replyToId || null,
        isInternal: !!isInternal,
        mediaUrl, mediaType,
        externalId,
        sentById: req.user!.id,
      },
      include: messageInclude,
    });
    const io = req.app.get('io');
    if (message.leadId) io.to(`lead:${message.leadId}`).emit('message:new', message);
    io.to(`workspace:${req.user!.workspaceId}`).emit('message:new', message);

    if (sendError) {
      return res.status(201).json({ ...message, sendError });
    }
    res.status(201).json(message);
  } catch (e) { next(e); }
});

// PATCH /api/messages/:id - editar mensagem (apenas conteudo)
router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { content } = req.body;
    if (!content) throw new AppError('Conteudo obrigatorio', 400);
    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Mensagem nao encontrada', 404);
    if (existing.sentById !== req.user!.id) {
      throw new AppError('So podes editar mensagens que enviaste', 403);
    }
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { content, editedAt: new Date() },
      include: messageInclude,
    });
    res.json(message);
  } catch (e) { next(e); }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response, next) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { readAt: new Date(), status: 'READ' },
    });
    res.json(message);
  } catch (e) { next(e); }
});

// POST /api/messages/mark-conversation-read
router.post('/mark-conversation-read', async (req: AuthRequest, res: Response, next) => {
  try {
    const { contactId, leadId } = req.body;
    const where: any = { direction: 'INBOUND', readAt: null };
    if (contactId) where.contactId = contactId;
    if (leadId) where.leadId = leadId;
    const result = await prisma.message.updateMany({ where, data: { readAt: new Date(), status: 'READ' } });
    res.json({ updated: result.count });
  } catch (e) { next(e); }
});

// ==== Conversation metadata (favoritas, arquivadas, atribuir, tags) ====

// GET /api/messages/meta/:contactId/:channel - obter metadata
router.get('/meta/:contactId/:channelOrAll', async (req: AuthRequest, res: Response, next) => {
  try {
    const { contactId, channelOrAll } = req.params;
    const channel = channelOrAll === 'all' ? null : channelOrAll;
    const meta = await prisma.conversationMeta.findFirst({
      where: { workspaceId: req.user!.workspaceId, contactId, channel },
      include: { assignedTo: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    });
    res.json(meta);
  } catch (e) { next(e); }
});

// GET /api/messages/meta - listar todas (para mostrar badges nas conversas)
router.get('/meta', async (req: AuthRequest, res: Response, next) => {
  try {
    const metas = await prisma.conversationMeta.findMany({
      where: { workspaceId: req.user!.workspaceId },
      include: { assignedTo: { select: { id: true, name: true, avatar: true } }, tags: { include: { tag: true } } },
    });
    res.json(metas);
  } catch (e) { next(e); }
});

// POST /api/messages/meta - upsert
router.post('/meta', async (req: AuthRequest, res: Response, next) => {
  try {
    const { contactId, channel, isArchived, isPinned, assignedToId, tagIds } = req.body;
    const finalChannel = channel === 'all' ? null : channel;
    const existing = await prisma.conversationMeta.findFirst({
      where: { workspaceId: req.user!.workspaceId, contactId, channel: finalChannel },
    });
    let meta;
    if (existing) {
      meta = await prisma.conversationMeta.update({
        where: { id: existing.id },
        data: {
          ...(isArchived !== undefined && { isArchived }),
          ...(isPinned !== undefined && { isPinned }),
          ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        },
      });
    } else {
      meta = await prisma.conversationMeta.create({
        data: {
          workspaceId: req.user!.workspaceId,
          contactId,
          channel: finalChannel,
          isArchived: !!isArchived,
          isPinned: !!isPinned,
          assignedToId: assignedToId || null,
        },
      });
    }
    // Substituir tags se enviadas
    if (Array.isArray(tagIds)) {
      await prisma.tagOnConversation.deleteMany({ where: { conversationId: meta.id } });
      if (tagIds.length) {
        await prisma.tagOnConversation.createMany({
          data: tagIds.map((tagId: string) => ({ conversationId: meta.id, tagId })),
        });
      }
    }
    const result = await prisma.conversationMeta.findUnique({
      where: { id: meta.id },
      include: { assignedTo: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    });
    res.json(result);
  } catch (e) { next(e); }
});

// DELETE /api/messages/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Mensagem nao encontrada', 404);
    if (existing.sentById !== req.user!.id) {
      throw new AppError('So podes eliminar mensagens que enviaste', 403);
    }
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ message: 'Mensagem eliminada' });
  } catch (e) { next(e); }
});

export default router;
