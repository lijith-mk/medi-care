import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
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
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const changeStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res?.data?.appointment) setAppointments((s) => s.map((a) => a._id === id ? res.data.appointment : a));
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  };

  const counts = appointments.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <DashboardPage
      title="Doctor Dashboard"
      subtitle={`Good to see you, Dr. ${user?.name || ''}. Manage your patient appointments below.`}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        {[
          { key: 'all',       label: 'Total',     numColor: 'text-gray-800',   bg: 'border-gray-100 bg-white' },
          { key: 'pending',   label: 'Pending',   numColor: 'text-amber-600',  bg: 'border-amber-100 bg-amber-50' },
          { key: 'confirmed', label: 'Confirmed', numColor: 'text-blue-600',   bg: 'border-blue-100 bg-blue-50' },
          { key: 'completed', label: 'Completed', numColor: 'text-green-600',  bg: 'border-green-100 bg-green-50' },
        ].map(({ key, label, numColor, bg }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${bg} ${filter === key ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:shadow-md'}`}
          >
            <p className={`text-2xl font-bold ${numColor}`}>{key === 'all' ? appointments.length : (counts[key] || 0)}</p>
            <p className="mt-1 text-xs text-gray-400">{label}</p>
          </button>
        ))}
      </div>

      {/* Appointments list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">
            {filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
          </h2>
          <span className="text-xs text-gray-400">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
            <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No appointments found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((a) => {
              const busy = updatingId === a._id;
              return (
                <li key={a._id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          {a.patient?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{a.patient?.name || '—'}</p>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-gray-400 ml-9">
                        {new Date(a.appointmentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      {a.symptoms?.length > 0 && (
                        <p className="text-xs text-gray-400 ml-9 mt-0.5">Symptoms: {a.symptoms.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status !== 'confirmed' && a.status !== 'completed' && a.status !== 'cancelled' && (
                        <button disabled={busy} onClick={() => changeStatus(a._id, 'confirmed')}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-40 transition">
                          Confirm
                        </button>
                      )}
                      {a.status === 'confirmed' && (
                        <button disabled={busy} onClick={() => changeStatus(a._id, 'completed')}
                          className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-40 transition">
                          Complete
                        </button>
                      )}
                      {a.status !== 'completed' && a.status !== 'cancelled' && (
                        <button disabled={busy} onClick={() => changeStatus(a._id, 'cancelled')}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition">
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
