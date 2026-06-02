import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { getDoctors } from '../services/doctorService';
import { getUsers } from '../services/userService';
import { createAppointment, getAppointments } from '../services/appointmentService';
import { ProfileCard, Field, ViewRow, Alert, SaveBar, inputCls, selectCls } from '../components/ProfileCard';

const statusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>;
}

const emptyProfile = { deskNumber: '', shift: '' };

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');

  // Appointments
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
  const [apptLoading, setApptLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apptMsg, setApptMsg] = useState(null);

  // Profile
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dres, pres, ares] = await Promise.all([getDoctors(), getUsers('patient'), getAppointments()]);
        if (dres?.data?.doctors) setDoctors(dres.data.doctors);
        if (pres?.data?.users) setPatients(pres.data.users);
        if (ares?.data?.appointments) setAppointments(ares.data.appointments);
      } catch (err) { console.error(err); }
      finally { setApptLoading(false); }
    })();
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.deskNumber && p?.shift));
      } catch (err) { console.error(err); }
      finally { setProfileLoading(false); }
    })();
  }, []);

  const submitAppt = async (e) => {
    e.preventDefault(); setSubmitting(true); setApptMsg(null);
    try {
      const res = await createAppointment({ patient: form.patient, doctor: form.doctor, appointmentDate: form.appointmentDate, symptoms: form.symptoms });
      if (res?.data?.appointment) setAppointments((s) => [res.data.appointment, ...s]);
      setForm({ patient: '', doctor: '', appointmentDate: '', symptoms: '' });
      setApptMsg({ type: 'success', text: 'Appointment created.' });
    } catch (err) { setApptMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' }); }
    finally { setSubmitting(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setProfileMsg(null);
    try {
      const res = await updateProfile({ deskNumber: draft.deskNumber, shift: draft.shift });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.deskNumber && draft.shift));
      setProfileMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) { setProfileMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' }); }
    finally { setSaving(false); }
  };

  return (
    <DashboardPage title="Receptionist Dashboard" subtitle={`Hello, ${user?.name || 'Receptionist'}. Create appointments and manage your profile.`}>
      {!profileComplete && <ProfileCompletionBanner role="receptionist" onComplete={() => setTab('profile')} />}

      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['appointments', 'Appointments'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-green-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </div>
                <h2 className="text-sm font-semibold text-green-800">Create Appointment</h2>
              </div>
              {apptMsg && <Alert type={apptMsg.type} text={apptMsg.text} />}
              {apptLoading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                  <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
                </div>
              ) : (
                <form onSubmit={submitAppt} className="p-5 space-y-4">
                  {[['Patient', 'patient', patients, (p) => p.name], ['Doctor', 'doctor', doctors, (d) => `Dr. ${d.name}`]].map(([label, key, list, fmt]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                      <select className={selectCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required>
                        <option value="">Select {label.toLowerCase()}…</option>
                        {list.map((item) => <option key={item._id} value={item._id}>{fmt(item)}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date & Time</label>
                    <input type="datetime-local" className={selectCls} value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Symptoms <span className="text-gray-300 font-normal">(optional)</span></label>
                    <textarea rows={2} className={selectCls + ' resize-none'} placeholder="Describe symptoms…" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
                    {submitting ? 'Creating…' : 'Create Appointment'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h2 className="text-sm font-semibold text-gray-800">All Appointments</h2>
                </div>
                <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">{appointments.length}</span>
              </div>
              {apptLoading ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                  <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
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
                          <p className="text-xs text-gray-400">{new Date(a.appointmentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
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
      )}

      {tab === 'profile' && (
        <div className="max-w-md space-y-4">
          <Alert type={profileMsg?.type} text={profileMsg?.text} />
          {profileLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-sm text-gray-400">
              <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
            </div>
          ) : (
            <ProfileCard
              title="Receptionist Profile"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              action={!editing && (
                <button onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              )}
            >
              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Desk Number *">
                      <input required type="text" className={inputCls} placeholder="e.g. Front Desk 1" value={draft.deskNumber || ''} onChange={(e) => setDraft({ ...draft, deskNumber: e.target.value })} />
                    </Field>
                    <Field label="Shift *">
                      <select required className={selectCls} value={draft.shift || ''} onChange={(e) => setDraft({ ...draft, shift: e.target.value })}>
                        <option value="">Select…</option>
                        {['Morning', 'Afternoon', 'Evening', 'Night'].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewRow label="Desk Number" value={profile.deskNumber} />
                  <ViewRow label="Shift" value={profile.shift} />
                </div>
              )}
            </ProfileCard>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
