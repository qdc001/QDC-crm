import { useState, useEffect } from 'react';
import { Plus, Send, Users, CheckCircle, XCircle, Clock, BarChart3, Loader2, X, Radio } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Broadcast {
  id: string;
  name: string;
  channel: string;
  message?: string;
  templateName?: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  _count?: { recipients: number };
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#F1F5F9', color: '#64748B', label: 'Rascunho' },
  SCHEDULED: { bg: '#EEF2FF', color: '#6366F1', label: 'Agendado' },
  SENDING: { bg: '#FFFBEB', color: '#F59E0B', label: 'A enviar...' },
  COMPLETED: { bg: '#ECFDF5', color: '#10B981', label: 'Concluído' },
  FAILED: { bg: '#FEF2F2', color: '#EF4444', label: 'Falhou' },
  CANCELLED: { bg: '#F1F5F9', color: '#94A3B8', label: 'Cancelado' },
};

const CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: '💬', EMAIL: '📧', INSTAGRAM: '📸', FACEBOOK: '👥', SMS: '📱',
};

function NewBroadcastModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', channel: 'WHATSAPP', message: '', templateName: '', scheduledAt: '', filters: { tags: [] as string[] } });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.channel || (!form.message && !form.templateName)) { toast.error('Preenche todos os campos obrigatórios'); return; }
    setLoading(true);
    try {
      await api.post('/broadcasts', form);
      toast.success('Broadcast criado!');
      onCreated(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-base" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Novo Broadcast</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {['Configuração', 'Mensagem', 'Audiência'].map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1 rounded-full mb-1" style={{ background: i + 1 <= step ? 'var(--primary)' : 'var(--border)' }} />
              <p className="text-xs" style={{ color: i + 1 === step ? 'var(--primary)' : 'var(--text-muted)' }}>{s}</p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1.5">Nome do Broadcast *</label>
              <input className="input-base" placeholder="Ex: Promoção Março 2025" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1.5">Canal *</label>
              <div className="grid grid-cols-3 gap-2">
                {['WHATSAPP', 'EMAIL', 'SMS'].map((ch) => (
                  <button key={ch} onClick={() => setForm({ ...form, channel: ch })}
                    className="py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: form.channel === ch ? 'var(--primary)' : 'var(--surface-3)', color: form.channel === ch ? 'white' : 'var(--text-secondary)' }}>
                    {CHANNEL_ICONS[ch]} {ch}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Agendamento (opcional)</label>
              <input type="datetime-local" className="input-base" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-1">
              <button onClick={() => setForm({ ...form, templateName: '' })} className="text-xs px-3 py-1.5 rounded-full" style={{ background: !form.templateName ? 'var(--primary)' : 'var(--surface-3)', color: !form.templateName ? 'white' : 'var(--text-secondary)' }}>Mensagem directa</button>
              <button onClick={() => setForm({ ...form, message: '' })} className="text-xs px-3 py-1.5 rounded-full" style={{ background: form.templateName !== undefined && form.message === '' ? 'var(--primary)' : 'var(--surface-3)', color: 'var(--text-secondary)' }}>Template aprovado</button>
            </div>
            {!form.templateName || form.message ? (
              <div>
                <label className="block text-sm font-medium mb-1.5">Mensagem *</label>
                <textarea className="input-base" rows={5} placeholder="Olá {{nome}}, temos uma promoção especial para si!" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Usa {'{{nome}}'}, {'{{empresa}}'} para personalização</p>
              </div>
            ) : (
              <div><label className="block text-sm font-medium mb-1.5">Nome do Template</label>
                <input className="input-base" placeholder="Ex: hello_world" value={form.templateName} onChange={(e) => setForm({ ...form, templateName: e.target.value })} /></div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <p className="font-semibold text-sm mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Filtros de audiência</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Sem filtros: envia a todos os contactos com número de {form.channel === 'WHATSAPP' ? 'WhatsApp' : 'email'}.</p>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                <span className="text-sm">Todos os contactos elegíveis</span>
                <span className="ml-auto text-sm font-bold" style={{ color: 'var(--primary)' }}>~estimado</span>
              </div>
            </div>
            <div className="p-4 rounded-xl space-y-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <p className="text-xs font-semibold" style={{ color: '#92400E' }}>Atenção</p>
              <p className="text-xs" style={{ color: '#A16207' }}>Certifica-te que os destinatários consentiram receber mensagens. O WhatsApp pode banir números que enviam spam.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn btn-outline flex-1">Anterior</button>}
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} className="btn btn-primary flex-1">Próximo</button>
            : <button onClick={handleCreate} disabled={loading} className="btn btn-primary flex-1">
                {loading && <Loader2 size={14} className="animate-spin" />} Criar Broadcast
              </button>}
        </div>
      </div>
    </div>
  );
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const loadBroadcasts = async () => {
    try {
      const { data } = await api.get('/broadcasts');
      setBroadcasts(data);
    } catch {
      // demo data
      setBroadcasts([
        { id: '1', name: 'Promoção Janeiro', channel: 'WHATSAPP', message: 'Olá! Temos promoções especiais...', status: 'COMPLETED', totalRecipients: 245, sentCount: 238, failedCount: 7, completedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        { id: '2', name: 'Follow-up Clientes', channel: 'WHATSAPP', status: 'DRAFT', totalRecipients: 0, sentCount: 0, failedCount: 0, createdAt: new Date().toISOString() },
        { id: '3', name: 'Newsletter Fevereiro', channel: 'EMAIL', status: 'SCHEDULED', totalRecipients: 512, sentCount: 0, failedCount: 0, scheduledAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBroadcasts(); }, []);

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await api.post(`/broadcasts/${id}/send`);
      toast.success('Broadcast iniciado!');
      loadBroadcasts();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro ao enviar'); }
    finally { setSending(null); }
  };

  const stats = {
    total: broadcasts.length,
    completed: broadcasts.filter((b) => b.status === 'COMPLETED').length,
    totalSent: broadcasts.reduce((a, b) => a + b.sentCount, 0),
    totalRecipients: broadcasts.reduce((a, b) => a + b.totalRecipients, 0),
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Broadcasts</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Envia mensagens em massa para os teus contactos</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn btn-primary gap-2"><Plus size={16} /> Novo Broadcast</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#6366F1' },
          { label: 'Concluídos', value: stats.completed, color: '#10B981' },
          { label: 'Mensagens enviadas', value: stats.totalSent.toLocaleString(), color: '#0EA5E9' },
          { label: 'Destinatários únicos', value: stats.totalRecipients.toLocaleString(), color: '#F59E0B' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Canal', 'Estado', 'Destinatários', 'Enviado', 'Falhou', 'Data', 'Acções'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {broadcasts.map((b) => {
              const st = STATUS_COLORS[b.status] || STATUS_COLORS.DRAFT;
              const delivRate = b.totalRecipients > 0 ? Math.round((b.sentCount / b.totalRecipients) * 100) : 0;
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center gap-2">
                      <Radio size={14} style={{ color: 'var(--primary)' }} />
                      {b.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {CHANNEL_ICONS[b.channel]} {b.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text-secondary)' }}>{b.totalRecipients || '-'}</td>
                  <td className="px-4 py-3">
                    {b.sentCount > 0 && (
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#10B981' }}>{b.sentCount} ({delivRate}%)</p>
                        <div className="h-1 rounded-full mt-0.5" style={{ background: 'var(--surface-3)', width: 60 }}>
                          <div className="h-full rounded-full" style={{ width: `${delivRate}%`, background: '#10B981' }} />
                        </div>
                      </div>
                    )}
                    {!b.sentCount && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: b.failedCount > 0 ? '#EF4444' : 'var(--text-muted)' }}>{b.failedCount || '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {b.scheduledAt ? `⏰ ${format(new Date(b.scheduledAt), 'dd/MM HH:mm')}` : format(new Date(b.createdAt), 'dd/MM/yyyy', { locale: pt })}
                  </td>
                  <td className="px-4 py-3">
                    {(b.status === 'DRAFT' || b.status === 'SCHEDULED') && (
                      <button onClick={() => handleSend(b.id)} disabled={!!sending} className="btn btn-primary text-xs py-1 px-3 gap-1">
                        {sending === b.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Enviar
                      </button>
                    )}
                    {b.status === 'COMPLETED' && (
                      <button className="btn text-xs py-1 px-3" style={{ color: 'var(--primary)', border: '1px solid #EEF2FF', background: 'transparent' }}>
                        <BarChart3 size={12} /> Stats
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {broadcasts.length === 0 && !loading && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <Radio size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum broadcast criado ainda</p>
          </div>
        )}
      </div>

      {showNew && <NewBroadcastModal onClose={() => setShowNew(false)} onCreated={loadBroadcasts} />}
    </div>
  );
}
