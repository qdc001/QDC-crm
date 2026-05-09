import { useState } from 'react';
import { Search, Send, Paperclip, Smile, Phone, Video, MoreVertical, Mail, MessageSquare } from 'lucide-react';

const DEMO_CONVERSATIONS = [
  { id: '1', name: 'Carlos Machava', channel: 'WHATSAPP', lastMessage: 'Sim, posso amanhã às 14h', time: '14:32', unread: 2, online: true, avatar: 'C' },
  { id: '2', name: 'Ana Sitoe', channel: 'EMAIL', lastMessage: 'Obrigada pela proposta enviada', time: '13:15', unread: 0, online: false, avatar: 'A' },
  { id: '3', name: 'João Tembe', channel: 'INSTAGRAM', lastMessage: 'Quero saber mais sobre o produto', time: 'Ontem', unread: 5, online: true, avatar: 'J' },
  { id: '4', name: 'Maria Cossa', channel: 'WHATSAPP', lastMessage: 'Recebi o relatório, muito bom!', time: 'Ontem', unread: 0, online: false, avatar: 'M' },
  { id: '5', name: 'Pedro Mondlane', channel: 'EMAIL', lastMessage: 'Quando podemos agendar?', time: 'Seg', unread: 1, online: false, avatar: 'P' },
];

const DEMO_MESSAGES = [
  { id: '1', content: 'Bom dia! Vi o vosso serviço no Instagram e gostaria de saber mais.', direction: 'INBOUND', time: '09:00' },
  { id: '2', content: 'Bom dia, Carlos! Muito obrigado pelo interesse. Temos várias soluções disponíveis. O que específicamente procura?', direction: 'OUTBOUND', time: '09:05' },
  { id: '3', content: 'Preciso de um sistema de gestão para a minha empresa de construção. Temos cerca de 50 funcionários.', direction: 'INBOUND', time: '09:10' },
  { id: '4', content: 'Perfeito! O nosso ERP é ideal para empresas de construção. Posso enviar-lhe uma proposta personalizada. Qual é o seu email?', direction: 'OUTBOUND', time: '09:12' },
  { id: '5', content: 'carlos@construtora.co.mz. Sim, pode enviar. Quando podemos agendar uma demonstração?', direction: 'INBOUND', time: '09:15' },
  { id: '6', content: 'Sim, posso amanhã às 14h', direction: 'INBOUND', time: '14:32' },
];

const channelIcon: Record<string, React.ReactNode> = {
  WHATSAPP: <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: '#25D366', fontSize: 8, fontWeight: 'bold' }}>W</div>,
  EMAIL: <Mail size={14} style={{ color: '#6366F1' }} />,
  INSTAGRAM: <div className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', fontSize: 8 }}>I</div>,
  WEBCHAT: <MessageSquare size={14} style={{ color: '#0EA5E9' }} />,
};

export default function InboxPage() {
  const [selected, setSelected] = useState(DEMO_CONVERSATIONS[0]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filtered = DEMO_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="flex h-full" style={{ background: 'var(--surface)' }}>
      {/* Sidebar */}
      <div className="w-80 flex flex-col flex-shrink-0" style={{ borderRight: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Caixa de Entrada</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input-base pl-8 py-2 text-sm" placeholder="Pesquisar conversas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {/* Channel filters */}
          <div className="flex gap-2 mt-3">
            {['Todos', 'WhatsApp', 'Email', 'Instagram'].map((f) => (
              <button key={f} className="text-xs px-2.5 py-1 rounded-full transition-colors font-medium"
                style={{ background: f === 'Todos' ? 'var(--primary)' : 'var(--surface-3)', color: f === 'Todos' ? 'white' : 'var(--text-secondary)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => (
            <button key={conv.id} onClick={() => setSelected(conv)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              style={{ background: selected.id === conv.id ? 'var(--primary-light, #EEF2FF)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'var(--primary)' }}>
                  {conv.avatar}
                </div>
                {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#10B981' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{conv.name}</span>
                  <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>{conv.time}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {channelIcon[conv.channel]}
                  <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{conv.lastMessage}</span>
                  {conv.unread > 0 && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: 'var(--primary)', fontSize: 10 }}>
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--primary)' }}>
              {selected.avatar}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{selected.name}</p>
              <div className="flex items-center gap-1.5">
                {channelIcon[selected.channel]}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selected.channel} {selected.online ? '· Online' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Phone size={16} style={{ color: 'var(--text-secondary)' }} /></button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Video size={16} style={{ color: 'var(--text-secondary)' }} /></button>
            <button className="btn btn-primary text-xs py-1.5">+ Criar Lead</button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical size={16} style={{ color: 'var(--text-secondary)' }} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background: 'var(--surface-2)' }}>
          {DEMO_MESSAGES.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm"
                style={{
                  background: msg.direction === 'OUTBOUND' ? 'var(--primary)' : 'var(--surface)',
                  color: msg.direction === 'OUTBOUND' ? 'white' : 'var(--text-primary)',
                  borderRadius: msg.direction === 'OUTBOUND' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                <p>{msg.content}</p>
                <p className="text-xs mt-1 opacity-70 text-right">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-end gap-2 p-3 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"><Paperclip size={18} style={{ color: 'var(--text-muted)' }} /></button>
            <textarea
              className="flex-1 text-sm resize-none outline-none min-h-[36px] max-h-32"
              style={{ color: 'var(--text-primary)', background: 'transparent' }}
              placeholder="Escrever mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
            />
            <button className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"><Smile size={18} style={{ color: 'var(--text-muted)' }} /></button>
            <button onClick={sendMessage} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
              <Send size={16} className="text-white" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {['Templates', 'Nota interna', 'Ficheiro'].map((action) => (
              <button key={action} className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Info Panel */}
      <div className="w-72 flex flex-col flex-shrink-0" style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Informações do Contacto</h3>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-2" style={{ background: 'var(--primary)' }}>
              {selected.avatar}
            </div>
            <p className="font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{selected.name}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {channelIcon[selected.channel]}
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{selected.channel}</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Leads Activos', value: '2' },
              { label: 'Mensagens', value: '24' },
              { label: 'Último contacto', value: 'Hoje' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary w-full text-sm py-2">Ver Perfil Completo</button>
        </div>
      </div>
    </div>
  );
}
