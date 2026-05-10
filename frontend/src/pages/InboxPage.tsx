import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Send, Paperclip, Phone, MoreVertical, Mail, MessageSquare,
  MessageCircle, Loader2, ExternalLink, X, GitBranch, RefreshCw, Check, CheckCheck,
  Inbox, Building2, User as UserIcon,
} from 'lucide-react';
import api, { Message, Conversation, Lead, Pipeline, Contact } from '../lib/api';
import toast from 'react-hot-toast';
import { useUIStore } from '../store';
import { AddLeadModal } from './PipelinePage';

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp', EMAIL: 'Email', INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook', TELEGRAM: 'Telegram', WEBCHAT: 'Webchat',
  SMS: 'SMS', INTERNAL: 'Interno',
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: '#25D366', EMAIL: '#6366F1', INSTAGRAM: '#E1306C',
  FACEBOOK: '#1877F2', TELEGRAM: '#0088CC', WEBCHAT: '#0EA5E9',
  SMS: '#F59E0B', INTERNAL: '#94A3B8',
};

function ChannelBadge({ channel }: { channel: string }) {
  const color = CHANNEL_COLORS[channel] || '#94A3B8';
  if (channel === 'EMAIL') return <Mail size={12} style={{ color }} />;
  if (channel === 'WEBCHAT') return <MessageSquare size={12} style={{ color }} />;
  return (
    <span
      className="inline-flex items-center justify-center text-white font-bold rounded-full"
      style={{ background: color, fontSize: 8, width: 14, height: 14 }}
    >
      {channel[0]}
    </span>
  );
}

function timeShort(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - dDay.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return d.toLocaleDateString('pt-PT', { weekday: 'short' });
  return d.toLocaleDateString('pt-PT');
}

function fullName(c: Conversation['contact']) {
  if (!c) return 'Sem contacto';
  return `${c.firstName} ${c.lastName || ''}`.trim();
}

// =============== Modal: Nova mensagem manual ===============
function NewMessageModal({
  contacts,
  onClose,
  onCreated,
}: {
  contacts: Contact[];
  onClose: () => void;
  onCreated: (m: Message) => void;
}) {
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [content, setContent] = useState('');
  const [direction, setDirection] = useState<'INBOUND' | 'OUTBOUND'>('OUTBOUND');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId || !content.trim()) {
      toast.error('Contacto e conteudo obrigatorios');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/messages', {
        content, channel, contactId,
        direction,
      });
      toast.success('Mensagem registada');
      onCreated(data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nova mensagem</h3>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Regista uma mensagem manual (recebida ou enviada por fora do sistema).
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Contacto *</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="input-base" required>
              <option value="">— Escolher contacto —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ''} {c.phone ? `· ${c.phone}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Canal</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="input-base">
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Direccao</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as any)} className="input-base">
                <option value="OUTBOUND">Enviada</option>
                <option value="INBOUND">Recebida</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Conteudo *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="input-base" rows={4} required />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1 py-2" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Registar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============== Pagina principal ===============
export default function InboxPage() {
  const navigate = useNavigate();
  const { globalSearchQuery, setGlobalSearchQuery } = useUIStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [search, setSearch] = useState(globalSearchQuery || '');
  const [channelFilter, setChannelFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSearch(globalSearchQuery || ''), [globalSearchQuery]);

  // Carregar conversas
  const loadConversations = () => {
    const params = new URLSearchParams();
    if (channelFilter) params.set('channel', channelFilter);
    if (search.trim()) params.set('search', search.trim());
    if (unreadOnly) params.set('unreadOnly', 'true');
    setLoadingConvs(true);
    api.get(`/messages/conversations?${params.toString()}`)
      .then(({ data }) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Erro a carregar conversas'))
      .finally(() => setLoadingConvs(false));
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter, search, unreadOnly]);

  // Carregar contactos e pipelines uma vez
  useEffect(() => {
    api.get('/contacts?limit=500').then(({ data }) => setContacts(data.contacts || [])).catch(() => {});
    api.get('/pipelines').then(({ data }) => setPipelines(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const selected = useMemo(() => conversations.find((c) => c.key === selectedKey), [conversations, selectedKey]);

  // Carregar mensagens da conversa seleccionada e marcar como lidas
  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    setLoadingMsgs(true);
    const params = new URLSearchParams();
    if (selected.contact?.id) params.set('contactId', selected.contact.id);
    else if (selected.leadId) params.set('leadId', selected.leadId);

    api.get(`/messages?${params.toString()}`)
      .then(({ data }) => {
        setMessages(Array.isArray(data) ? data : []);
        // marcar lidas
        if (selected.unread > 0) {
          api.post('/messages/mark-conversation-read', {
            contactId: selected.contact?.id,
            leadId: selected.leadId,
          }).then(() => {
            // actualizar conversas localmente
            setConversations((prev) => prev.map((c) => c.key === selected.key ? { ...c, unread: 0 } : c));
          }).catch(() => {});
        }
      })
      .catch(() => toast.error('Erro a carregar mensagens'))
      .finally(() => setLoadingMsgs(false));
  }, [selectedKey]); // eslint-disable-line

  // Auto-scroll para o fim
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-seleccionar primeira conversa
  useEffect(() => {
    if (!selectedKey && conversations.length > 0) {
      setSelectedKey(conversations[0].key);
    }
  }, [conversations, selectedKey]);

  const sendMessage = async () => {
    if (!draft.trim() || !selected) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        content: draft.trim(),
        channel: selected.channel,
        contactId: selected.contact?.id,
        leadId: selected.leadId,
      });
      setMessages((p) => [...p, data]);
      setDraft('');
      // actualizar last message na lista
      setConversations((prev) => prev.map((c) => c.key === selected.key ? { ...c, lastMessage: data } : c));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro a enviar');
    } finally {
      setSending(false);
    }
  };

  const handleCreateLeadFromConv = () => {
    if (!selected) return;
    if (pipelines.length === 0) { toast.error('Sem pipelines disponiveis'); return; }
    setCreatingLead(true);
  };

  const cleanPhone = (p?: string | null) => (p || '').replace(/[^0-9+]/g, '');

  const totalConvs = conversations.length;
  const totalUnread = conversations.reduce((a, b) => a + b.unread, 0);

  const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
  const defaultStage = defaultPipeline?.stages?.[0];

  return (
    <div className="flex h-full" style={{ background: 'var(--surface)' }}>
      {/* Sidebar - lista de conversas */}
      <div className="w-80 flex flex-col flex-shrink-0" style={{ borderRight: '1px solid var(--border)' }}>
        <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <Inbox size={16} style={{ color: 'var(--primary)' }} />
              Caixa de Entrada
            </h2>
            <div className="flex gap-1">
              <button onClick={loadConversations} className="p-1.5 rounded hover:bg-slate-100" title="Recarregar">
                <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => setNewMessageOpen(true)} className="p-1.5 rounded hover:bg-slate-100" title="Nova mensagem manual">
                <MessageCircle size={14} style={{ color: 'var(--primary)' }} />
              </button>
            </div>
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {totalConvs} conversa{totalConvs !== 1 ? 's' : ''}
            {totalUnread > 0 && <span className="ml-2 font-medium" style={{ color: 'var(--primary)' }}>· {totalUnread} nao lidas</span>}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-base text-sm" style={{ paddingLeft: 32 }} placeholder="Pesquisar conversas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {/* Channel filters */}
          <div className="flex gap-1 mt-3 flex-wrap">
            <button onClick={() => setChannelFilter('')} className="text-xs px-2 py-1 rounded font-medium"
              style={{ background: channelFilter === '' ? 'var(--primary)' : 'var(--surface-3)', color: channelFilter === '' ? '#fff' : 'var(--text-secondary)' }}>
              Todos
            </button>
            {(['WHATSAPP', 'EMAIL', 'INSTAGRAM'] as const).map((ch) => (
              <button key={ch} onClick={() => setChannelFilter(channelFilter === ch ? '' : ch)} className="text-xs px-2 py-1 rounded font-medium"
                style={{ background: channelFilter === ch ? CHANNEL_COLORS[ch] : 'var(--surface-3)', color: channelFilter === ch ? '#fff' : 'var(--text-secondary)' }}>
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
            <button onClick={() => setUnreadOnly(!unreadOnly)} className="text-xs px-2 py-1 rounded font-medium"
              style={{ background: unreadOnly ? 'var(--primary)' : 'var(--surface-3)', color: unreadOnly ? '#fff' : 'var(--text-secondary)' }}>
              Nao lidas
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Inbox size={28} style={{ color: 'var(--text-muted)' }} />
              <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Sem conversas</p>
              <button onClick={() => setNewMessageOpen(true)} className="btn btn-primary mt-3 py-1.5 px-3 text-xs">
                <MessageCircle size={12} /> Registar mensagem
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedKey === conv.key;
              const initial = (conv.contact?.firstName?.[0] || '?').toUpperCase();
              return (
                <button
                  key={conv.key}
                  onClick={() => setSelectedKey(conv.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  style={{ background: isSelected ? 'var(--primary-light)' : 'transparent', borderBottom: '1px solid var(--border)' }}
                >
                  <div className="relative flex-shrink-0">
                    {conv.contact?.avatar ? (
                      <img src={conv.contact.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--primary)' }}>
                        {conv.contact?.type === 'COMPANY' ? <Building2 size={16} /> : initial}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {fullName(conv.contact)}
                      </span>
                      <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                        {timeShort(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ChannelBadge channel={conv.channel} />
                      <span className="text-xs truncate" style={{ color: conv.unread > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: conv.unread > 0 ? 500 : 400 }}>
                        {conv.lastMessage.direction === 'OUTBOUND' && <span className="mr-1">Voce: </span>}
                        {conv.lastMessage.content?.slice(0, 50)}
                      </span>
                      {conv.unread > 0 && (
                        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white flex-shrink-0 font-medium" style={{ background: 'var(--primary)', fontSize: 10 }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--surface-2)' }}>
            <Inbox size={40} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Selecciona uma conversa para comecar</p>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
                  {selected.contact?.avatar ? (
                    <img src={selected.contact.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : selected.contact?.type === 'COMPANY' ? (
                    <Building2 size={16} />
                  ) : (
                    (selected.contact?.firstName?.[0] || '?').toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {fullName(selected.contact)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <ChannelBadge channel={selected.channel} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {CHANNEL_LABELS[selected.channel]}
                      {selected.contact?.phone && ` · ${selected.contact.phone}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {selected.contact?.whatsapp && (
                  <a href={`https://wa.me/${cleanPhone(selected.contact.whatsapp)}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg hover:bg-green-50" title="Abrir WhatsApp">
                    <MessageCircle size={16} style={{ color: '#25D366' }} />
                  </a>
                )}
                {selected.contact?.phone && (
                  <a href={`tel:${cleanPhone(selected.contact.phone)}`} className="p-2 rounded-lg hover:bg-slate-100" title="Telefonar">
                    <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                  </a>
                )}
                {selected.contact?.email && (
                  <a href={`mailto:${selected.contact.email}`} className="p-2 rounded-lg hover:bg-slate-100" title="Email">
                    <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                  </a>
                )}
                <button onClick={handleCreateLeadFromConv} className="btn btn-primary text-xs py-1.5 px-3" disabled={!defaultStage}>
                  <GitBranch size={12} /> Criar Lead
                </button>
                {selected.leadId && (
                  <button onClick={() => navigate(`/pipeline?leadId=${selected.leadId}`)} className="p-2 rounded-lg hover:bg-slate-100" title="Ver lead">
                    <ExternalLink size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background: 'var(--surface-2)' }}>
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sem mensagens nesta conversa</p>
              ) : (
                messages.map((msg) => {
                  const out = msg.direction === 'OUTBOUND';
                  return (
                    <div key={msg.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-md px-4 py-2.5 text-sm"
                        style={{
                          background: out ? 'var(--primary)' : 'var(--surface)',
                          color: out ? 'white' : 'var(--text-primary)',
                          borderRadius: out ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {!out && msg.contact && msg.sentBy && (
                          <p className="text-xs font-medium mb-1" style={{ color: out ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                            {msg.sentBy.name}
                          </p>
                        )}
                        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs" style={{ color: out ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                          {out && (msg.status === 'READ' ? <CheckCheck size={12} style={{ color: '#A5F3FC' }} /> : msg.status === 'DELIVERED' ? <CheckCheck size={12} /> : <Check size={12} />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-end gap-2 p-3 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                <button className="p-1 rounded-lg hover:bg-slate-100 flex-shrink-0" disabled title="Anexar (em breve)">
                  <Paperclip size={18} style={{ color: 'var(--text-muted)' }} />
                </button>
                <textarea
                  className="flex-1 text-sm resize-none outline-none min-h-[36px] max-h-32"
                  style={{ color: 'var(--text-primary)', background: 'transparent' }}
                  placeholder={`Mensagem para ${fullName(selected.contact)}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                  disabled={sending}
                />
                <button onClick={sendMessage} disabled={sending || !draft.trim()} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)', opacity: (!draft.trim() || sending) ? 0.5 : 1 }}>
                  {sending ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
                </button>
              </div>
              <p className="text-[10px] mt-2 px-1" style={{ color: 'var(--text-muted)' }}>
                Mensagem registada via {CHANNEL_LABELS[selected.channel]} (sem integracao automatica de envio configurada)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Painel direito - info do contacto */}
      {selected && selected.contact && (
        <div className="w-72 flex flex-col flex-shrink-0" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Contacto</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center">
              {selected.contact.avatar ? (
                <img src={selected.contact.avatar} className="w-16 h-16 rounded-full object-cover mx-auto" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto" style={{ background: 'var(--primary)' }}>
                  {selected.contact.type === 'COMPANY' ? <Building2 size={24} /> : (selected.contact.firstName?.[0] || '?').toUpperCase()}
                </div>
              )}
              <p className="font-semibold mt-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {fullName(selected.contact)}
              </p>
              <span className="text-xs px-2 py-0.5 rounded inline-block mt-1" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                {selected.contact.type === 'COMPANY' ? 'Empresa' : 'Pessoa'}
              </span>
            </div>

            <div className="space-y-2">
              {selected.contact.phone && (
                <div className="text-xs">
                  <p style={{ color: 'var(--text-muted)' }}>Telefone</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.contact.phone}</p>
                </div>
              )}
              {selected.contact.whatsapp && (
                <div className="text-xs">
                  <p style={{ color: 'var(--text-muted)' }}>WhatsApp</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.contact.whatsapp}</p>
                </div>
              )}
              {selected.contact.email && (
                <div className="text-xs">
                  <p style={{ color: 'var(--text-muted)' }}>Email</p>
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selected.contact.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Mensagens</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.total}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Nao lidas</span>
                <span className="font-medium" style={{ color: selected.unread > 0 ? 'var(--primary)' : 'var(--text-primary)' }}>{selected.unread}</span>
              </div>
            </div>

            <button onClick={() => navigate(`/contacts?contactId=${selected.contact!.id}`)} className="btn w-full text-xs py-2"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <UserIcon size={12} /> Ver perfil completo
            </button>
          </div>
        </div>
      )}

      {/* Modais */}
      {newMessageOpen && (
        <NewMessageModal
          contacts={contacts}
          onClose={() => setNewMessageOpen(false)}
          onCreated={() => loadConversations()}
        />
      )}
      {creatingLead && selected && defaultPipeline && defaultStage && (
        <AddLeadModal
          stageId={defaultStage.id}
          pipelineId={defaultPipeline.id}
          onClose={() => setCreatingLead(false)}
          onCreated={async (lead) => {
            // associar contacto ao lead se houver
            if (selected.contact?.id) {
              try {
                await api.patch(`/leads/${lead.id}`, { contactId: selected.contact.id });
              } catch {}
            }
            toast.success('Lead criado');
            setCreatingLead(false);
            loadConversations();
          }}
        />
      )}
    </div>
  );
}
