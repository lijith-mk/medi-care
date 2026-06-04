import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { getPendingRequests, uploadLabReport, getMyUploadedReports } from '../services/labService';
import { ProfileCard, Field, ViewRow, Alert, SaveBar, inputCls } from '../components/ProfileCard';

const emptyProfile = { labName: '', labType: '', qualification: '', experience: '' };

function StatusPill({ status }) {
  return status === 'completed'
    ? <span className="rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">Completed</span>
    : <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>;
}

export default function LabDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');

  // ── Pending requests ──────────────────────────────────────────────────────
  const [requests,     setRequests]     = useState([]);
  const [reqLoading,   setReqLoading]   = useState(true);
  const [uploadingId,  setUploadingId]  = useState(null); // labRequestId being uploaded
  const [reqMsg,       setReqMsg]       = useState(null);
  const fileInputRef = useRef(null);
  const [pendingUpload, setPendingUpload] = useState(null); // { request } to upload for
  const [uploadNotes,   setUploadNotes]  = useState('');

  // ── Completed reports ─────────────────────────────────────────────────────
  const [reports,      setReports]      = useState([]);
  const [repLoading,   setRepLoading]   = useState(true);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [profile,         setProfile]         = useState(emptyProfile);
  const [draft,           setDraft]           = useState(emptyProfile);
  const [profLoading,     setProfLoading]     = useState(true);
  const [editing,         setEditing]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [profMsg,         setProfMsg]         = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  const loadRequests = async () => {
    setReqLoading(true);
    try {
      const res = await getPendingRequests();
      setRequests(res?.data?.requests || []);
    } catch { }
    finally { setReqLoading(false); }
  };

  const loadReports = async () => {
    setRepLoading(true);
    try {
      const res = await getMyUploadedReports();
      setReports(res?.data?.reports || []);
    } catch { }
    finally { setRepLoading(false); }
  };

  useEffect(() => {
    loadRequests();
    loadReports();
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.labName && p?.labType));
      } catch { }
      finally { setProfLoading(false); }
    })();
  }, []);

  // Handle file selected after clicking Upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload) return;
    e.target.value = '';

    const { request } = pendingUpload;
    setUploadingId(request.labRequestId);
    setReqMsg(null);
    try {
      const fd = new FormData();
      fd.append('report',         file);
      fd.append('appointmentId',  request.appointmentId);
      fd.append('labRequestId',   request.labRequestId);
      fd.append('testType',       request.testType);
      fd.append('notes',          uploadNotes);

      await uploadLabReport(fd);
      setReqMsg({ type: 'success', text: `Report uploaded for ${request.testType} (${request.patientName})` });
      setUploadNotes('');
      setPendingUpload(null);
      await loadRequests();
      await loadReports();
    } catch (err) {
      setReqMsg({ type: 'error', text: err?.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploadingId(null);
    }
  };

  const triggerUpload = (request) => {
    setPendingUpload({ request });
    setUploadNotes('');
    // Small delay to let state update
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setProfMsg(null);
    try {
      const res = await updateProfile({
        labName: draft.labName, labType: draft.labType,
        qualification: draft.qualification,
        experience: draft.experience ? Number(draft.experience) : 0,
      });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.labName && draft.labType));
      setProfMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setProfMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally { setSaving(false); }
  };

  return (
    <DashboardPage title="Lab Dashboard" subtitle={`Welcome, ${user?.name || 'Lab Staff'}. Manage test requests and reports.`}>
      {!profileComplete && <ProfileCompletionBanner role="lab" onComplete={() => setTab('profile')} />}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden" onChange={handleFileChange} />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['requests', 'Pending Requests'], ['reports', 'Uploaded Reports'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {label}
            {key === 'requests' && requests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending Requests ─────────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {reqMsg && (
            <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${
              reqMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <span>{reqMsg.text}</span>
              <button onClick={() => setReqMsg(null)} className="opacity-60 hover:opacity-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Pending Lab Requests</h2>
              </div>
              <button onClick={loadRequests} className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>

            {reqLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center">
                <svg className="mx-auto w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-400">No pending lab requests.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <li key={`${r.appointmentId}-${r.labRequestId}`}
                    className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">
                          {r.testType}
                        </span>
                        <StatusPill status={r.labStatus} />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{r.patientName}</p>
                      <p className="text-xs text-gray-400">
                        Dr. {r.doctorName} · {new Date(r.appointmentDate).toLocaleDateString('en-US', { dateStyle: 'medium' })} · Token #{r.tokenNumber}
                      </p>
                      {r.requestNotes && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{r.requestNotes}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => triggerUpload(r)}
                      disabled={uploadingId === r.labRequestId}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {uploadingId === r.labRequestId ? (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                      Upload Report
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Uploaded Reports ─────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-800">Uploaded Reports</h2>
            </div>
            <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">{reports.length}</span>
          </div>

          {repLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
              <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No reports uploaded yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {reports.map((r) => (
                <li key={r._id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">{r.testType}</span>
                      <span className="text-xs text-gray-400">{r.fileType?.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Dr. {r.doctor?.name || '—'} · {new Date(r.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </p>
                    {r.notes && <p className="text-xs text-gray-500 mt-0.5 italic">"{r.notes}"</p>}
                  </div>
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Profile tab ───────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="max-w-2xl space-y-4">
          <Alert type={profMsg?.type} text={profMsg?.text} />
          {profLoading ? (
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
                      <input required type="text" className={inputCls} placeholder="e.g. City Diagnostic Center"
                        value={draft.labName || ''} onChange={(e) => setDraft({ ...draft, labName: e.target.value })} />
                    </Field>
                    <Field label="Lab Type *">
                      <input required type="text" className={inputCls} placeholder="e.g. Pathology"
                        value={draft.labType || ''} onChange={(e) => setDraft({ ...draft, labType: e.target.value })} />
                    </Field>
                    <Field label="Qualification">
                      <input type="text" className={inputCls} placeholder="e.g. BSc Lab Technology"
                        value={draft.qualification || ''} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} />
                    </Field>
                    <Field label="Experience (years)">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 3"
                        value={draft.experience || ''} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
                    </Field>
                  </div>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewRow label="Lab Name"     value={profile.labName} />
                  <ViewRow label="Lab Type"     value={profile.labType} />
                  <ViewRow label="Qualification" value={profile.qualification} />
                  <ViewRow label="Experience"   value={profile.experience ? `${profile.experience} years` : ''} />
                </div>
              )}
            </ProfileCard>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
