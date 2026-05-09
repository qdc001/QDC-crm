import { Construction } from 'lucide-react';
export default function LeadsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
      <div className="card p-12 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light, #EEF2FF)' }}>
          <Construction size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Leads</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Módulo em desenvolvimento activo. O backend está implementado com todos os endpoints.<br/>
          O frontend será desenvolvido na próxima fase.
        </p>
      </div>
    </div>
  );
}
