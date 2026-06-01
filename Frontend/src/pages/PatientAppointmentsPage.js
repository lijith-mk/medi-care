import React, { useEffect, useState } from 'react';
import { getAppointments, createAppointment } from '../services/appointmentService';
import { getDoctors } from '../services/doctorService';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctor: '', appointmentDate: '', symptoms: '' });

  useEffect(() => {
    async function load() {
      try {
        const res = await getAppointments();
        if (res && res.data && res.data.appointments) setAppointments(res.data.appointments);
      } catch (err) {
        console.error(err);
      }

      try {
        const dres = await getDoctors();
        if (dres && dres.data && dres.data.doctors) setDoctors(dres.data.doctors);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { doctor: form.doctor, appointmentDate: form.appointmentDate, symptoms: form.symptoms };
      const res = await createAppointment(payload);
      if (res && res.data && res.data.appointment) setAppointments((s) => [res.data.appointment, ...s]);
      setForm({ doctor: '', appointmentDate: '', symptoms: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Book Appointment</h2>
        <form onSubmit={submit} className="space-y-2">
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

          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Request Appointment</button>
        </form>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Your Appointments</h2>
        <ul className="space-y-2">
          {appointments.map((a) => (
            <li key={a._id} className="border p-3 rounded">
              <div className="font-medium">With: {a.doctor ? (a.doctor.name || a.doctor.email) : '—'}</div>
              <div>Date: {new Date(a.appointmentDate).toLocaleString()}</div>
              <div>Status: {a.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
