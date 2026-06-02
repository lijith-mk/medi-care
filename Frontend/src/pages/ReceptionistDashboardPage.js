import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import { getDoctors } from '../services/doctorService';
import { getUsers } from '../services/userService';
import { createAppointment, getAppointments } from '../services/appointmentService';

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

const selectCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition";

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
        const [dres, pres, ares] = await Promise.all([getDoctors(), getUsers('patient'), getAppointments()]);
        if (dres?.data?.doctors) setDoctors(dres.data.doctors);
        if (pres?.data?.users) setPatients(pres.data.users);
        if (ares?.data?.appointments) setAppointments(ares.data.appointments);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setSubmitting(true); setMessage(null);
    try {
      const res = await createAppointment({ patient: form.patient, doctor: form.doctor, appointmentDate: form.appointmentDate, symptoms: form.symptoms });
      if (res?.data?.appointment) setAppointments((s) => [res.data.appointment, ...s]);
      setForm({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
      setMessage({ type: 'success', text: 'Appointment created successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create appointment.' });
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardPage title="Receptionist Dashboard" subtitle={`Hello, ${user?.name || 'Receptionist'}. Create and manage patient appointments.`}>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-green-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-green-800">Create Appointment</h2>
            </div>

            {message && (
              <div className={`mx-5 mt-4 rounded-lg px-4 py-2.5 text-xs border ${
                message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Patient</label>
                  <select className={selectCls} value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
                    <option value="">Select patient…</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Doctor</label>
                  <select className={selectCls} value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
                    <option value="">Select doctor…</option>
                    {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date & Time</label>
                  <input type="datetime-local" className={selectCls} value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Symptoms <span className="text-gray-300 font-normal">(optional)</span></label>
                  <textarea rows={3} className={selectCls + ' resize-none'} placeholder="Describe symptoms…" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
                  {submitting ? 'Creating…' : 'Create Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Appointment list */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-800">All Appointments</h2>
              </div>
              <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">{appointments.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No appointments yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                {appointments.map((a) => (
                  <li key={a._id} className="px-5 py-3.5 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.patient?.name || '—'}</p>
                          <span className="text-gray-300 text-xs">→</span>
                          <p className="text-sm text-gray-500 truncate">Dr. {a.doctor?.name || '—'}</p>
                        </div>
                        <p className="text-xs text-gray-400">
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
