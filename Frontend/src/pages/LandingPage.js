import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';
import Logo from '../components/Logo';

/* Inline SVG illustration — doctor & patient scene */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
      {/* Background blob */}
      <ellipse cx="260" cy="200" rx="180" ry="150" fill="#bbf7d0" opacity="0.5" />
      {/* Bed frame */}
      <rect x="80" y="230" width="300" height="18" rx="4" fill="#166534" />
      <rect x="100" y="210" width="240" height="28" rx="6" fill="#16a34a" />
      {/* Pillow */}
      <rect x="290" y="195" width="60" height="22" rx="8" fill="white" stroke="#86efac" strokeWidth="1.5" />
      {/* Patient */}
      <ellipse cx="320" cy="192" rx="14" ry="14" fill="#fde68a" />
      <rect x="200" y="208" width="140" height="8" rx="3" fill="#bbf7d0" />
      {/* IV Stand */}
      <rect x="370" y="140" width="4" height="100" rx="2" fill="#374151" />
      <rect x="358" y="138" width="28" height="4" rx="2" fill="#374151" />
      <ellipse cx="372" cy="155" rx="10" ry="14" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" />
      <line x1="372" y1="169" x2="372" y2="210" stroke="#16a34a" strokeWidth="1" strokeDasharray="3 2" />
      {/* Doctor */}
      <ellipse cx="200" cy="178" rx="16" ry="16" fill="#fde68a" />
      <rect x="183" y="193" width="34" height="48" rx="10" fill="#16a34a" />
      {/* clipboard */}
      <rect x="215" y="205" width="22" height="28" rx="3" fill="white" stroke="#86efac" strokeWidth="1.5" />
      <line x1="219" y1="212" x2="233" y2="212" stroke="#86efac" strokeWidth="1.5" />
      <line x1="219" y1="218" x2="233" y2="218" stroke="#86efac" strokeWidth="1.5" />
      <line x1="219" y1="224" x2="228" y2="224" stroke="#86efac" strokeWidth="1.5" />
      {/* stethoscope on doctor */}
      <path d="M192 205 Q186 218 195 225" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Plant */}
      <rect x="90" y="230" width="8" height="30" rx="2" fill="#166534" />
      <ellipse cx="94" cy="222" rx="14" ry="16" fill="#22c55e" opacity="0.7" />
      <ellipse cx="82" cy="228" rx="10" ry="12" fill="#16a34a" opacity="0.6" />
    </svg>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-3 border-green-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to={getRoleHome(user.role)} replace />;

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-bold text-gray-800">MediCare</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-green-600 transition">Features</a>
            <a href="#roles" className="hover:text-green-600 transition">For who</a>
            <a href="#contact" className="hover:text-green-600 transition">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 rounded-lg border border-gray-200 hover:border-green-400 hover:text-green-600 transition">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-green-600 hover:bg-green-700 transition">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-14 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Smart Hospital Management Platform
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              <span className="text-green-600">Patient</span> Management System
            </h1>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-md">
              A secure, role-based platform for patients, doctors, receptionists, and administrators to manage healthcare operations in one place.
            </p>
            <div className="mt-3 space-y-1 text-sm text-gray-500">
              <p className="font-medium text-gray-700">MediCare Hospital</p>
              <p>Oncosurgical Unit</p>
            </div>
            <div className="mt-7 flex gap-3">
              <Link to="/login" className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition">
                Login
              </Link>
              <Link to="/register" className="px-6 py-2.5 rounded-lg border border-green-600 text-green-600 text-sm font-semibold hover:bg-green-50 transition">
                Register
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl bg-green-50 border border-green-100 p-6 overflow-hidden">
              <HeroIllustration />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-gray-50 border-y border-gray-100 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Everything you need in one system</h2>
              <p className="mt-2 text-sm text-gray-500">Designed for real hospital workflows</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '🗓️', title: 'Appointment Booking', desc: 'Patients book appointments with doctors instantly. Receptionists can book on their behalf.' },
                { icon: '👤', title: 'Patient Profiles', desc: 'Store medical history, allergies, and chronic diseases securely linked to each patient.' },
                { icon: '🩺', title: 'Doctor Portal', desc: 'Doctors review scheduled appointments and update status in real time.' },
                { icon: '🛡️', title: 'Role-Based Access', desc: 'Each role sees only what they need — patient, doctor, receptionist, lab, or admin.' },
                { icon: '📊', title: 'Admin Dashboard', desc: 'Full user management, system stats, and appointment monitoring with filters.' },
                { icon: '🧪', title: 'Lab Module', desc: 'Lab staff will have a dedicated portal for test orders and results — coming soon.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="py-14 mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Built for every role</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { role: 'Patient', color: 'bg-green-50 border-green-200', badge: 'text-green-700 bg-green-100', desc: 'Book appointments, manage your medical profile, and track visit history.' },
              { role: 'Doctor', color: 'bg-blue-50 border-blue-200', badge: 'text-blue-700 bg-blue-100', desc: 'Review assigned appointments and update statuses as visits progress.' },
              { role: 'Admin', color: 'bg-violet-50 border-violet-200', badge: 'text-violet-700 bg-violet-100', desc: 'Manage all users, monitor appointments, and view system-wide statistics.' },
              { role: 'Receptionist', color: 'bg-amber-50 border-amber-200', badge: 'text-amber-700 bg-amber-100', desc: 'Create and manage appointments on behalf of patients.' },
            ].map(({ role, color, badge, desc }) => (
              <div key={role} className={`rounded-2xl border p-5 ${color}`}>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-3 ${badge}`}>{role}</span>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span>© 2026 MediCare. All rights reserved.</span>
          </div>
          <p>Need access? <Link to="/register" className="text-green-600 hover:underline">Create a patient account</Link></p>
        </div>
      </footer>
    </div>
  );
}
