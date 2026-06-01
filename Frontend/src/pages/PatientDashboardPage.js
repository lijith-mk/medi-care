import React from 'react';
import DashboardPage from './DashboardPage';
import PatientProfilePage from './PatientProfilePage';
import PatientAppointmentsPage from './PatientAppointmentsPage';

export default function PatientDashboardPage() {
  return (
    <DashboardPage title="Patient Dashboard" subtitle="View your profile, appointments, and book new visits.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
