import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';

const modules = [
  { icon: '🧪', title: 'Test Orders', desc: 'View and manage incoming lab test requests from doctors.' },
  { icon: '📋', title: 'Results Entry', desc: 'Record and submit patient test results securely.' },
  { icon: '📊', title: 'Lab Reports', desc: 'Generate and review diagnostic reports.' },
];

export default function LabDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardPage title="Lab Dashboard" subtitle={`Welcome, ${user?.name || 'Lab Staff'}. Lab management features are coming soon.`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-rose-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-rose-700">Lab Features — In Development</h2>
          <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-600">
            Coming soon
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {modules.map(({ icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-5 hover:border-green-200 hover:bg-green-50 transition">
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-xs text-green-700">
              You're logged in as <span className="font-semibold">{user?.name}</span> (Lab Staff). Contact your system administrator to enable additional modules.
            </p>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
