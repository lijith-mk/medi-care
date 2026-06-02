import React, { useEffect, useState } from 'react';
import DashboardPage from './DashboardPage';
import { getDoctors } from '../services/doctorService';
import { getUsers } from '../services/userService';
import { createAppointment } from '../services/appointmentService';

export default function ReceptionistDashboardPage() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const dres = await getDoctors();
        if (dres && dres.data && dres.data.doctors) setDoctors(dres.data.doctors);
      } catch (err) {
        console.error(err);
      }
      try {
        const pres = await getUsers('patient');
        if (pres && pres.data && pres.data.users) setPatients(pres.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = { patient: form.patient, doctor: form.doctor, appointmentDate: form.appointmentDate, symptoms: form.symptoms };
      const res = await createAppointment(payload);
      setMessage({ type: 'success', text: 'Appointment created.' });
      setForm({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create appointment.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardPage title="Receptionist Dashboard" subtitle="Create and manage appointments on behalf of patients.">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Create Appointment</h2>

        {message && <div className={`mb-3 p-2 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message.text}</div>}

        {loading ? (
          <div className="py-8 text-center">Loading…</div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">Patient</label>
            <select className="w-full border p-2" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} required>
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.name} — {p.email}</option>
              ))}
            </select>

            <label className="block">Doctor</label>
            <select className="w-full border p-2" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>{d.name} — {d.email}</option>
              ))}
            </select>

            <label className="block">Date & Time</label>
            <input className="w-full border p-2" type="datetime-local" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} required />

            <label className="block">Symptoms</label>
            <textarea className="w-full border p-2" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />

            <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Appointment'}</button>
          </form>
        )}
      </div>
    </DashboardPage>
  );
}
