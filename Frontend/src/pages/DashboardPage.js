import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const roleMeta = {
  patient:      { label: 'Patient',      cls: 'bg-green-100 text-green-700' },
  doctor:       { label: 'Doctor',       cls: 'bg-blue-100 text-blue-700' },
  admin:        { label: 'Admin',        cls: 'bg-violet-100 text-violet-700' },
  receptionist: { label: 'Receptionist', cls: 'bg-amber-100 text-amber-700' },
  lab:          { label: 'Lab Staff',    cls: 'bg-rose-100 text-rose-700' },
};

export default function DashboardPage({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const meta = roleMeta[user?.role] || { label: user?.role, cls: 'bg-gray-100 text-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={30} />
            <span className="hidden font-bold text-gray-800 sm:block">MediCare</span>
          </Link>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="max-w-[130px] truncate text-xs font-medium text-gray-600">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page header bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-gray-300 text-center">
          © 2026 MediCare Hospital System
        </div>
      </footer>
    </div>
  );
}
