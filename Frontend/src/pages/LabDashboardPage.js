import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';

const comingSoon = [
  { icon: '🧪', title: 'Test Orders', desc: 'View and manage incoming lab test requests from doctors.' },
  { icon: '📋', title: 'Results Entry', desc: 'Record and submit patient test results securely.' },
  { icon: '📊', title: 'Lab Reports', desc: 'Generate and review diagnostic reports.' },
];

export default function LabDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardPage
      title="Lab Dashboard"
      subtitle={`Welcome, ${user?.name || 'Lab Staff'}. Lab management features are coming soon.`}
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
              Coming soon
            </span>
          </div>
          <h2 className="text-sm font-semibold text-white mt-1">Lab Features in Development</h2>
          <p className="text-xs text-slate-400 mt-1">The following modules are currently being built and will be available soon.</p>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {comingSoon.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3">
            <p className="text-xs text-rose-300">
              You are logged in as lab staff. Contact your system administrator to enable additional features for this account.
            </p>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
