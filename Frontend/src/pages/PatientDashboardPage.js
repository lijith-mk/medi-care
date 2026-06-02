import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import PatientProfilePage from './PatientProfilePage';
import PatientAppointmentsPage from './PatientAppointmentsPage';

export default function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardPage
      title="Patient Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Patient'}. Manage your health profile and appointments.`}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PatientProfilePage />
        </div>
        <div className="lg:col-span-2">
          <PatientAppointmentsPage />
        </div>
      </div>
    </DashboardPage>
  );
}
