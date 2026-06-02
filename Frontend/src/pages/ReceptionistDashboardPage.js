import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import { getDoctors } from '../services/doctorService';
import { getUsers } from '../services/userService';
import { createAppointment, getAppointments } from '../services/appointmentService';

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

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [dres, pres, ares] = await Promise.all([
          getDoctors(),
          getUsers('patient'),
          getAppointments(),
        ]);
        if (dres?.data?.doctors) setDoctors(dres.data.doctors);
        if (pres?.data?.users) setPatients(pres.data.users);
        if (ares?.data?.appointments) setAppointments(ares.data.appointments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await createAppointment({ patient: form.patient, doctor: form.doctor, appointmentDate: form.appointmentDate, symptoms: form.symptoms });
      if (res?.data?.appointment) setAppointments((s) => [res.data.appointment, ...s]);
      setForm({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
      setMessage({ type: 'success', text: 'Appointment created successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create appointment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label, children) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const selectCls = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-500 transition";

  return (
    <DashboardPage
      title="Receptionist Dashboard"
      subtitle={`Hello, ${user?.name || 'Receptionist'}. Create and track patient appointments.`}
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-white">Create Appointment</h2>
            </div>

            {message && (
              <div className={`mx-5 mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border ${
                message.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <div className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                {field('Patient', (
                  <select className={selectCls} value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                    <option value="">Select patient…</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                ))}
                {field('Doctor', (
                  <select className={selectCls} value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
                    <option value="">Select doctor…</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>Dr. {d.name}</option>
                    ))}
                  </select>
                ))}
                {field('Date & Time', (
                  <input
                    type="datetime-local"
                    className={selectCls}
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    required
                  />
                ))}
                {field('Symptoms (optional)', (
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none resize-none focus:border-cyan-500 transition"
                    placeholder="Describe symptoms…"
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  />
                ))}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Create Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Appointment list */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-white">All Appointments</h2>
              </div>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
                {appointments.length}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <div className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">No appointments yet.</div>
            ) : (
              <ul className="divide-y divide-slate-800 max-h-[520px] overflow-y-auto">
                {appointments.map((a) => (
                  <li key={a._id} className="px-5 py-3.5 hover:bg-slate-800/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-white truncate">{a.patient?.name || '—'}</p>
                          <span className="text-slate-600 text-xs">→</span>
                          <p className="text-sm text-slate-400 truncate">Dr. {a.doctor?.name || '—'}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(a.appointmentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
