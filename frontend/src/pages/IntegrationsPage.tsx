import { useEffect, useState } from 'react';
import { MessageCircle, Mail, Globe, CheckCircle2, Settings, Loader2, X, Plus, Trash2, Send } from 'lucide-react';
import api, { IntegrationItem } from '../lib/api';
import toast from 'react-hot-toast';

type IntegrationType = 'WHATSAPP_CLOUD' | 'EVOLUTION' | 'EMAIL';

interface IntegrationDef {
  type: IntegrationType;
  // Backend usa enum IntegrationType: WHATSAPP, WEBHOOK, EMAIL_SMTP, etc.
  backendType: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  desc: string;
  fields: Array<{ key: string; label: string; type?: 'text' | 'password' | 'number' | 'checkbox'; required?: boolean; placeholder?: string }>;
}

const DEFINITIONS: IntegrationDef[] = [
  {
    type: 'WHATSAPP_CLOUD',
    backendType: 'WHATSAPP',
    name: 'WhatsApp Cloud API',
    icon: MessageCircle,
    color: '#25D366',
    bg: '#E7F9EE',
    desc: 'Envia mensagens via Meta Cloud API. Requer Phone Number ID e Access Token.',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'EAAG...' },
      { key: 'phoneNumberId', label: 'Phone Number ID', required: true, placeholder: '123456789012345' },
      { key: 'businessAccountId', label: 'Business Account ID (opcional)', placeholder: '...' },
    ],
  },
  {
    type: 'EVOLUTION',
    backendType: 'WEBHOOK', // usar tipo WEBHOOK + name=Evolution
    name: 'Evolution API',
    icon: Globe,
    color: '#6366F1',
    bg: '#EEF2FF',
    desc: 'WhatsApp via Evolution API (auto-hospedada). Compatível com a tua infraestrutura M.E.T.A.',
    fields: [
      { key: 'baseUrl', label: 'URL Base', required: true, placeholder: 'https://evolution.exemplo.com' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'instanceName', label: 'Nome da Instância', required: true, placeholder: 'absalao' },
    ],
  },
  {
    type: 'EMAIL',
    backendType: 'EMAIL_SMTP',
    name: 'Email SMTP',
    icon: Mail,
    color: '#0EA5E9',
    bg: '#F0F9FF',
    desc: 'Envio de email via servidor SMTP (Gmail, Outlook, custom).',
    fields: [
      { key: 'host', label: 'Host SMTP', required: true, placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Porta', type: 'number', required: true, placeholder: '587' },
      { key: 'secure', label: 'SSL/TLS (porta 465)', type: 'checkbox' },
      { key: 'user', label: 'Utilizador (email)', required: true, placeholder: 'tu@exemplo.com' },
      { key: 'pass', label: 'Password / App password', type: 'password', required: true },
      { key: 'fromName', label: 'Nome remetente', placeholder: 'Absalão' },
      { key: 'fromEmail', label: 'Email remetente (opcional)', placeholder: 'igual ao utilizador se vazio' },
    ],
  },
];

function ConfigModal({
  def, existing, onClose, onSaved,
}: {
  def: IntegrationDef;
  existing?: IntegrationItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [creds, setCreds] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    def.fields.forEach((f) => {
      initial[f.key] = (existing?.credentials as any)?.[f.key] ?? (f.type === 'checkbox' ? false : '');
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const Icon = def.icon;

  const handleSave = async () => {
    // validar required
    for (const f of def.fields) {
      if (f.required && !creds[f.key]) {
        toast.error(`${f.label} obrigatorio`);
        return;
      }
    }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/integrations/${existing.id}`, {
          name: def.name,
          credentials: creds,
          isActive: true,
        });
      } else {
        await api.post('/integrations', {
          type: def.backendType,
          name: def.name,
          credentials: creds,
          isActive: true,
        });
      }
      toast.success('Integracao guardada');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: def.bg }}>
              <Icon size={20} style={{ color: def.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{def.name}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{def.desc}</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          {def.fields.map((f) => (
            <div key={f.key}>
              {f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!creds[f.key]} onChange={(e) => setCreds({ ...creds, [f.key]: e.target.checked })} />
                  {f.label}
                </label>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {f.label}{f.required && ' *'}
                  </label>
                  <input
                    type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
                    value={creds[f.key] || ''}
                    onChange={(e) => setCreds({ ...creds, [f.key]: e.target.value })}
                    className="input-base"
                    placeholder={f.placeholder}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn flex-1 py-2" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary flex-1 py-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TestSendModal({
  type, onClose,
}: {
  type: IntegrationType;
  onClose: () => void;
}) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!to || !message) { toast.error('Destinatario e mensagem obrigatorios'); return; }
    setLoading(true);
    try {
      let endpoint = '';
      let payload: any = { to, message };
      if (type === 'WHATSAPP_CLOUD') endpoint = '/integrations/whatsapp-cloud/send';
      else if (type === 'EVOLUTION') endpoint = '/integrations/evolution/send';
      else if (type === 'EMAIL') {
        endpoint = '/integrations/email/send';
        payload = { to, subject, html: message };
      }
      await api.post(endpoint, payload);
      toast.success('Enviado!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro a enviar');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Teste de envio</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={type === 'EMAIL' ? 'email@destino.com' : '+25884...'} className="input-base" />
          {type === 'EMAIL' && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className="input-base" />}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensagem" className="input-base" rows={4} />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn flex-1 py-2" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>Cancelar</button>
          <button onClick={handleSend} disabled={loading} className="btn btn-primary flex-1 py-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ def: IntegrationDef; existing: IntegrationItem | null } | null>(null);
  const [testing, setTesting] = useState<IntegrationType | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/integrations').then(({ data }) => setItems(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const findExisting = (def: IntegrationDef): IntegrationItem | null => {
    if (def.type === 'EVOLUTION') {
      return items.find((i) => i.type === 'WEBHOOK' && i.name?.toLowerCase().includes('evolution')) || null;
    }
    return items.find((i) => i.type === def.backendType) || null;
  };

  const handleDelete = async (item: IntegrationItem) => {
    if (!confirm('Eliminar esta integracao?')) return;
    try {
      await api.delete(`/integrations/${item.id}`);
      toast.success('Eliminada');
      load();
    } catch { toast.error('Erro'); }
  };

  const toggleActive = async (item: IntegrationItem) => {
    try {
      await api.patch(`/integrations/${item.id}`, { isActive: !item.isActive });
      load();
    } catch { toast.error('Erro'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Integrações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Liga o CRM a canais externos para enviar mensagens reais.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFINITIONS.map((def) => {
            const Icon = def.icon;
            const existing = findExisting(def);
            const configured = !!existing;
            const active = existing?.isActive;
            return (
              <div key={def.type} className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: def.bg }}>
                    <Icon size={20} style={{ color: def.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{def.name}</p>
                    {configured ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: active ? '#10B981' : 'var(--text-muted)' }}>
                        <CheckCircle2 size={11} /> {active ? 'Activa' : 'Desactivada'}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Nao configurada</span>
                    )}
                  </div>
                </div>
                <p className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{def.desc}</p>
                <div className="flex gap-2">
                  {configured ? (
                    <>
                      <button onClick={() => setEditing({ def, existing })} className="btn flex-1 text-xs py-1.5" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                        <Settings size={12} /> Editar
                      </button>
                      <button onClick={() => toggleActive(existing!)} className="btn text-xs py-1.5 px-2" style={{ background: active ? '#FEF3C7' : '#D1FAE5', color: active ? '#92400E' : '#065F46' }}>
                        {active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => setTesting(def.type)} className="btn text-xs py-1.5 px-2" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} title="Testar envio">
                        <Send size={12} />
                      </button>
                      <button onClick={() => handleDelete(existing!)} className="btn text-xs py-1.5 px-2" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditing({ def, existing: null })} className="btn w-full text-xs py-1.5 text-white" style={{ background: def.color }}>
                      <Plus size={12} /> Configurar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-4" style={{ background: 'var(--surface-2)' }}>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Notas</p>
        <ul className="text-xs space-y-1 list-disc pl-4" style={{ color: 'var(--text-secondary)' }}>
          <li><strong>WhatsApp Cloud</strong>: precisa de uma conta Meta Business + Phone Number ID + Access Token (developers.facebook.com).</li>
          <li><strong>Evolution API</strong>: hospeda a tua propria instancia (compativel com o teu setup do projecto M.E.T.A.).</li>
          <li><strong>Email SMTP</strong>: usa app password do Gmail (segurança {">"} app passwords) ou credenciais do teu provedor.</li>
          <li>Para receber mensagens automaticamente, o webhook de cada plataforma deve apontar para <code>{window.location.origin.replace(':3000', ':3001').replace('crm-frontend', 'crm-backend')}/api/webhooks</code>.</li>
        </ul>
      </div>

      {editing && (
        <ConfigModal
          def={editing.def}
          existing={editing.existing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {testing && <TestSendModal type={testing} onClose={() => setTesting(null)} />}
    </div>
  );
}
