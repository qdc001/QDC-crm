import { useState } from 'react';
import { MessageSquare, Mail, Zap, Globe, CheckCircle, XCircle, Settings, Loader2, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

function WhatsAppConfigModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ token: '', phoneId: '', businessAccountId: '', verifyToken: 'kommo_verify_' + Math.random().toString(36).slice(2) });
  const [loading, setLoading] = useState(false);
  const webhookUrl = `${window.location.origin.replace(':5173', ':3001')}/api/whatsapp/webhook`;

  const handleSave = async () => {
    if (!form.token || !form.phoneId) { toast.error('Token e Phone ID são obrigatórios'); return; }
    setLoading(true);
    try {
      await api.post('/whatsapp/configure', form);
      toast.success('WhatsApp configurado!');
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E7F9EE' }}>
              <MessageSquare size={20} style={{ color: '#25D366' }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>WhatsApp Business API</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Meta Cloud API</p>
            </div>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-3 rounded-xl mb-4 text-xs space-y-1.5" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Como configurar:</p>
          <p>1. Acede a developers.facebook.com → Cria App → WhatsApp</p>
          <p>2. Copia o Token permanente e Phone Number ID</p>
          <p>3. Em Webhooks, adiciona:</p>
          <div className="p-2 rounded font-mono break-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--primary)' }}>{webhookUrl}</div>
          <p>Token de verificação: <span className="font-mono font-semibold">{form.verifyToken}</span></p>
        </div>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium mb-1">Token de Acesso *</label><input className="input-base font-mono text-xs" placeholder="EAAG..." value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Phone Number ID *</label><input className="input-base" placeholder="123456..." value={form.phoneId} onChange={(e) => setForm({ ...form, phoneId: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Business Account ID</label><input className="input-base" placeholder="Opcional" value={form.businessAccountId} onChange={(e) => setForm({ ...form, businessAccountId: e.target.value })} /></div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary flex-1" style={{ background: '#25D366' }}>
            {loading && <Loader2 size={14} className="animate-spin" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', color: '#25D366', bg: '#E7F9EE', desc: 'Envia e recebe mensagens WhatsApp. Captura leads automaticamente.', cat: 'Mensagens', badge: 'Meta Cloud API', hasConfig: true },
  { id: 'instagram', name: 'Instagram Direct', icon: '📸', color: '#E1306C', bg: '#FDE8F0', desc: 'Gere mensagens directas do Instagram no CRM.', cat: 'Mensagens', badge: 'Meta' },
  { id: 'facebook', name: 'Facebook Messenger', icon: '👥', color: '#1877F2', bg: '#E7F0FD', desc: 'Integra com o Messenger para receber e responder mensagens.', cat: 'Mensagens' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#2AABEE', bg: '#E5F5FD', desc: 'Conecta um bot Telegram para comunicar com os teus clientes.', cat: 'Mensagens' },
  { id: 'tiktok', name: 'TikTok Messages', icon: '🎵', color: '#000', bg: '#F0F0F0', desc: 'Gere mensagens e comentários do TikTok directamente.', cat: 'Mensagens', badge: 'Novo' },
  { id: 'email', name: 'Email SMTP/IMAP', icon: '📧', color: '#6366F1', bg: '#EEF2FF', desc: 'Sincroniza o teu email para enviar e receber dentro dos leads.', cat: 'Email' },
  { id: 'gcal', name: 'Google Calendar', icon: '📅', color: '#0F9D58', bg: '#E6F4EA', desc: 'Sincroniza tarefas e reuniões com o Google Calendar.', cat: 'Produtividade' },
  { id: 'zapier', name: 'Zapier', icon: '⚡', color: '#FF4A00', bg: '#FFF0EB', desc: 'Liga o CRM a mais de 5000 aplicações via Zapier.', cat: 'Automação', badge: 'Popular' },
  { id: 'make', name: 'Make (Integromat)', icon: '🔗', color: '#6D00CC', bg: '#F3E8FF', desc: 'Cria cenários de automação avançados com o Make.', cat: 'Automação' },
  { id: 'shopify', name: 'Shopify', icon: '🛒', color: '#96BF48', bg: '#F0F7E6', desc: 'Importa clientes e pedidos Shopify como leads.', cat: 'E-commerce' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🛍️', color: '#7F54B3', bg: '#F3EEF9', desc: 'Integra com a tua loja WooCommerce.', cat: 'E-commerce' },
  { id: 'voip', name: 'CloudTalk VoIP', icon: '📞', color: '#1A73E8', bg: '#E8F1FD', desc: 'Faz e recebe chamadas directamente do CRM com gravação.', cat: 'Chamadas' },
];

export default function IntegrationsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const categories = [...new Set(INTEGRATIONS.map((i) => i.cat))];

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Integrações</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Liga o teu CRM aos canais e ferramentas que já usas</p>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.filter((i) => i.cat === cat).map((intg) => {
              const isConn = connected.includes(intg.id);
              return (
                <div key={intg.id} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: intg.bg }}>{intg.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{intg.name}</p>
                        {intg.badge && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EEF2FF', color: 'var(--primary)' }}>{intg.badge}</span>}
                      </div>
                      {isConn
                        ? <span className="flex items-center gap-1 text-xs" style={{ color: '#10B981' }}><CheckCircle size={11} />Conectado</span>
                        : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Não conectado</span>}
                    </div>
                  </div>
                  <p className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{intg.desc}</p>
                  <div className="flex gap-2">
                    {isConn ? (
                      <>
                        <button className="btn btn-outline flex-1 text-xs py-1.5"><Settings size={12} /> Configurar</button>
                        <button onClick={() => setConnected((p) => p.filter((x) => x !== intg.id))} className="btn text-xs py-1.5 px-3" style={{ color: '#EF4444', border: '1px solid #FEE2E2', background: 'transparent' }}><XCircle size={13} /></button>
                      </>
                    ) : (
                      <button onClick={() => intg.hasConfig ? setActiveModal(intg.id) : toast('Em breve!', { icon: '🚧' })} className="btn text-xs py-1.5 w-full text-white" style={{ background: intg.color }}>
                        Conectar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {activeModal === 'whatsapp' && <WhatsAppConfigModal onClose={() => setActiveModal(null)} onSaved={() => setConnected((p) => [...p, 'whatsapp'])} />}
    </div>
  );
}
