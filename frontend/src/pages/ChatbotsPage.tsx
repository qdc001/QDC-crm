import { useState, useCallback } from 'react';
import { Plus, Bot, Play, Pause, Trash2, X, Save, Loader2, ZapOff } from 'lucide-react';
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Connection, Edge, Node, NodeProps, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import toast from 'react-hot-toast';

// ── Custom Nodes ──────────────────────────────────────
const nodeStyle = (color: string) => ({
  background: 'white', border: `2px solid ${color}`, borderRadius: 12,
  padding: '12px 16px', minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  fontSize: 13, fontFamily: 'Inter, sans-serif',
});

function TriggerNode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#6366F1')}>
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontWeight: 600, color: '#6366F1', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Trigger</span>
      </div>
      <p style={{ fontWeight: 500, color: '#0F172A' }}>{data.label}</p>
      {data.value && <p style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{data.value}</p>}
    </div>
  );
}

function MessageNode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#0EA5E9')}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>💬</span>
        <span style={{ fontWeight: 600, color: '#0EA5E9', fontSize: 12 }}>MENSAGEM</span>
      </div>
      <p style={{ color: '#0F172A', fontSize: 13 }}>{data.label}</p>
    </div>
  );
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div style={{ ...nodeStyle('#F59E0B'), position: 'relative' }}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%' }} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>🔀</span>
        <span style={{ fontWeight: 600, color: '#F59E0B', fontSize: 12 }}>CONDIÇÃO</span>
      </div>
      <p style={{ color: '#0F172A', fontSize: 13 }}>{data.label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ Sim</span>
        <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>✗ Não</span>
      </div>
    </div>
  );
}

function ActionNode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#10B981')}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>⚙️</span>
        <span style={{ fontWeight: 600, color: '#10B981', fontSize: 12 }}>ACÇÃO</span>
      </div>
      <p style={{ color: '#0F172A', fontSize: 13 }}>{data.label}</p>
    </div>
  );
}

function DelayNode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#8B5CF6')}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>⏱️</span>
        <span style={{ fontWeight: 600, color: '#8B5CF6', fontSize: 12 }}>ESPERAR</span>
      </div>
      <p style={{ color: '#0F172A', fontSize: 13 }}>{data.label || '1 hora'}</p>
    </div>
  );
}

function EndNode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#EF4444')}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 18 }}>🏁</span>
        <span style={{ fontWeight: 600, color: '#EF4444', fontSize: 12 }}>FIM</span>
      </div>
    </div>
  );
}

function AINode({ data }: NodeProps) {
  return (
    <div style={nodeStyle('#6366F1')}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2 mb-1">
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ fontWeight: 600, color: '#6366F1', fontSize: 12 }}>AGENTE IA</span>
      </div>
      <p style={{ color: '#0F172A', fontSize: 13 }}>{data.label || 'Responder com IA'}</p>
    </div>
  );
}

const nodeTypes = { trigger: TriggerNode, message: MessageNode, condition: ConditionNode, action: ActionNode, delay: DelayNode, end: EndNode, ai: AINode };

// ── Default nodes for new chatbot ────────────────────
const defaultNodes: Node[] = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Mensagem recebida', value: 'WhatsApp' } },
  { id: '2', type: 'message', position: { x: 300, y: 180 }, data: { label: 'Olá! Como posso ajudar? 😊' } },
  { id: '3', type: 'condition', position: { x: 300, y: 310 }, data: { label: 'Contém palavra-chave?' } },
  { id: '4', type: 'action', position: { x: 150, y: 440 }, data: { label: 'Criar lead no pipeline' } },
  { id: '5', type: 'ai', position: { x: 450, y: 440 }, data: { label: 'Responder com IA' } },
  { id: '6', type: 'delay', position: { x: 150, y: 560 }, data: { label: '24 horas' } },
  { id: '7', type: 'end', position: { x: 300, y: 680 }, data: { label: 'Fim do fluxo' } },
];

const defaultEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366F1' } },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'yes', label: 'Sim', style: { stroke: '#10B981' } },
  { id: 'e3-5', source: '3', target: '5', sourceHandle: 'no', label: 'Não', style: { stroke: '#EF4444' } },
  { id: 'e4-6', source: '4', target: '6', animated: true },
  { id: 'e5-7', source: '5', target: '7' },
  { id: 'e6-7', source: '6', target: '7' },
];

const NODE_PALETTE = [
  { type: 'message', label: 'Mensagem', icon: '💬', color: '#0EA5E9' },
  { type: 'condition', label: 'Condição', icon: '🔀', color: '#F59E0B' },
  { type: 'action', label: 'Acção', icon: '⚙️', color: '#10B981' },
  { type: 'delay', label: 'Esperar', icon: '⏱️', color: '#8B5CF6' },
  { type: 'ai', label: 'Agente IA', icon: '🤖', color: '#6366F1' },
  { type: 'end', label: 'Fim', icon: '🏁', color: '#EF4444' },
];

// ── Chatbot editor ────────────────────────────────────
function ChatbotEditor({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [name, setName] = useState('Novo Chatbot');
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), []);

  const addNode = (type: string, label: string) => {
    const id = Date.now().toString();
    const newNode: Node = {
      id, type,
      position: { x: 300, y: 200 + Math.random() * 100 },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Chatbot guardado!');
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--surface)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        <input className="font-bold text-base outline-none border-b-2 border-transparent focus:border-indigo-500 px-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-outline text-sm py-1.5 gap-1.5"><Play size={13} /> Testar</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm py-1.5 gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Node palette */}
        <div className="flex flex-col gap-2 p-3 overflow-y-auto" style={{ width: 160, borderRight: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ADICIONAR NÓ</p>
          {NODE_PALETTE.map((n) => (
            <button key={n.type} onClick={() => addNode(n.type, n.label)}
              className="flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors hover:bg-white"
              style={{ border: `1px solid ${n.color}30`, background: `${n.color}10` }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ color: n.color, fontWeight: 500 }}>{n.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
            <Background color="#E2E8F0" gap={20} />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const colors: Record<string, string> = { trigger: '#6366F1', message: '#0EA5E9', condition: '#F59E0B', action: '#10B981', delay: '#8B5CF6', end: '#EF4444', ai: '#6366F1' };
              return colors[n.type || ''] || '#94A3B8';
            }} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// ── Main List Page ────────────────────────────────────
const DEMO_BOTS = [
  { id: '1', name: 'Qualificação de Leads', isActive: true, trigger: 'Mensagem recebida', nodes: 8, leads: 142 },
  { id: '2', name: 'Follow-up Automático', isActive: true, trigger: 'Lead sem resposta 24h', nodes: 5, leads: 67 },
  { id: '3', name: 'Suporte Pós-Venda', isActive: false, trigger: 'Lead marcado como Ganho', nodes: 6, leads: 0 },
];

export default function ChatbotsPage() {
  const [editing, setEditing] = useState(false);
  const [bots, setBots] = useState(DEMO_BOTS);

  if (editing) return <ChatbotEditor onClose={() => setEditing(false)} />;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Chatbots</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Cria fluxos de conversação automáticos sem código</p>
        </div>
        <button onClick={() => setEditing(true)} className="btn btn-primary gap-2"><Plus size={16} /> Novo Chatbot</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map((bot) => (
          <div key={bot.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bot.isActive ? '#EEF2FF' : 'var(--surface-3)' }}>
                <Bot size={20} style={{ color: bot.isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
              </div>
              <button onClick={() => setBots((p) => p.map((b) => b.id === bot.id ? { ...b, isActive: !b.isActive } : b))}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: bot.isActive ? '#ECFDF5' : 'var(--surface-3)', color: bot.isActive ? '#10B981' : 'var(--text-muted)' }}>
                {bot.isActive ? <Play size={11} /> : <ZapOff size={11} />}
                {bot.isActive ? 'Activo' : 'Inactivo'}
              </button>
            </div>
            <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{bot.name}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Trigger: {bot.trigger}</p>
            <div className="flex items-center gap-4 text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              <span>{bot.nodes} nós</span>
              <span>{bot.leads} leads processados</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn btn-outline flex-1 text-xs py-1.5">Editar fluxo</button>
              <button onClick={() => setBots((p) => p.filter((b) => b.id !== bot.id))} className="btn text-xs py-1.5 px-2.5" style={{ color: '#EF4444', border: '1px solid #FEE2E2', background: 'transparent' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty add card */}
        <button onClick={() => setEditing(true)} className="card p-5 flex flex-col items-center justify-center gap-3 border-dashed hover:border-indigo-300 transition-colors" style={{ minHeight: 200 }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-3)' }}>
            <Plus size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Criar novo chatbot</p>
        </button>
      </div>
    </div>
  );
}
