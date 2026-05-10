import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, Loader2, Trash2, Edit3, Check, Calendar as CalIcon,
  List as ListIcon, RotateCcw, AlertCircle, ExternalLink,
  Phone, Mail, Users as UsersIcon, Repeat, Briefcase, Circle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api, { Task, User, Lead } from '../lib/api';
import toast from 'react-hot-toast';
import { useUIStore } from '../store';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluida',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E' },
  IN_PROGRESS: { bg: '#DBEAFE', fg: '#1E40AF' },
  COMPLETED: { bg: '#D1FAE5', fg: '#065F46' },
  CANCELLED: { bg: '#F3F4F6', fg: '#374151' },
};

const TYPE_LABELS: Record<string, string> = {
  CALL: 'Chamada',
  EMAIL: 'Email',
  MEETING: 'Reuniao',
  FOLLOW_UP: 'Follow-up',
  DEMO: 'Demo',
  OTHER: 'Outro',
};

const TYPE_ICONS: Record<string, any> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: UsersIcon,
  FOLLOW_UP: Repeat,
  DEMO: Briefcase,
  OTHER: Circle,
};

function isOverdue(task: Task): boolean {
  if (!task.dueAt) return false;
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

// =============== Modal: Nova/Editar Tarefa ===============
function TaskFormModal({
  task,
  users,
  leads,
  onClose,
  onSaved,
  initialDate,
}: {
  task?: Task | null;
  users: User[];
  leads: Lead[];
  onClose: () => void;
  onSaved: (t: Task) => void;
  initialDate?: string;
}) {
  const isEdit = !!task?.id;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [type, setType] = useState(task?.type || 'CALL');
  const [status, setStatus] = useState(task?.status || 'PENDING');
  const [dueAt, setDueAt] = useState(
    task?.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16)
      : initialDate ? `${initialDate}T09:00` : ''
  );
  const [assignedToId, setAssignedToId] = useState(task?.assignedTo?.id || '');
  const [leadId, setLeadId] = useState((task as any)?.leadId || (task?.lead as any)?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Titulo obrigatorio'); return; }
    setLoading(true);
    try {
      const payload: any = {
        title, description, type, status,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        assignedToId: assignedToId || undefined,
        leadId: leadId || null,
      };
      let saved: Task;
      if (isEdit) {
        const { data } = await api.patch(`/tasks/${task!.id}`, payload);
        saved = data; toast.success('Tarefa actualizada');
      } else {
        const { data } = await api.post('/tasks', payload);
        saved = data; toast.success('Tarefa criada');
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro a guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h3>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Titulo *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" required autoFocus placeholder="Ex: Ligar ao cliente" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Descricao</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="input-base">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="input-base">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Data e hora limite</label>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="input-base" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Responsavel</label>
            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="input-base">
              <option value="">— Eu —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Lead associado</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="input-base">
              <option value="">— Nenhum —</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn flex-1 py-2" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : isEdit ? 'Guardar' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============== Vista Calendario (mes) ===============
function CalendarView({
  tasks,
  monthDate,
  onPrev,
  onNext,
  onToday,
  onCreateAt,
  onEdit,
}: {
  tasks: Task[];
  monthDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateAt: (date: string) => void;
  onEdit: (t: Task) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Segunda = 0
  const days: Array<{ date: Date; current: boolean }> = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), current: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  while (days.length % 7 !== 0 || days.length < 35) {
    const last = days[days.length - 1].date;
    days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), current: false });
    if (days.length >= 42) break;
  }

  const tasksByDay: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (!t.dueAt) return;
    const k = new Date(t.dueAt).toISOString().slice(0, 10);
    (tasksByDay[k] = tasksByDay[k] || []).push(t);
  });

  const today = new Date().toISOString().slice(0, 10);
  const monthName = monthDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onPrev} className="p-2 rounded hover:bg-slate-100"><ChevronLeft size={16} /></button>
        <button onClick={onToday} className="btn py-1 px-2 text-xs" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>Hoje</button>
        <button onClick={onNext} className="p-2 rounded hover:bg-slate-100"><ChevronRight size={16} /></button>
        <h2 className="text-lg font-bold ml-2 capitalize" style={{ color: 'var(--text-primary)' }}>{monthName}</h2>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {weekDays.map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1" style={{ minHeight: 500 }}>
        {days.map((d, i) => {
          const k = d.date.toISOString().slice(0, 10);
          const isToday = k === today;
          const dayTasks = tasksByDay[k] || [];
          return (
            <div
              key={i}
              className="rounded p-1 flex flex-col gap-1 overflow-hidden group"
              style={{
                background: d.current ? 'var(--surface)' : 'var(--surface-2)',
                border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                opacity: d.current ? 1 : 0.5,
                minHeight: 90,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  {d.date.getDate()}
                </span>
                {d.current && (
                  <button onClick={() => onCreateAt(k)} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Adicionar tarefa">
                    <Plus size={11} style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: 80 }}>
                {dayTasks.slice(0, 4).map((t) => {
                  const overdue = isOverdue(t);
                  const done = t.status === 'COMPLETED';
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t)}
                      className="text-left text-[10px] px-1 py-0.5 rounded hover:opacity-80"
                      style={{
                        background: done ? '#D1FAE5' : overdue ? '#FEE2E2' : 'var(--primary-light)',
                        color: done ? '#065F46' : overdue ? '#991B1B' : 'var(--primary)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                      title={t.title}
                    >
                      <span className="block truncate">{t.title}</span>
                    </button>
                  );
                })}
                {dayTasks.length > 4 && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{dayTasks.length - 4} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============== Pagina principal ===============
export default function TasksPage() {
  const navigate = useNavigate();
  const { globalSearchQuery, setGlobalSearchQuery } = useUIStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(globalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [view, setView] = useState<'list' | 'calendar'>(() => (localStorage.getItem('kommo:tasks-view') as any) || 'list');
  const [monthDate, setMonthDate] = useState(new Date());

  const [adding, setAdding] = useState(false);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => { localStorage.setItem('kommo:tasks-view', view); }, [view]);
  useEffect(() => setSearch(globalSearchQuery || ''), [globalSearchQuery]);

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/leads?limit=500').then(({ data }) => setLeads(data.leads || [])).catch(() => {});
  }, []);

  const loadTasks = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (assigneeFilter) params.set('assignedToId', assigneeFilter);
    setLoading(true);
    api.get(`/tasks?${params.toString()}`)
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Erro a carregar tarefas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter, assigneeFilter]);

  const handleToggleComplete = async (t: Task) => {
    try {
      const newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const { data } = await api.patch(`/tasks/${t.id}`, { status: newStatus });
      setTasks((prev) => prev.map((x) => (x.id === t.id ? data : x)));
    } catch { toast.error('Erro'); }
  };

  const handleDelete = async (t: Task) => {
    if (!confirm(`Eliminar a tarefa "${t.title}"?`)) return;
    try {
      await api.delete(`/tasks/${t.id}`);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
      toast.success('Eliminada');
    } catch { toast.error('Erro a eliminar'); }
  };

  const resetFilters = () => {
    setSearch(''); setGlobalSearchQuery('');
    setStatusFilter(''); setTypeFilter(''); setAssigneeFilter('');
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    return { total, pending, overdue, completed };
  }, [tasks]);

  const hasFilters = !!(search || statusFilter || typeFilter || assigneeFilter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Tarefas</h1>
        <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>{stats.total} total</span>
        {stats.overdue > 0 && (
          <span className="text-xs px-2 py-1 rounded font-medium flex items-center gap-1" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            <AlertCircle size={12} /> {stats.overdue} atrasada{stats.overdue !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>{stats.pending} pendentes</span>
        <span className="text-xs px-2 py-1 rounded" style={{ background: '#D1FAE5', color: '#065F46' }}>{stats.completed} concluidas</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button onClick={() => setView('list')} className="px-3 py-1.5 text-xs flex items-center gap-1"
              style={{ background: view === 'list' ? 'var(--primary)' : 'var(--surface)', color: view === 'list' ? '#fff' : 'var(--text-primary)' }}>
              <ListIcon size={12} /> Lista
            </button>
            <button onClick={() => setView('calendar')} className="px-3 py-1.5 text-xs flex items-center gap-1"
              style={{ background: view === 'calendar' ? 'var(--primary)' : 'var(--surface)', color: view === 'calendar' ? '#fff' : 'var(--text-primary)' }}>
              <CalIcon size={12} /> Calendario
            </button>
          </div>
          <button onClick={() => { setInitialDate(undefined); setAdding(true); }} className="btn btn-primary py-2 px-3">
            <Plus size={14} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filtros (so na vista lista) */}
      {view === 'list' && (
        <div className="p-3 flex flex-wrap items-center gap-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="relative" style={{ minWidth: 220, flex: '1 1 220px' }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por titulo..." className="input-base" style={{ paddingLeft: 32 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: 140 }}>
            <option value="">Todos estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: 130 }}>
            <option value="">Todos tipos</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="input-base" style={{ width: 'auto', minWidth: 140 }}>
            <option value="">Todos responsaveis</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {hasFilters && (
            <button onClick={resetFilters} className="btn py-2 px-3" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
              <RotateCcw size={14} /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Conteudo */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} /></div>
        ) : view === 'calendar' ? (
          <CalendarView
            tasks={tasks}
            monthDate={monthDate}
            onPrev={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            onNext={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            onToday={() => setMonthDate(new Date())}
            onCreateAt={(date) => { setInitialDate(date); setAdding(true); }}
            onEdit={(t) => setEditing(t)}
          />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <CalIcon size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{hasFilters ? 'Nenhuma tarefa corresponde aos filtros' : 'Sem tarefas ainda'}</p>
            {!hasFilters && (
              <button onClick={() => setAdding(true)} className="btn btn-primary mt-3 py-2 px-4">
                <Plus size={14} /> Criar primeira tarefa
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--surface-2)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="w-8 px-3 py-2"></th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Titulo</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Tipo</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Data limite</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Responsavel</th>
                <th className="text-left px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Lead</th>
                <th className="text-right px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Accoes</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const overdue = isOverdue(t);
                const done = t.status === 'COMPLETED';
                const Icon = TYPE_ICONS[t.type] || Circle;
                return (
                  <tr key={t.id} className="hover:bg-slate-50" style={{ borderBottom: '1px solid var(--border)', background: overdue ? '#FEF2F2' : undefined }}>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleToggleComplete(t)}
                        className="w-5 h-5 rounded border flex items-center justify-center"
                        style={{
                          background: done ? '#10B981' : 'transparent',
                          borderColor: done ? '#10B981' : 'var(--border)',
                        }}
                        title={done ? 'Marcar como pendente' : 'Marcar como concluida'}
                      >
                        {done && <Check size={12} style={{ color: '#fff' }} />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => setEditing(t)} className="text-left hover:underline">
                        <span style={{ color: 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>
                          {t.title}
                        </span>
                      </button>
                      {overdue && !done && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                          Atrasada
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Icon size={12} /> {TYPE_LABELS[t.type]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.fg }}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: overdue && !done ? '#991B1B' : 'var(--text-secondary)' }}>
                      {t.dueAt ? new Date(t.dueAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                      {t.assignedTo?.name || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {t.lead ? (
                        <button onClick={() => navigate(`/pipeline?leadId=${t.lead!.id}`)} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                          {t.lead.title} <ExternalLink size={11} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditing(t)} className="p-1.5 rounded hover:bg-slate-100" title="Editar"><Edit3 size={14} style={{ color: 'var(--text-secondary)' }} /></button>
                        <button onClick={() => handleDelete(t)} className="p-1.5 rounded hover:bg-red-50" title="Eliminar"><Trash2 size={14} style={{ color: '#EF4444' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {adding && (
        <TaskFormModal
          users={users}
          leads={leads}
          initialDate={initialDate}
          onClose={() => { setAdding(false); setInitialDate(undefined); }}
          onSaved={(t) => setTasks((prev) => [...prev, t])}
        />
      )}
      {editing && (
        <TaskFormModal
          task={editing}
          users={users}
          leads={leads}
          onClose={() => setEditing(null)}
          onSaved={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
        />
      )}
    </div>
  );
}
