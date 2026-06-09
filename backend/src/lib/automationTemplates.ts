/**
 * Modelos pré-feitos de automações (follow-ups).
 *
 * O utilizador escolhe um modelo na página de Automações e fica com uma
 * automação já configurada, criada INACTIVA, para preencher os campos
 * específicos do workspace (utilizador a notificar, etapa, etiqueta) e
 * activar quando quiser. Os nomes dos campos (trigger.params e action.params)
 * coincidem com os que o editor da página e o automationEngine usam.
 */

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: { type: string; params?: Record<string, any> };
  conditions?: any;
  actions: { type: string; params: Record<string, any>; delaySeconds?: number }[];
  // Limites de execução (opcionais) para evitar repetição em gatilhos de cron
  runLimitPerContact?: number;
  runLimitTotal?: number;
  runLimitWindow?: number; // em horas
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ─── 1. Cliente à espera de resposta ───
  {
    id: 'no_response_followup',
    name: 'Cliente à espera de resposta',
    description:
      'Quando um cliente escreve e fica sem resposta da equipa durante X minutos, notifica o responsável. Escolhe quem notificar antes de activar.',
    icon: '🔔',
    trigger: { type: 'no_response', params: { minutes: 30 } },
    conditions: [],
    actions: [
      {
        type: 'notify_whatsapp',
        params: {
          destination: '',
          text: '🔔 O contacto {{contact.firstName}} enviou mensagem e ainda não tem resposta. Convém responder.',
        },
      },
    ],
    runLimitPerContact: 1,
    runLimitWindow: 6,
  },

  // ─── 2. Resgate de lead parado ───
  {
    id: 'stagnant_recovery',
    name: 'Resgate de lead parado',
    description:
      'Quando um lead fica X dias sem movimento, cria uma tarefa de "retomar contacto" para o responsável e marca-o com uma etiqueta. Escolhe a etiqueta (opcional) antes de activar.',
    icon: '🐢',
    trigger: { type: 'lead_stagnant', params: { days: 7 } },
    conditions: [],
    actions: [
      {
        type: 'create_task',
        params: {
          title: 'Retomar contacto com {{contact.firstName}}',
          description: 'Lead parado há mais de 7 dias sem actividade. Reaproximar o cliente.',
          taskType: 'FOLLOW_UP',
          priority: 'MEDIUM',
          dueInHours: 24,
        },
      },
      { type: 'add_tag', params: { entity: 'lead', tagId: '' } },
    ],
    runLimitPerContact: 1,
    runLimitWindow: 168, // no máximo uma tarefa por lead por semana
  },

  // ─── 3. Follow-up pós-proposta ───
  {
    id: 'post_proposal_followup',
    name: 'Follow-up pós-proposta',
    description:
      'Quando moves um lead para a etapa de proposta, envia logo uma mensagem de confirmação ao cliente e cria uma tarefa de seguimento para daqui a 2 dias. Escolhe a etapa antes de activar.',
    icon: '📄',
    trigger: { type: 'lead_stage_changed', params: { stageId: '' } },
    conditions: [],
    actions: [
      {
        type: 'send_message',
        params: {
          text: 'Olá {{contact.firstName}}, já lhe enviámos a nossa proposta. Conseguiu dar uma vista de olhos? Ficamos à disposição para qualquer dúvida.',
        },
      },
      {
        type: 'create_task',
        params: {
          title: 'Follow-up da proposta a {{contact.firstName}}',
          description: 'Confirmar se o cliente analisou a proposta enviada e esclarecer dúvidas.',
          taskType: 'FOLLOW_UP',
          priority: 'HIGH',
          dueInHours: 48,
        },
      },
    ],
  },

  // ─── 4. Reactivação de leads frios ───
  {
    id: 'cold_lead_reactivation',
    name: 'Reactivação de leads frios',
    description:
      'Quando um lead fica muito tempo parado (por defeito 30 dias), envia automaticamente uma mensagem de reaproximação ao cliente e marca-o para reactivação. Enviada no máximo uma vez por mês por contacto.',
    icon: '♻️',
    trigger: { type: 'lead_stagnant', params: { days: 30 } },
    conditions: [],
    actions: [
      {
        type: 'send_message',
        params: {
          text: 'Olá {{contact.firstName}}, há algum tempo que não falamos. Continua interessado? Teremos todo o gosto em retomar e ajudar no que precisar.',
        },
      },
      { type: 'add_tag', params: { entity: 'lead', tagId: '' } },
    ],
    runLimitPerContact: 1,
    runLimitWindow: 720, // no máximo uma reactivação por lead por mês
  },
];
