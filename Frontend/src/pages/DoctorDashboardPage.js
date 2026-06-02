import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { getAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { ProfileCard, Field, ViewRow, Divider, Alert, SaveBar, inputCls, selectCls } from '../components/ProfileCard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const emptyProfile = { specialization: '', department: '', qualification: '', experience: '', consultationFee: '', availableDays: [], availableTime: '', bio: '' };

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAppointments();
        if (res?.data?.appointments) setAppointments(res.data.appointments);
      } catch (err) { console.error(err); }
      finally { setApptLoading(false); }
    })();
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        // check completion
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.specialization && p?.department && p?.qualification));
      } catch (err) { console.error(err); }
      finally { setProfileLoading(false); }
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

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await updateProfile({
        specialization: draft.specialization, department: draft.department,
        qualification: draft.qualification, experience: draft.experience ? Number(draft.experience) : 0,
        consultationFee: draft.consultationFee ? Number(draft.consultationFee) : 0,
        availableDays: draft.availableDays, availableTime: draft.availableTime, bio: draft.bio,
      });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.specialization && draft.department && draft.qualification));
      setMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) { setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' }); }
    finally { setSaving(false); }
  };

  const toggleDay = (day) => setDraft((p) => ({
    ...p,
    availableDays: p.availableDays?.includes(day) ? p.availableDays.filter((d) => d !== day) : [...(p.availableDays || []), day],
  }));

  const counts = appointments.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <DashboardPage title="Doctor Dashboard" subtitle={`Welcome, Dr. ${user?.name || ''}. Manage appointments and your professional profile.`}>
      {!profileComplete && (
        <ProfileCompletionBanner role="doctor" onComplete={() => setTab('profile')} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['appointments', 'Appointments'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
            {[
              { key: 'all', label: 'Total', numColor: 'text-gray-800', bg: 'border-gray-100 bg-white' },
              { key: 'pending', label: 'Pending', numColor: 'text-amber-600', bg: 'border-amber-100 bg-amber-50' },
              { key: 'confirmed', label: 'Confirmed', numColor: 'text-blue-600', bg: 'border-blue-100 bg-blue-50' },
              { key: 'completed', label: 'Completed', numColor: 'text-green-600', bg: 'border-green-100 bg-green-50' },
            ].map(({ key, label, numColor, bg }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition ${bg} ${filter === key ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:shadow-md'}`}>
                <p className={`text-2xl font-bold ${numColor}`}>{key === 'all' ? appointments.length : (counts[key] || 0)}</p>
                <p className="mt-1 text-xs text-gray-400">{label}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">{filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}</h2>
              <span className="text-xs text-gray-400">{filtered.length} shown</span>
            </div>
            {apptLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
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
                          <p className="text-xs text-gray-400 ml-9">{new Date(a.appointmentDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          {a.symptoms?.length > 0 && <p className="text-xs text-gray-400 ml-9 mt-0.5">Symptoms: {a.symptoms.join(', ')}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {a.status !== 'confirmed' && a.status !== 'completed' && a.status !== 'cancelled' && (
                            <button disabled={busy} onClick={() => changeStatus(a._id, 'confirmed')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-40 transition">Confirm</button>
                          )}
                          {a.status === 'confirmed' && (
                            <button disabled={busy} onClick={() => changeStatus(a._id, 'completed')} className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-40 transition">Complete</button>
                          )}
                          {a.status !== 'completed' && a.status !== 'cancelled' && (
                            <button disabled={busy} onClick={() => changeStatus(a._id, 'cancelled')} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition">Cancel</button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === 'profile' && (
        <div className="max-w-2xl space-y-4">
          <Alert type={msg?.type} text={msg?.text} />
          {profileLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-sm text-gray-400">
              <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
            </div>
          ) : (
            <ProfileCard
              title="Professional Profile"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
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
                    <Field label="Specialization *">
                      <input required type="text" className={inputCls} placeholder="e.g. Cardiologist" value={draft.specialization || ''} onChange={(e) => setDraft({ ...draft, specialization: e.target.value })} />
                    </Field>
                    <Field label="Department *">
                      <input required type="text" className={inputCls} placeholder="e.g. Cardiology" value={draft.department || ''} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
                    </Field>
                    <Field label="Qualification *">
                      <input required type="text" className={inputCls} placeholder="e.g. MBBS, MD" value={draft.qualification || ''} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} />
                    </Field>
                    <Field label="Experience (years)">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 10" value={draft.experience || ''} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
                    </Field>
                    <Field label="Consultation Fee">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 500" value={draft.consultationFee || ''} onChange={(e) => setDraft({ ...draft, consultationFee: e.target.value })} />
                    </Field>
                    <Field label="Available Time">
                      <input type="text" className={inputCls} placeholder="e.g. 10:00 - 16:00" value={draft.availableTime || ''} onChange={(e) => setDraft({ ...draft, availableTime: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Available Days">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DAYS.map((day) => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${draft.availableDays?.includes(day) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Bio">
                    <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Brief professional bio…" value={draft.bio || ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
                  </Field>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ViewRow label="Specialization" value={profile.specialization} />
                    <ViewRow label="Department" value={profile.department} />
                    <ViewRow label="Qualification" value={profile.qualification} />
                    <ViewRow label="Experience" value={profile.experience ? `${profile.experience} years` : ''} />
                    <ViewRow label="Consultation Fee" value={profile.consultationFee ? `₹${profile.consultationFee}` : ''} />
                    <ViewRow label="Available Time" value={profile.availableTime} />
                  </div>
                  {profile.availableDays?.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Days</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.availableDays.map((d) => (
                            <span key={d} className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">{d}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {profile.bio && (
                    <>
                      <Divider />
                      <ViewRow label="Bio" value={profile.bio} />
                    </>
                  )}
                </div>
              )}
            </ProfileCard>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
