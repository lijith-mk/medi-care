import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { ProfileCard, Field, ViewRow, Divider, Alert, SaveBar, inputCls } from '../components/ProfileCard';

const modules = [
  { icon: '🧪', title: 'Test Orders', desc: 'View and manage incoming lab test requests from doctors.' },
  { icon: '📋', title: 'Results Entry', desc: 'Record and submit patient test results securely.' },
  { icon: '📊', title: 'Lab Reports', desc: 'Generate and review diagnostic reports.' },
];

const emptyProfile = { labName: '', labType: '', qualification: '', experience: '' };

export default function LabDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.labName && p?.labType));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await updateProfile({
        labName: draft.labName, labType: draft.labType,
        qualification: draft.qualification, experience: draft.experience ? Number(draft.experience) : 0,
      });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.labName && draft.labType));
      setMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) { setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' }); }
    finally { setSaving(false); }
  };

  return (
    <DashboardPage title="Lab Dashboard" subtitle={`Welcome, ${user?.name || 'Lab Staff'}.`}>
      {!profileComplete && <ProfileCompletionBanner role="lab" onComplete={() => setTab('profile')} />}

      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['dashboard', 'Dashboard'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-rose-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-rose-700">Lab Features — In Development</h2>
            <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-600">Coming soon</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {modules.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-5 hover:border-green-200 hover:bg-green-50 transition">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="max-w-2xl space-y-4">
          <Alert type={msg?.type} text={msg?.text} />
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-sm text-gray-400">
              <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
            </div>
          ) : (
            <ProfileCard
              title="Lab Staff Profile"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
              action={!editing && (
                <button onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              )}
            >
              {editing ? (
                <form onSubmit={save} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Lab Name *">
                      <input required type="text" className={inputCls} placeholder="e.g. City Diagnostic Center" value={draft.labName || ''} onChange={(e) => setDraft({ ...draft, labName: e.target.value })} />
                    </Field>
                    <Field label="Lab Type *">
                      <input required type="text" className={inputCls} placeholder="e.g. Pathology" value={draft.labType || ''} onChange={(e) => setDraft({ ...draft, labType: e.target.value })} />
                    </Field>
                    <Field label="Qualification">
                      <input type="text" className={inputCls} placeholder="e.g. BSc Lab Technology" value={draft.qualification || ''} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} />
                    </Field>
                    <Field label="Experience (years)">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 3" value={draft.experience || ''} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
                    </Field>
                  </div>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewRow label="Lab Name" value={profile.labName} />
                  <ViewRow label="Lab Type" value={profile.labType} />
                  <ViewRow label="Qualification" value={profile.qualification} />
                  <ViewRow label="Experience" value={profile.experience ? `${profile.experience} years` : ''} />
                </div>
              )}
            </ProfileCard>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
