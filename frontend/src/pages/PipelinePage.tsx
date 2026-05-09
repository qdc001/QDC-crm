import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Phone, Mail, Calendar, User, ChevronDown, Filter, Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import api, { Pipeline, Stage, Lead } from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ==================== LEAD CARD ====================
function LeadCard({ lead, isDragging = false }: { lead: Lead; isDragging?: boolean }) {
  const priorityColors: Record<string, string> = {
    LOW: '#10B981', MEDIUM: '#F59E0B', HIGH: '#EF4444', URGENT: '#7C3AED',
  };

  return (
    <div
      className="lead-card card p-3 space-y-2"
      style={{ opacity: isDragging ? 0.5 : 1, background: 'white', border: '1px solid var(--border)' }}
    >
      {/* Title & Priority */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{lead.title}</p>
          {lead.contact && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {lead.contact.firstName} {lead.contact.lastName || ''}
            </p>
          )}
        </div>
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: priorityColors[lead.priority] || '#6B7280' }} title={lead.priority} />
      </div>

      {/* Value */}
      {lead.value && (
        <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
          MZN {lead.value.toLocaleString()}
        </p>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map(({ tag }) => (
            <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: tag.color + '20', color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          {lead._count?.messages ? (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Mail size={11} /> {lead._count.messages}
            </span>
          ) : null}
          {lead.tasks?.length ? (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Phone size={11} /> {lead.tasks.length}
            </span>
          ) : null}
        </div>
        {lead.assignedTo ? (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--primary)', fontSize: 10 }}>
            {lead.assignedTo.name[0].toUpperCase()}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ==================== SORTABLE CARD ====================
function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

// ==================== STAGE COLUMN ====================
function StageColumn({ stage, leads, onAddLead, onLeadClick }: {
  stage: Stage;
  leads: Lead[];
  onAddLead: (stageId: string) => void;
  onLeadClick: (lead: Lead) => void;
}) {
  const total = leads.reduce((a, l) => a + (l.value || 0), 0);

  return (
    <div className="kanban-column flex flex-col" style={{ minWidth: 280, maxWidth: 280 }}>
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3 mb-2 rounded-xl" style={{ background: 'var(--surface)' }}>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: stage.color }} />
        <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {stage.name}
        </span>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
          {leads.length}
        </span>
        <button onClick={() => onAddLead(stage.id)} className="p-0.5 rounded hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Plus size={14} />
        </button>
      </div>

      {total > 0 && (
        <p className="text-xs font-medium px-1 mb-2" style={{ color: 'var(--text-secondary)' }}>
          MZN {total.toLocaleString()}
        </p>
      )}

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto pb-2" style={{ minHeight: 100 }}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem leads aqui</p>
            <button onClick={() => onAddLead(stage.id)} className="text-xs mt-1" style={{ color: 'var(--primary)' }}>+ Adicionar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NEW LEAD MODAL ====================
function NewLeadModal({ stageId, pipeline, onClose, onCreated }: {
  stageId: string;
  pipeline: Pipeline;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({ title: '', value: '', stageId, source: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/leads', { ...form, pipelineId: pipeline.id });
      onCreated(data);
      toast.success('Lead criado!');
      onClose();
    } catch { toast.error('Erro ao criar lead'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-6" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Novo Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Título do Lead *</label>
            <input className="input-base" placeholder="Ex: Proposta de Software" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Valor (MZN)</label>
              <input className="input-base" type="number" placeholder="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Etapa</label>
              <select className="input-base" value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}>
                {pipeline.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Fonte</label>
            <select className="input-base" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="">Seleccionar...</option>
              {['WhatsApp', 'Email', 'Instagram', 'Facebook', 'Site Web', 'Referência', 'Outro'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Criar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newLeadStage, setNewLeadStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/pipelines');
        setPipelines(data);
        const defaultPipeline = data.find((p: Pipeline) => p.isDefault) || data[0];
        if (defaultPipeline) {
          setActivePipeline(defaultPipeline);
          const leadsRes = await api.get(`/leads?pipelineId=${defaultPipeline.id}&limit=200`);
          setLeads(leadsRes.data.leads);
        }
      } catch {
        // Demo data
        const demoPipeline: Pipeline = {
          id: 'demo', name: 'Pipeline Principal', color: '#6366F1', isDefault: true,
          stages: [
            { id: 's1', name: 'Novo Lead', color: '#6B7280', position: 0, type: 'REGULAR', pipelineId: 'demo' },
            { id: 's2', name: 'Em Contacto', color: '#3B82F6', position: 1, type: 'REGULAR', pipelineId: 'demo' },
            { id: 's3', name: 'Proposta Enviada', color: '#8B5CF6', position: 2, type: 'REGULAR', pipelineId: 'demo' },
            { id: 's4', name: 'Negociação', color: '#F59E0B', position: 3, type: 'REGULAR', pipelineId: 'demo' },
            { id: 's5', name: 'Ganho', color: '#10B981', position: 4, type: 'WON', pipelineId: 'demo' },
            { id: 's6', name: 'Perdido', color: '#EF4444', position: 5, type: 'LOST', pipelineId: 'demo' },
          ],
        };
        setPipelines([demoPipeline]);
        setActivePipeline(demoPipeline);
        setLeads([
          { id: 'l1', title: 'Projecto Website BT', value: 85000, status: 'OPEN', priority: 'HIGH', currency: 'MZN', source: 'WhatsApp', stageId: 's1', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[0], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 3, notes: 1, files: 0 } },
          { id: 'l2', title: 'Sistema de Gestão SARL', value: 150000, status: 'OPEN', priority: 'URGENT', currency: 'MZN', source: 'Email', stageId: 's2', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[1], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 8, notes: 2, files: 1 } },
          { id: 'l3', title: 'App Mobile Restaurante', value: 65000, status: 'OPEN', priority: 'MEDIUM', currency: 'MZN', source: 'Instagram', stageId: 's2', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[1], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 4, notes: 0, files: 0 } },
          { id: 'l4', title: 'ERP Empresa Construção', value: 320000, status: 'OPEN', priority: 'HIGH', currency: 'MZN', source: 'Referência', stageId: 's3', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[2], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 12, notes: 3, files: 2 } },
          { id: 'l5', title: 'Plataforma E-commerce', value: 95000, status: 'OPEN', priority: 'MEDIUM', currency: 'MZN', source: 'Site Web', stageId: 's4', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[3], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 6, notes: 1, files: 0 } },
          { id: 'l6', title: 'CRM Agência Imobiliária', value: 180000, status: 'WON', priority: 'LOW', currency: 'MZN', source: 'WhatsApp', stageId: 's5', pipelineId: 'demo', workspaceId: 'ws', stage: demoPipeline.stages[4], pipeline: demoPipeline, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { messages: 15, notes: 4, files: 3 } },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const getStageLeads = (stageId: string) => {
    return leads.filter((l) => l.stageId === stageId && (
      !search || l.title.toLowerCase().includes(search.toLowerCase())
    ));
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Find which stage the drop happened in
    const targetLead = leads.find((l) => l.id === overId);
    const targetStageId = targetLead?.stageId || overId;

    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead || currentLead.stageId === targetStageId) return;

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stageId: targetStageId } : l));

    try {
      await api.patch(`/leads/${leadId}/move`, { stageId: targetStageId, pipelineId: activePipeline?.id });
    } catch {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stageId: currentLead.stageId } : l));
      toast.error('Erro ao mover lead');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pipeline</h1>
          {/* Pipeline selector */}
          <div className="flex items-center gap-1">
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePipeline(p)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                style={{
                  background: activePipeline?.id === p.id ? 'var(--primary)' : 'var(--surface-3)',
                  color: activePipeline?.id === p.id ? 'white' : 'var(--text-secondary)',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-base pl-8 pr-3 py-1.5 text-sm"
              style={{ width: 200 }}
              placeholder="Filtrar leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline text-sm py-1.5">
            <Filter size={14} /> Filtros
          </button>
          <button onClick={() => setNewLeadStage(activePipeline?.stages[0]?.id || null)} className="btn btn-primary text-sm py-1.5">
            <Plus size={14} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: 'max-content' }}>
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {activePipeline?.stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={getStageLeads(stage.id)}
                onAddLead={setNewLeadStage}
                onLeadClick={setSelectedLead}
              />
            ))}
            <DragOverlay>
              {activeLead ? <LeadCard lead={activeLead} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* New Lead Modal */}
      {newLeadStage && activePipeline && (
        <NewLeadModal
          stageId={newLeadStage}
          pipeline={activePipeline}
          onClose={() => setNewLeadStage(null)}
          onCreated={(lead) => setLeads((prev) => [lead, ...prev])}
        />
      )}
    </div>
  );
}
