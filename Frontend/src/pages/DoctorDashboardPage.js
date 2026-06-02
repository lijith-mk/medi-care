import React, { useEffect, useState } from 'react';
import DashboardPage from './DashboardPage';
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getAppointments();
        if (res && res.data && res.data.appointments) setAppointments(res.data.appointments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const changeStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res && res.data && res.data.appointment) {
        setAppointments((s) => s.map((a) => (a._id === id ? res.data.appointment : a)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardPage title="Doctor Dashboard" subtitle="Review assigned appointments and update appointment status.">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Assigned Appointments</h2>
        {loading ? (
          <div className="py-8 text-center">Loading…</div>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li key={a._id} className="border p-3 rounded">
                <div className="font-medium">Patient: {a.patient.name} — {a.patient.email}</div>
                <div>Date: {new Date(a.appointmentDate).toLocaleString()}</div>
                <div>Status: {a.status}</div>
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => changeStatus(a._id, 'confirmed')} disabled={updatingId === a._id}>Confirm</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => changeStatus(a._id, 'completed')} disabled={updatingId === a._id}>Complete</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => changeStatus(a._id, 'cancelled')} disabled={updatingId === a._id}>Cancel</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardPage>
  );
}
