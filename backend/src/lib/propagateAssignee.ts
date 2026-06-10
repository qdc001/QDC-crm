// Helper para propagar a atribuição de responsável entre as 3 entidades que a guardam:
//   - Contact.assignedToId            (responsável da ficha do contacto)
//   - ConversationMeta.assignedToId   (responsável da conversa por canal)
//   - Lead.assignedToId               (responsável de cada lead)
//
// Quando se atribui um responsável em qualquer um destes pontos, propagamos
// para os outros do MESMO contacto. Isto garante que o filtro de Contactos por
// responsável (e a vista de Inbox por agente, etc.) ficam coerentes.
//
// Notas:
//  - `assignedToId === null` significa "remover responsável". Também propaga (limpa nos outros).
//  - `source` indica qual a entidade que originou a mudança, para não voltar a actualizar essa.
//  - Falhas individuais não bloqueiam (best-effort). Logs no console se algo correr mal.



import prisma from './prisma';
export type AssigneeSource = 'contact' | 'conversation' | 'lead';

export async function propagateAssignee(
  workspaceId: string,
  contactId: string,
  assignedToId: string | null,
  source: AssigneeSource,
): Promise<void> {
  if (!contactId) return;
  try {
    const tasks: Promise<any>[] = [];

    if (source !== 'contact') {
      tasks.push(
        prisma.contact
          .updateMany({ where: { id: contactId, workspaceId }, data: { assignedToId } })
          .catch((e) => console.error('propagateAssignee/contact:', e.message)),
      );
    }
    if (source !== 'conversation') {
      tasks.push(
        prisma.conversationMeta
          .updateMany({ where: { contactId, workspaceId }, data: { assignedToId } })
          .catch((e) => console.error('propagateAssignee/conversation:', e.message)),
      );
    }
    if (source !== 'lead') {
      tasks.push(
        prisma.lead
          .updateMany({ where: { contactId, workspaceId }, data: { assignedToId } })
          .catch((e) => console.error('propagateAssignee/lead:', e.message)),
      );
    }

    // Tarefas: reatribuir as NÃO concluídas do contacto (e dos seus leads), para
    // que o responsável escolhido na Caixa de Entrada/lead/contacto se reflicta
    // na secção Tarefas. Task.assignedToId é obrigatório, por isso só propagamos
    // quando há responsável (não limpamos tarefas ao remover o responsável).
    if (assignedToId) {
      const leadIds = (await prisma.lead.findMany({
        where: { contactId, workspaceId },
        select: { id: true },
      })).map((l) => l.id);
      const taskOr: any[] = [{ contactId }];
      if (leadIds.length) taskOr.push({ leadId: { in: leadIds } });
      tasks.push(
        prisma.task
          .updateMany({ where: { completedAt: null, OR: taskOr }, data: { assignedToId } })
          .catch((e) => console.error('propagateAssignee/tasks:', e.message)),
      );
    }

    await Promise.all(tasks);
  } catch (e: any) {
    console.error('propagateAssignee fatal:', e.message);
  }
}
