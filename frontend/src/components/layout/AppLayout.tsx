import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, GitBranch, Users, MessageSquare, CheckSquare,
  Zap, Bot, BarChart3, FileText, Plug, Settings, LogOut,
  Bell, Search, ChevronDown, Menu, X, UserPlus, Radio
} from 'lucide-react';
import { useAuthStore } from '../../store';
import CopilotPanel from '../ai/CopilotPanel';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/contacts', icon: UserPlus, label: 'Contactos' },
  { path: '/inbox', icon: MessageSquare, label: 'Caixa de Entrada' },
  { path: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { path: '/automations', icon: Zap, label: 'Automatizações' },
  { path: '/broadcasts', icon: Radio, label: 'Broadcasts' },
  { path: '/chatbots', icon: Bot, label: 'Chatbots' },
  { path: '/analytics', icon: BarChart3, label: 'Análises' },
  { path: '/templates', icon: FileText, label: 'Templates' },
  { path: '/integrations', icon: Plug, label: 'Integrações' },
  { path: '/team', icon: Users, label: 'Equipa' },
];

export default function AppLayout() {
  const { user, workspace, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Sessão terminada');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? 240 : 64,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 mb-2" style={{ minHeight: 64 }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--primary)' }}>
            {workspace?.name?.[0]?.toUpperCase() || 'K'}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-white truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {workspace?.name || 'KommoCRM'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>CRM Platform</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded-md transition-colors flex-shrink-0"
            style={{ color: 'var(--sidebar-text)' }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {navItems.map(({ path, icon: Icon, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#fff' : undefined,
              })}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" style={{ color: 'inherit' }} />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`
            }
            title={!sidebarOpen ? 'Definições' : undefined}
          >
            <Settings size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Definições</span>}
          </NavLink>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors">
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 flex-shrink-0" style={{ height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <Search size={14} />
            <span>Pesquisar leads, contactos...</span>
            <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Copilot */}
            <button onClick={() => setCopilotOpen(!copilotOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: copilotOpen ? 'var(--primary)' : 'var(--surface-3)', color: copilotOpen ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14 }}>✨</span> Copilot
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg transition-colors hover:bg-gray-100">
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--primary)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Copilot Panel */}
      {copilotOpen && (
        <div className="animate-slide-right" style={{ position: 'fixed', right: 0, top: 64, bottom: 0, width: 360, background: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 40, boxShadow: 'var(--shadow-lg)' }}>
          <CopilotPanel onClose={() => setCopilotOpen(false)} />
        </div>
      )}

      {/* Search Modal */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)}>
          <div className="modal-content p-0" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
              <input autoFocus className="flex-1 text-sm outline-none" style={{ color: 'var(--text-primary)' }} placeholder="Pesquisar leads, contactos, tarefas..." />
              <kbd onClick={() => setSearchOpen(false)} className="text-xs px-2 py-1 rounded cursor-pointer" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>Esc</kbd>
            </div>
            <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Começa a escrever para pesquisar...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
