import { useAuth } from '../context/AuthContext';

export default function DashboardPage({ title, subtitle, children }) {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">MediCare</p>
            <h1 className="mt-2 text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-slate-400">{subtitle}</p>
          </div>
          <button onClick={logout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Logout
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:col-span-2">
            <h2 className="text-lg font-semibold">Welcome</h2>
            <p className="mt-2 text-slate-400">
              Signed in as <span className="text-slate-100">{user?.name}</span> with role <span className="text-cyan-400">{user?.role}</span>.
            </p>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold">Quick Info</h2>
            <p className="mt-2 text-sm text-slate-400">This dashboard is ready for role-specific features.</p>
          </section>
          </div>

          <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
