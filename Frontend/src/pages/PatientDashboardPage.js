import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import PatientProfilePage from './PatientProfilePage';
import PatientAppointmentsPage from './PatientAppointmentsPage';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');

  return (
    <DashboardPage
      title="Patient Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Patient'}. Manage your health profile and appointments.`}
    >
      {!user?.profileCompleted && (
        <ProfileCompletionBanner role="patient" onComplete={() => setTab('profile')} />
      )}

      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['appointments', 'Appointments'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && <PatientAppointmentsPage />}
      {tab === 'profile' && <PatientProfilePage />}
    </DashboardPage>
  );
}
