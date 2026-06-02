import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-sm font-black text-slate-950">M</div>
            <div>
              <p className="text-sm font-semibold text-white">MediCare</p>
              <p className="text-xs text-slate-400">Hospital platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#who-it-serves" className="transition hover:text-white">For who</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-300">
              Login
            </Link>
            <Link to="/register" className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
              Secure care for patients, doctors, and admins
            </p>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Care, appointments, and records in one place.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Book visits, manage patient profiles, and keep hospital teams aligned with a secure role-based dashboard.
            </p>

            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {[
                ['24/7 access', 'Login anytime from any device.'],
                ['Role-based', 'Patients, staff, and admins stay separated.'],
                ['Fast booking', 'Make and track appointments quickly.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Create account
              </Link>
              <Link to="/login" className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-300">
                Sign in
              </Link>
            </div>

            <div id="features" className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Patients', 'Update profiles and book appointments.'],
                ['Doctors', 'Track schedules and patient visits.'],
                ['Admins', 'Manage users and monitor the system.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['1 portal', 'Patients and staff use one system.'],
                ['3 roles', 'Patient, doctor, and admin access.'],
                ['Quick onboarding', 'Register, login, and get started fast.'],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <p className="text-2xl font-bold text-cyan-300">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-cyan-950/20">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Welcome</p>
              <h2 className="mt-4 text-2xl font-bold text-white">Start with your secure login</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Existing users can sign in to continue to their dashboard. New patients can register in seconds.
              </p>
            </div>

            <div id="who-it-serves" className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">Protected patient, doctor, and admin areas</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">Appointment and profile management</div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">Role-based access across the app</div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Trusted workflow</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Built for real hospital operations</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              The platform keeps patient data, appointments, and admin controls in one secure flow so your team can move faster with less confusion.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                'Clean handoff from registration to appointment booking',
                'Dedicated dashboards for each hospital role',
                'Safer access with protected routes and role checks',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-500/10 to-slate-900 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Why users like it</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Patients', 'Everything is easy to find and book.'],
                ['Doctors', 'Schedules stay organized without extra tools.'],
                ['Admins', 'User management and oversight stay simple.'],
                ['Reception', 'Appointment handling is straightforward.'],
              ].map(([role, text]) => (
                <div key={role} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                  <p className="text-sm font-semibold text-white">{role}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-slate-800/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MediCare. Built for secure hospital operations.</p>
          <p>Need access? Use the login link or create a patient account.</p>
        </div>
      </footer>
    </div>
  );
}