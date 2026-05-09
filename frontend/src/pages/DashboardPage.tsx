import { useEffect, useState } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, CheckSquare, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api, { DashboardData, RevenueData } from '../lib/api';
import { useAuthStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statCards = (data: DashboardData) => [
  {
    label: 'Leads Criados', value: data.monthly.leadsCreated, growth: data.monthly.leadsCreatedGrowth,
    icon: Users, color: '#6366F1', bg: '#EEF2FF',
  },
  {
    label: 'Negócios Ganhos', value: data.monthly.leadsWon, growth: data.monthly.leadsWonGrowth,
    icon: Target, color: '#10B981', bg: '#ECFDF5',
  },
  {
    label: 'Receita (mês)', value: `MZN ${(data.monthly.revenue / 1000).toFixed(1)}k`, growth: data.monthly.revenueGrowth,
    icon: DollarSign, color: '#0EA5E9', bg: '#F0F9FF', isString: true,
  },
  {
    label: 'Tarefas em Atraso', value: data.overview.tasksDue, growth: 0,
    icon: CheckSquare, color: '#F59E0B', bg: '#FFFBEB',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, r] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/revenue'),
        ]);
        setDashboard(d.data);
        setRevenue(r.data);
      } catch (e) {
        // Demo data when no backend
        setDashboard({
          overview: { totalLeads: 248, openLeads: 142, wonLeads: 86, lostLeads: 20, totalContacts: 195, conversionRate: 35, tasksDue: 7 },
          monthly: { leadsCreated: 34, leadsCreatedGrowth: 12, leadsWon: 18, leadsWonGrowth: 8, revenue: 425000, revenueGrowth: 22 },
          pipeline: [
            { id: '1', name: 'Novo Lead', color: '#6B7280', count: 28 },
            { id: '2', name: 'Em Contacto', color: '#3B82F6', count: 45 },
            { id: '3', name: 'Proposta', color: '#8B5CF6', count: 31 },
            { id: '4', name: 'Negociação', color: '#F59E0B', count: 18 },
            { id: '5', name: 'Ganho', color: '#10B981', count: 86 },
          ],
          recentActivities: [],
        });
        setRevenue([
          { month: 'Dez', revenue: 280000, deals: 12 },
          { month: 'Jan', revenue: 320000, deals: 15 },
          { month: 'Fev', revenue: 290000, deals: 13 },
          { month: 'Mar', revenue: 380000, deals: 17 },
          { month: 'Abr', revenue: 410000, deals: 19 },
          { month: 'Mai', revenue: 425000, deals: 18 },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!dashboard) return null;

  const cards = statCards(dashboard);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Bom dia, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Aqui está o resumo do seu negócio este mês
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.growth >= 0;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                {card.growth !== 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{ background: isPositive ? '#ECFDF5' : '#FEF2F2', color: isPositive ? '#10B981' : '#EF4444' }}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(card.growth)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text-primary)' }}>
                {card.isString ? card.value : card.value.toLocaleString()}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`MZN ${Number(v).toLocaleString()}`, 'Receita']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline distribution */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Distribuição no Pipeline</h3>
          <div className="space-y-3">
            {dashboard.pipeline.slice(0, 5).map((stage) => {
              const total = dashboard.pipeline.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0;
              return (
                <div key={stage.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{stage.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Leads', value: dashboard.overview.totalLeads, color: '#6366F1' },
          { label: 'Leads Abertos', value: dashboard.overview.openLeads, color: '#0EA5E9' },
          { label: 'Leads Ganhos', value: dashboard.overview.wonLeads, color: '#10B981' },
          { label: 'Leads Perdidos', value: dashboard.overview.lostLeads, color: '#EF4444' },
          { label: 'Contactos', value: dashboard.overview.totalContacts, color: '#8B5CF6' },
          { label: 'Conversão', value: `${dashboard.overview.conversionRate}%`, color: '#F59E0B', isString: true },
        ].map((item) => (
          <div key={item.label} className="card p-4 text-center">
            <p className="text-xl font-bold" style={{ color: item.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {item.isString ? item.value : item.value.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
