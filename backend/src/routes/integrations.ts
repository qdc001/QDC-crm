import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

// GET /api/integrations
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { workspaceId: req.user!.workspaceId },
    });
    // ocultar tokens sensiveis nas listagens
    const safe = integrations.map((i) => ({
      ...i,
      credentials: i.credentials ? { configured: true } : null,
    }));
    res.json(safe);
  } catch (e) { next(e); }
});

// GET /api/integrations/:id
router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { id: req.params.id, workspaceId: req.user!.workspaceId },
    });
    if (!integration) throw new AppError('Integracao nao encontrada', 404);
    res.json(integration);
  } catch (e) { next(e); }
});

// POST /api/integrations
router.post('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { type, name, credentials, settings, isActive } = req.body;
    if (!type || !name) throw new AppError('Tipo e nome obrigatorios', 400);
    const integration = await prisma.integration.create({
      data: {
        type, name,
        credentials: credentials || {},
        settings: settings || {},
        isActive: isActive ?? true,
        workspaceId: req.user!.workspaceId,
      },
    });
    res.status(201).json(integration);
  } catch (e) { next(e); }
});

// PATCH /api/integrations/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, credentials, settings, isActive } = req.body;
    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(credentials && { credentials }),
        ...(settings && { settings }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(integration);
  } catch (e) { next(e); }
});

// DELETE /api/integrations/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.integration.delete({ where: { id: req.params.id } });
    res.json({ message: 'Integracao eliminada' });
  } catch (e) { next(e); }
});

// =============== Envio de mensagens via integracoes ===============

// Helper: encontrar integracao activa de um tipo
async function findActiveIntegration(workspaceId: string, type: string) {
  return prisma.integration.findFirst({
    where: { workspaceId, type: type as any, isActive: true },
  });
}

// POST /api/integrations/whatsapp-cloud/send
// credentials: { accessToken, phoneNumberId }
router.post('/whatsapp-cloud/send', async (req: AuthRequest, res: Response, next) => {
  try {
    const { to, message, contactId, leadId } = req.body;
    if (!to || !message) throw new AppError('to e message obrigatorios', 400);

    const integration = await findActiveIntegration(req.user!.workspaceId, 'WHATSAPP');
    const creds: any = integration?.credentials || {};
    if (!creds.accessToken || !creds.phoneNumberId) {
      throw new AppError('Configura WhatsApp Cloud nas Integracoes (accessToken + phoneNumberId)', 400);
    }

    const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: message },
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new AppError(data.error?.message || 'Erro WhatsApp Cloud', 502);

    // Guardar mensagem
    const stored = await prisma.message.create({
      data: {
        content: message, channel: 'WHATSAPP', type: 'TEXT',
        direction: 'OUTBOUND', status: 'SENT',
        contactId: contactId || null, leadId: leadId || null,
        sentById: req.user!.id,
        externalId: data.messages?.[0]?.id || null,
      },
    });
    res.json({ stored, providerResponse: data });
  } catch (e) { next(e); }
});

// POST /api/integrations/evolution/send
// credentials: { baseUrl, apiKey, instanceName }
router.post('/evolution/send', async (req: AuthRequest, res: Response, next) => {
  try {
    const { to, message, contactId, leadId } = req.body;
    if (!to || !message) throw new AppError('to e message obrigatorios', 400);

    const integration = await prisma.integration.findFirst({
      where: { workspaceId: req.user!.workspaceId, type: 'WEBHOOK', name: { contains: 'evolution', mode: 'insensitive' }, isActive: true },
    });
    const creds: any = integration?.credentials || {};
    if (!creds.baseUrl || !creds.apiKey || !creds.instanceName) {
      throw new AppError('Configura Evolution nas Integracoes (baseUrl + apiKey + instanceName)', 400);
    }

    const url = `${creds.baseUrl.replace(/\/$/, '')}/message/sendText/${creds.instanceName}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: creds.apiKey,
      },
      body: JSON.stringify({
        number: to.replace(/[^0-9]/g, ''),
        text: message,
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new AppError(data?.message || 'Erro Evolution', 502);

    const stored = await prisma.message.create({
      data: {
        content: message, channel: 'WHATSAPP', type: 'TEXT',
        direction: 'OUTBOUND', status: 'SENT',
        contactId: contactId || null, leadId: leadId || null,
        sentById: req.user!.id,
        externalId: data.key?.id || null,
      },
    });
    res.json({ stored, providerResponse: data });
  } catch (e) { next(e); }
});

// POST /api/integrations/email/send
// credentials: { host, port, secure, user, pass, fromName, fromEmail }
router.post('/email/send', async (req: AuthRequest, res: Response, next) => {
  try {
    const { to, subject, html, text, contactId, leadId } = req.body;
    if (!to || !subject || (!html && !text)) {
      throw new AppError('to, subject e (html ou text) obrigatorios', 400);
    }
    const integration = await findActiveIntegration(req.user!.workspaceId, 'EMAIL_SMTP');
    const creds: any = integration?.credentials || {};
    if (!creds.host || !creds.user || !creds.pass) {
      throw new AppError('Configura SMTP nas Integracoes (host + user + pass)', 400);
    }
    const transporter = nodemailer.createTransport({
      host: creds.host,
      port: Number(creds.port || 587),
      secure: !!creds.secure,
      auth: { user: creds.user, pass: creds.pass },
    });
    const info = await transporter.sendMail({
      from: creds.fromName ? `"${creds.fromName}" <${creds.fromEmail || creds.user}>` : (creds.fromEmail || creds.user),
      to, subject, html, text,
    });
    const stored = await prisma.message.create({
      data: {
        content: text || html || '', channel: 'EMAIL', type: 'TEXT',
        direction: 'OUTBOUND', status: 'SENT',
        contactId: contactId || null, leadId: leadId || null,
        sentById: req.user!.id,
        externalId: info.messageId,
      },
    });
    res.json({ stored, providerResponse: { messageId: info.messageId } });
  } catch (e) { next(e); }
});

export default router;
