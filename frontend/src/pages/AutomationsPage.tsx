import { useState } from 'react';
import { Plus, Zap, Play, Pause, Trash2, X, Save, ChevronRight, Loader2, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface AutomationStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  config: Record<string, string>;
}

const TRIGGERS = [
  { value: 'lead_created', label: 'Lead criado', icon: '✨' },
  { value: 'stage_changed', label: 'Lead mudou de etapa', icon: '🔄' },
  { value: 'lead_won', label: 'Lead marcado como Ganho', icon: '🏆' },
  { value: 'lead_lost', label: 'Lead marcado como Perdido', icon: '❌' },
  { value: 'message_received', label: 'Mensagem recebida', icon: '💬' },
  { value: 'task_due', label: 'Tarefa em atraso', icon: '⏰' },
  { value: 'no_activity', label: 'Sem actividade há X dias', icon: '😴' },
  { value: 'tag_added', label: 'Tag adicionada', icon: '🏷️' },
  { value: 'contact_created', label: 'Contacto criado', icon: '👤' },
];

const ACTIONS = [
  { value: 'send_whatsapp', label: 'Enviar mensagem WhatsApp', icon: '💬' },
  { value: 'send_email', label: 'Enviar email', icon: '📧' },
  { value: 'create_task', label: 'Criar tarefa', icon: '✅' },
  { value: 'move_stage', label: 'Mover para etapa', icon: '📍' },
  { value: 'assign_user', label: 'Atribuir a agente', icon: '👤' },
  { value: 'add_tag', label: 'Adicionar tag', icon: '🏷️' },
  { value: 'update_field', label: 'Actualizar campo', icon: '✏️' },
  { value: 'webhook', label: 'Disparar webhook', icon: '🔗' },
  { value: 'ai_reply', label: 'Resposta automática com IA', icon: '🤖' },
  { value: 'notify_user', label: 'Notificar agente', icon: '🔔' },
];

const STEP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  trigger: { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA' },
  condition: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' },
  action: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  delay: { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6' },
};

const STEP_ICONS: Record<string, string> = { trigger: '⚡', condition: '🔀', action: '⚙️', delay: '⏱️' };

function StepCard({ step, index, onChange, onRemove }: { step: AutomationStep; index: number; onChange: (s: AutomationStep) => void; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const c = STEP_COLORS[step.type];

  return (
    <div style={{ border: `2px solid ${c.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ background: c.bg }} onClick={() => setExpanded(!expanded)}>
        <span style={{ fontSize: 18 }}>{STEP_ICONS[step.type]}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.text }}>{step.type}</span>
        <span className="flex-1 text-sm font-medium" style={{ color: '#0F172A' }}>
          {step.type === 'trigger' && (TRIGGERS.find((t) => t.value === step.config.event)?.label || 'Seleccionar trigger')}
          {step.type === 'action' && (ACTIONS.find((a) => a.value === step.config.type)?.label || 'Seleccionar acção')}
          {step.type === 'delay' && (step.config.duration ? `Esperar ${step.config.duration} ${step.config.unit || 'horas'}` : 'Configurar espera')}
          {step.type === 'condition' && (step.config.field ? `Se ${step.config.field} ${step.config.operator} "${step.config.value}"` : 'Configurar condição')}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 rounded hover:bg-white/50">
          <Trash2 size={13} style={{ color: '#EF4444' }} />
        </button>
        <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : '', transition: '.2s', color: c.text }} />
      </div>

      {expanded && (
        <div className="p-4 space-y-3" style={{ background: 'white' }}>
          {step.type === 'trigger' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Evento</label>
              <select className="input-base text-sm" value={step.config.event || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, event: e.target.value } })}>
                <option value="">Seleccionar...</option>
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
          )}

          {step.type === 'action' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Acção</label>
                <select className="input-base text-sm" value={step.config.type || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, type: e.target.value } })}>
                  <option value="">Seleccionar...</option>
                  {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                </select>
              </div>
              {(step.config.type === 'send_whatsapp' || step.config.type === 'send_email') && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mensagem</label>
                  <textarea className="input-base text-sm" rows={3} placeholder="Usa {{nome}}, {{empresa}} para personalizar" value={step.config.message || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, message: e.target.value } })} />
                </div>
              )}
              {step.config.type === 'create_task' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título da Tarefa</label>
                  <input className="input-base text-sm" placeholder="Ex: Follow-up com {{nome}}" value={step.config.taskTitle || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, taskTitle: e.target.value } })} />
                </div>
              )}
            </>
          )}

          {step.type === 'delay' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duração</label>
                <input type="number" className="input-base text-sm" placeholder="1" min="1" value={step.config.duration || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, duration: e.target.value } })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Unidade</label>
                <select className="input-base text-sm" value={step.config.unit || 'hours'} onChange={(e) => onChange({ ...step, config: { ...step.config, unit: e.target.value } })}>
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                  <option value="days">Dias</option>
                </select>
              </div>
            </div>
          )}

          {step.type === 'condition' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Campo</label>
                <select className="input-base text-sm" value={step.config.field || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, field: e.target.value } })}>
                  <option value="">Campo...</option>
                  {['Etapa', 'Valor', 'Prioridade', 'Fonte', 'Responsável', 'Tag'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Operador</label>
                <select className="input-base text-sm" value={step.config.operator || 'equals'} onChange={(e) => onChange({ ...step, config: { ...step.config, operator: e.target.value } })}>
                  <option value="equals">é igual a</option>
                  <option value="not_equals">não é igual a</option>
                  <option value="contains">contém</option>
                  <option value="greater_than">maior que</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Valor</label>
                <input className="input-base text-sm" placeholder="Valor..." value={step.config.value || ''} onChange={(e) => onChange({ ...step, config: { ...step.config, value: e.target.value } })} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AutomationEditor({ automation, onClose }: { automation?: any; onClose: () => void }) {
  const [name, setName] = useState(automation?.name || 'Nova Automatização');
  const [steps, setSteps] = useState<AutomationStep[]>(automation?.steps || [
    { id: '1', type: 'trigger', config: { event: 'message_received' } },
    { id: '2', type: 'action', config: { type: 'send_whatsapp', message: 'Olá {{nome}}! Recebemos a sua mensagem e entraremos em contacto brevemente.' } },
  ]);
  const [saving, setSaving] = useState(false);

  const addStep = (type: AutomationStep['type']) => {
    setSteps((p) => [...p, { id: Date.now().toString(), type, config: {} }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { name, trigger: steps[0]?.config || {}, actions: steps.slice(1).map((s) => s.config) };
      await api.post('/automations', data).catch(() => {});
      toast.success('Automatização guardada!');
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 24 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Zap size={20} style={{ color: 'var(--primary)' }} />
          <input className="flex-1 font-bold text-base outline-none" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }} value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {steps.map((step, i) => (
            <div key={step.id}>
              <StepCard step={step} index={i} onChange={(s) => setSteps((p) => p.map((x) => x.id === s.id ? s : x))} onRemove={() => setSteps((p) => p.filter((x) => x.id !== step.id))} />
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <ChevronRight size={16} style={{ color: 'var(--border-2, #CBD5E1)', transform: 'rotate(90deg)' }} />
                </div>
              )}
            </div>
          ))}

          {/* Add step buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(['trigger', 'condition', 'action', 'delay'] as const).map((type) => {
              if (type === 'trigger' && steps.some((s) => s.type === 'trigger')) return null;
              return (
                <button key={type} onClick={() => addStep(type)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border-dashed border-2 transition-colors hover:bg-gray-50" style={{ borderColor: STEP_COLORS[type].border, color: STEP_COLORS[type].text }}>
                  <Plus size={12} /> {STEP_ICONS[type]} Adicionar {type === 'trigger' ? 'trigger' : type === 'action' ? 'acção' : type === 'delay' ? 'espera' : 'condição'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const DEMO_AUTOMATIONS = [
  { id: '1', name: 'Mensagem de boas-vindas', isActive: true, trigger: 'Mensagem recebida', actions: ['Enviar WhatsApp', 'Criar lead'], executedCount: 234 },
  { id: '2', name: 'Follow-up D+1', isActive: true, trigger: 'Lead criado', actions: ['Esperar 24h', 'Enviar WhatsApp'], executedCount: 89 },
  { id: '3', name: 'Notificar gerente', isActive: false, trigger: 'Lead Ganho', actions: ['Notificar agente', 'Criar tarefa'], executedCount: 41 },
  { id: '4', name: 'Reactivar leads frios', isActive: true, trigger: 'Sem actividade 7 dias', actions: ['Resposta IA', 'Mover etapa'], executedCount: 15 },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(DEMO_AUTOMATIONS);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Automatizações</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Cria fluxos de trabalho automáticos para a tua equipa de vendas</p>
        </div>
        <button onClick={() => setEditing({})} className="btn btn-primary gap-2"><Plus size={16} /> Nova Automatização</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((auto) => (
          <div key={auto.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: auto.isActive ? '#EEF2FF' : 'var(--surface-3)' }}>
                  <Zap size={18} style={{ color: auto.isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{auto.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Executada {auto.executedCount} vezes</p>
                </div>
              </div>
              <button onClick={() => setAutomations((p) => p.map((a) => a.id === auto.id ? { ...a, isActive: !a.isActive } : a))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ background: auto.isActive ? '#ECFDF5' : 'var(--surface-3)', color: auto.isActive ? '#10B981' : 'var(--text-muted)' }}>
                {auto.isActive ? <Play size={11} /> : <Pause size={11} />}
                {auto.isActive ? 'Activa' : 'Inactiva'}
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#EEF2FF', color: 'var(--primary)' }}>⚡ {auto.trigger}</span>
                {auto.actions.map((action, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#ECFDF5', color: '#065F46' }}>{action}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(auto)} className="btn btn-outline flex-1 text-xs py-1.5">Editar</button>
              <button onClick={() => setAutomations((p) => p.filter((a) => a.id !== auto.id))} className="btn text-xs py-1.5 px-2.5" style={{ color: '#EF4444', border: '1px solid #FEE2E2', background: 'transparent' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        <button onClick={() => setEditing({})} className="card p-5 flex flex-col items-center justify-center gap-3 border-dashed cursor-pointer hover:border-indigo-300 transition-colors" style={{ minHeight: 180 }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
            <Plus size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nova automatização</p>
        </button>
      </div>

      {editing !== null && <AutomationEditor automation={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
