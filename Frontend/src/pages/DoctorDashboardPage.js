import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed: { label: 'Completed', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: 'bg-slate-800 text-slate-400 border-slate-700' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAppointments();
        if (res?.data?.appointments) setAppointments(res.data.appointments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changeStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res?.data?.appointment) {
        setAppointments((s) => s.map((a) => (a._id === id ? res.data.appointment : a)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardPage
      title="Doctor Dashboard"
      subtitle={`Good to see you, Dr. ${user?.name || ''}. Review and manage your patient appointments.`}
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { key: 'all',       label: 'Total',     color: 'text-slate-300',  bg: 'bg-slate-800/50' },
          { key: 'pending',   label: 'Pending',   color: 'text-amber-400',  bg: 'bg-amber-500/5' },
          { key: 'confirmed', label: 'Confirmed', color: 'text-blue-400',   bg: 'bg-blue-500/5' },
          { key: 'completed', label: 'Completed', color: 'text-emerald-400',bg: 'bg-emerald-500/5' },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl border p-4 text-left transition ${
              filter === key ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-slate-800 ' + bg + ' hover:border-slate-700'
            }`}
          >
            <p className={`text-2xl font-bold ${color}`}>
              {key === 'all' ? appointments.length : (counts[key] || 0)}
            </p>
            <p className="mt-1 text-xs text-slate-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Appointments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">
            {filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
          </h2>
          <span className="text-xs text-slate-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <div className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            Loading appointments…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No appointments found.</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {filtered.map((a) => {
              const busy = updatingId === a._id;
              return (
                <li key={a._id} className="px-5 py-4 hover:bg-slate-800/30 transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                          {a.patient?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <p className="text-sm font-medium text-white">{a.patient?.name || '—'}</p>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-slate-400 mb-1">
                        {new Date(a.appointmentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      {a.symptoms?.length > 0 && (
                        <p className="text-xs text-slate-500">Symptoms: {a.symptoms.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status !== 'confirmed' && a.status !== 'completed' && a.status !== 'cancelled' && (
                        <button
                          disabled={busy}
                          onClick={() => changeStatus(a._id, 'confirmed')}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === 'confirmed' && (
                        <button
                          disabled={busy}
                          onClick={() => changeStatus(a._id, 'completed')}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
                        >
                          Complete
                        </button>
                      )}
                      {a.status !== 'completed' && a.status !== 'cancelled' && (
                        <button
                          disabled={busy}
                          onClick={() => changeStatus(a._id, 'cancelled')}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardPage>
  );
}
