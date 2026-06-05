import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { getTodayQueue, callNextPatient, updateAppointmentStatus, getAppointments, saveConsultation, addLabRequest, startConsultation } from '../services/appointmentService';
import { getReportsByAppointment } from '../services/labService';
import { ProfileCard, Field, ViewRow, Divider, Alert, SaveBar, inputCls, selectCls } from '../components/ProfileCard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusConfig = {
  pending:       { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:     { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'checked-in':  { label: 'Checked In',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  skipped:       { label: 'Skipped',     cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  'in-progress': { label: 'In Progress', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed:     { label: 'Completed',   cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:     { label: 'Cancelled',   cls: 'bg-red-50 text-red-600 border-red-200' },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const emptyProfile = {
  specialization: '', department: '', qualification: '', experience: '',
  consultationFee: '', availableDays: [], startTime: '', endTime: '',
  maxPatientsPerDay: 20, bio: '',
};

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('queue');

  // ── Queue state ────────────────────────────────────────────────────────────
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({});
  const [queueLoading, setQueueLoading] = useState(true);
  const [nextLoading, setNextLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [queueMsg, setQueueMsg] = useState(null);

  // ── All appointments state ─────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptFilter, setApptFilter] = useState('all');

  // ── Consultation panel state ───────────────────────────────────────────────
  const [activeAppt,     setActiveAppt]     = useState(null); // appointment being consulted
  const [consultation,   setConsultation]   = useState({ notes: '', diagnosis: '', prescription: '' });
  const [labReqForm,     setLabReqForm]     = useState({ testType: '', notes: '' });
  const [savingConsult,  setSavingConsult]  = useState(false);
  const [addingLab,      setAddingLab]      = useState(false);
  const [consultMsg,     setConsultMsg]     = useState(null);
  const [apptReports,    setApptReports]    = useState([]);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  // ── Load today's queue ─────────────────────────────────────────────────────
  const loadQueue = async () => {
    setQueueLoading(true);
    try {
      const res = await getTodayQueue();
      if (res?.data) { setQueue(res.data.queue || []); setCounts(res.data.counts || {}); }
    } catch (err) { setQueueMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to load queue.' }); }
    finally { setQueueLoading(false); }
  };

  // ── Load all appointments ──────────────────────────────────────────────────
  const loadAppointments = async () => {
    setApptLoading(true);
    try {
      const res = await getAppointments();
      if (res?.data?.appointments) setAppointments(res.data.appointments);
    } catch (err) { console.error(err); }
    finally { setApptLoading(false); }
  };

  useEffect(() => {
    loadQueue();
    loadAppointments();
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.specialization && p?.department && p?.qualification));
      } catch { }
      finally { setProfileLoading(false); }
    })();
  }, []);

  // ── Next patient ───────────────────────────────────────────────────────────
  const handleNext = async () => {
    setNextLoading(true); setQueueMsg(null);
    try {
      const res = await callNextPatient();
      setQueueMsg({ type: 'success', text: res.message || 'Next patient called.' });
      await loadQueue();
    } catch (err) {
      setQueueMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally { setNextLoading(false); }
  };

  // ── Status update (check-in / cancel) ────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    setStatusUpdating(id);
    try {
      const res = await updateAppointmentStatus(id, status);
      if (res?.data?.appointment) {
        setQueue((prev) => prev.map((a) => a._id === id ? res.data.appointment : a));
        const updated = queue.map((a) => a._id === id ? { ...a, status } : a);
        const newCounts = updated.reduce((acc, a) => {
          if (a.status !== 'cancelled') acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {});
        setCounts(newCounts);
      }
    } catch (err) {
      setQueueMsg({ type: 'error', text: err?.response?.data?.message || 'Update failed.' });
    } finally { setStatusUpdating(null); }
  };

  // ── Open consultation panel ───────────────────────────────────────────────
  const openConsultation = async (appt) => {
    setActiveAppt(appt);
    setConsultation({
      notes:        appt.notes        || '',
      diagnosis:    appt.diagnosis    || '',
      prescription: appt.prescription || '',
    });
    setLabReqForm({ testType: '', notes: '' });
    setConsultMsg(null);
    setApptReports([]);
    // Load reports for this appointment using appointmentId — no patient ID needed
    try {
      const res = await getReportsByAppointment(appt._id);
      setApptReports(res?.data?.reports || []);
    } catch { setApptReports([]); }
  };

  const refreshReports = async () => {
    if (!activeAppt) return;
    try {
      const res = await getReportsByAppointment(activeAppt._id);
      setApptReports(res?.data?.reports || []);
    } catch { }
  };

  const handleSaveConsultation = async () => {
    setSavingConsult(true); setConsultMsg(null);
    try {
      const res = await saveConsultation(activeAppt._id, consultation);
      if (res?.data?.appointment) {
        setQueue((prev) => prev.map((a) => a._id === activeAppt._id ? res.data.appointment : a));
        setActiveAppt(res.data.appointment);
      }
      setConsultMsg({ type: 'success', text: 'Consultation saved.' });
    } catch (err) {
      setConsultMsg({ type: 'error', text: err?.response?.data?.message || 'Save failed.' });
    } finally { setSavingConsult(false); }
  };

  const handleAddLabRequest = async () => {
    if (!labReqForm.testType.trim()) {
      setConsultMsg({ type: 'error', text: 'Enter a test type.' }); return;
    }
    setAddingLab(true); setConsultMsg(null);
    try {
      const res = await addLabRequest(activeAppt._id, labReqForm);
      if (res?.data?.appointment) {
        setQueue((prev) => prev.map((a) => a._id === activeAppt._id ? res.data.appointment : a));
        setActiveAppt(res.data.appointment);
        setLabReqForm({ testType: '', notes: '' });
      }
      setConsultMsg({ type: 'success', text: `Lab request added: ${labReqForm.testType}` });
      // Refresh reports in case lab already uploaded for a previous request
      await refreshReports();
    } catch (err) {
      setConsultMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally { setAddingLab(false); }
  };

  // ── Start consultation directly for any patient (late arrivals / skipped) ──
  const handleStartConsultation = async (appt) => {
    setStatusUpdating(appt._id);
    try {
      const res = await startConsultation(appt._id);
      if (res?.data?.appointment) {
        await loadQueue(); // reload so in-progress shows correctly
        openConsultation(res.data.appointment);
      }
    } catch (err) {
      setQueueMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to start consultation.' });
    } finally { setStatusUpdating(null); }
  };
  const toggleDay = (day) => setDraft((p) => ({
    ...p,
    availableDays: p.availableDays?.includes(day)
      ? p.availableDays.filter((d) => d !== day)
      : [...(p.availableDays || []), day],
  }));

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await updateProfile({
        specialization:    draft.specialization,
        department:        draft.department,
        qualification:     draft.qualification,
        experience:        draft.experience ? Number(draft.experience) : 0,
        consultationFee:   draft.consultationFee ? Number(draft.consultationFee) : 0,
        availableDays:     draft.availableDays,
        startTime:         draft.startTime,
        endTime:           draft.endTime,
        maxPatientsPerDay: draft.maxPatientsPerDay ? Number(draft.maxPatientsPerDay) : 20,
        bio:               draft.bio,
      });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.specialization && draft.department && draft.qualification));
      setMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' });
    } finally { setSaving(false); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const inProgress = queue.find((a) => a.status === 'in-progress');
  const waiting    = queue.filter((a) => ['confirmed', 'pending', 'checked-in'].includes(a.status));
  const skipped    = queue.filter((a) => a.status === 'skipped');
  const done       = queue.filter((a) => a.status === 'completed');

  return (
    <DashboardPage
      title="Doctor Dashboard"
      subtitle={`Welcome, Dr. ${user?.name || ''}. Manage today's queue and your professional profile.`}
    >
      {!profileComplete && (
        <ProfileCompletionBanner role="doctor" onComplete={() => setTab('profile')} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['queue', "Today's Queue"], ['appointments', 'All Appointments'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
            {key === 'appointments' && appointments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                {appointments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Queue Tab ──────────────────────────────────────────────────────── */}
      {tab === 'queue' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Today', value: queue.length,              color: 'text-gray-800',   bg: 'bg-white border-gray-100' },
              { label: 'Waiting',     value: waiting.length,            color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
              { label: 'Skipped',     value: skipped.length,            color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
              { label: 'Completed',   value: done.length,               color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 shadow-sm ${bg}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="mt-1 text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Alert */}
          {queueMsg && (
            <div className={`rounded-lg border px-4 py-2.5 text-xs ${
              queueMsg.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {queueMsg.text}
            </div>
          )}

          {/* Currently serving */}
          {inProgress && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-2">Now Serving</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white text-sm font-bold">
                    #{inProgress.tokenNumber}
                  </div>
                  <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {inProgress.patient?.name || inProgress.guestPatient?.name || '—'}
                        {!inProgress.patient && inProgress.guestPatient?.name && (
                          <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Walk-in</span>
                        )}
                      </p>
                      {inProgress.symptoms?.length > 0 && (
                        <p className="text-xs text-gray-400">{inProgress.symptoms.join(', ')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openConsultation(inProgress)}
                    className="flex items-center gap-1.5 rounded-lg bg-white border border-purple-300 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Open Notes
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={nextLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {nextLoading ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    Next Patient
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call next when idle */}
          {!inProgress && waiting.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={nextLoading}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
              >
                {nextLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                Call Next Patient (Token #{waiting[0]?.tokenNumber})
              </button>
            </div>
          )}

          {/* Queue list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">
                Queue — {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
              </h2>
              <button
                onClick={loadQueue}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {queueLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : queue.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No patients scheduled today.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {queue.map((a) => {
                  const busy = statusUpdating === a._id;
                  return (
                    <li
                      key={a._id}
                      className={`flex items-start justify-between gap-3 px-5 py-4 transition ${
                        a.status === 'in-progress' ? 'bg-purple-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Token circle */}
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          a.status === 'in-progress'
                            ? 'bg-purple-600 text-white'
                            : a.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {a.tokenNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">
                              {a.patient?.name || a.guestPatient?.name || '—'}
                            </p>
                            {a.patient?.mrn && (
                              <span className="rounded-full bg-green-100 border border-green-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-green-700">
                                {a.patient.mrn}
                              </span>
                            )}
                            {!a.patient && a.guestPatient?.name && (
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Walk-in</span>
                            )}
                            <StatusBadge status={a.status} />
                          </div>
                          <p className="text-xs text-gray-400">
                            {a.patient?.email || (a.guestPatient?.phone ? `📞 ${a.guestPatient.phone}` : 'No contact')}
                          </p>
                          {a.symptoms?.length > 0 && (
                            <p className="mt-0.5 text-xs text-gray-400">Symptoms: {a.symptoms.join(', ')}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {/* Skip — mark absent patient, "Next Patient" will skip them */}
                        {['confirmed', 'pending', 'checked-in'].includes(a.status) && (
                          <button
                            disabled={busy}
                            onClick={() => handleStatusChange(a._id, 'skipped')}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100 disabled:opacity-40 transition"
                            title="Patient not present — skip to next token"
                          >
                            Skip
                          </button>
                        )}
                        {/* Re-activate a skipped patient when they arrive */}
                        {a.status === 'skipped' && (
                          <button
                            disabled={busy}
                            onClick={() => handleStatusChange(a._id, 'confirmed')}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-40 transition"
                            title="Patient has arrived — restore to queue"
                          >
                            Arrived
                          </button>
                        )}
                        {/* Start Consultation directly (pulls into in-progress immediately) */}
                        {['confirmed', 'pending', 'checked-in', 'skipped'].includes(a.status) && (
                          <button
                            disabled={busy}
                            onClick={() => handleStartConsultation(a)}
                            className="rounded-lg border border-green-300 bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40 transition"
                            title="Start consultation now regardless of queue order"
                          >
                            Consult
                          </button>
                        )}
                        {/* Open consultation panel for in-progress */}
                        {a.status === 'in-progress' && (
                          <button
                            onClick={() => openConsultation(a)}
                            className="rounded-lg border border-purple-300 bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition"
                          >
                            Open Notes
                          </button>
                        )}
                        {/* Cancel */}
                        {!['completed', 'cancelled'].includes(a.status) && (
                          <button
                            disabled={busy}
                            onClick={() => handleStatusChange(a._id, 'cancelled')}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── Consultation Panel (modal-style slide-in) ───────────────────────── */}
      {activeAppt && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) setActiveAppt(null); }}>
          <div className="w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-green-50 sticky top-0">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Token #{activeAppt.tokenNumber} — {activeAppt.patient?.name || activeAppt.guestPatient?.name || '—'}
                </p>
                {activeAppt.patient?.mrn && (
                  <span className="inline-block mt-0.5 rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-[11px] font-mono font-semibold text-green-800">
                    {activeAppt.patient.mrn}
                  </span>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeAppt.patient?.email || (activeAppt.guestPatient?.phone ? `📞 ${activeAppt.guestPatient.phone}` : '')}
                </p>
              </div>
              <button onClick={() => setActiveAppt(null)} className="rounded-lg p-1.5 hover:bg-green-100 transition">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 p-5 space-y-5">
              {/* Alert */}
              {consultMsg && (
                <div className={`rounded-lg border px-3 py-2.5 text-xs ${consultMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  {consultMsg.text}
                </div>
              )}

              {/* Symptoms */}
              {activeAppt.symptoms?.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Symptoms</p>
                  <p className="text-xs text-amber-800">{activeAppt.symptoms.join(', ')}</p>
                </div>
              )}

              {/* Consultation notes */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultation</h3>
                <Field label="Doctor Notes">
                  <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Clinical observations, examination findings…"
                    value={consultation.notes} onChange={(e) => setConsultation({ ...consultation, notes: e.target.value })} />
                </Field>
                <Field label="Diagnosis">
                  <input type="text" className={inputCls} placeholder="Primary diagnosis…"
                    value={consultation.diagnosis} onChange={(e) => setConsultation({ ...consultation, diagnosis: e.target.value })} />
                </Field>
                <Field label="Prescription">
                  <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Medicine name, dosage, duration…"
                    value={consultation.prescription} onChange={(e) => setConsultation({ ...consultation, prescription: e.target.value })} />
                </Field>
                <button onClick={handleSaveConsultation} disabled={savingConsult}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
                  {savingConsult ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving…</> : 'Save Consultation'}
                </button>
              </div>

              {/* Lab requests */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab Requests</h3>

                {/* Existing requests */}
                {activeAppt.labRequests?.length > 0 && (
                  <ul className="space-y-2">
                    {activeAppt.labRequests.map((r) => (
                      <li key={r._id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                        r.labStatus === 'completed' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div>
                          <p className="font-semibold text-gray-800">{r.testType}</p>
                          {r.notes && <p className="text-gray-500">{r.notes}</p>}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          r.labStatus === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {r.labStatus}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add new request */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Add Lab Test Request</p>
                  <input type="text" className={inputCls} placeholder="Test type (e.g. Blood Test, X-Ray, ECG)"
                    value={labReqForm.testType} onChange={(e) => setLabReqForm({ ...labReqForm, testType: e.target.value })} />
                  <input type="text" className={inputCls} placeholder="Instructions for lab (optional)"
                    value={labReqForm.notes} onChange={(e) => setLabReqForm({ ...labReqForm, notes: e.target.value })} />
                  <button onClick={handleAddLabRequest} disabled={addingLab}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
                    {addingLab ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : '+'}
                    Request Test
                  </button>
                </div>
              </div>

              {/* Lab reports */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab Reports</h3>
                  <button onClick={refreshReports}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                {apptReports.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No reports uploaded yet for this appointment.</p>
                ) : (
                  apptReports.map((r) => (
                    <div key={r._id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{r.testType}</p>
                        <p className="text-[11px] text-gray-400">by {r.uploadedBy?.name} · {new Date(r.createdAt).toLocaleDateString()}</p>
                        {r.notes && <p className="text-[11px] text-gray-400 italic">"{r.notes}"</p>}
                      </div>
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
                        View
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Complete button */}
              {activeAppt.status !== 'completed' && activeAppt.status !== 'cancelled' && (
                <button onClick={async () => {
                  await handleSaveConsultation();
                  await handleStatusChange(activeAppt._id, 'completed');
                  setActiveAppt(null);
                }}
                  className="w-full rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition">
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Appointments Tab ───────────────────────────────────────────────── */}
      {tab === 'appointments' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'all',       label: 'Total',     color: 'text-gray-800',   bg: 'bg-white border-gray-100' },
              { key: 'confirmed', label: 'Confirmed', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
              { key: 'completed', label: 'Completed', color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
              { key: 'cancelled', label: 'Cancelled', color: 'text-red-500',    bg: 'bg-red-50 border-red-100' },
            ].map(({ key, label, color, bg }) => {
              const apptCounts = appointments.reduce((acc, a) => {
                acc[a.status] = (acc[a.status] || 0) + 1;
                return acc;
              }, {});
              const count = key === 'all' ? appointments.length : (apptCounts[key] || 0);
              return (
                <button key={key} onClick={() => setApptFilter(key)}
                  className={`rounded-2xl border p-3 text-left shadow-sm transition ${bg} ${
                    apptFilter === key ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:shadow-md'
                  }`}>
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </button>
              );
            })}
          </div>

          {/* Appointments list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">
                {apptFilter === 'all'
                  ? 'All Appointments'
                  : `${apptFilter.charAt(0).toUpperCase() + apptFilter.slice(1)} Appointments`}
              </h2>
              <button onClick={loadAppointments} className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {apptLoading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                Loading…
              </div>
            ) : (() => {
              const filtered = apptFilter === 'all'
                ? appointments
                : appointments.filter((a) => a.status === apptFilter);
              
              return filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">No appointments found.</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filtered.map((a) => (
                    <li key={a._id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition">
                      {/* Token */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        a.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{a.patient?.name || '—'}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(a.appointmentDate).toLocaleDateString('en-US', { dateStyle: 'full' })}
                        </p>
                        <p className="text-xs text-gray-400">{a.patient?.email}</p>
                        {a.symptoms?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">Symptoms: {a.symptoms.join(', ')}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Profile Tab ────────────────────────────────────────────────────── */}
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
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              action={!editing && (
                <button
                  onClick={() => { setDraft({ ...profile }); setEditing(true); }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            >
              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Specialization *">
                      <input required type="text" className={inputCls} placeholder="e.g. Cardiologist"
                        value={draft.specialization || ''} onChange={(e) => setDraft({ ...draft, specialization: e.target.value })} />
                    </Field>
                    <Field label="Department *">
                      <input required type="text" className={inputCls} placeholder="e.g. Cardiology"
                        value={draft.department || ''} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
                    </Field>
                    <Field label="Qualification *">
                      <input required type="text" className={inputCls} placeholder="e.g. MBBS, MD"
                        value={draft.qualification || ''} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} />
                    </Field>
                    <Field label="Experience (years)">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 10"
                        value={draft.experience || ''} onChange={(e) => setDraft({ ...draft, experience: e.target.value })} />
                    </Field>
                    <Field label="Consultation Fee (₹)">
                      <input type="number" min="0" className={inputCls} placeholder="e.g. 500"
                        value={draft.consultationFee || ''} onChange={(e) => setDraft({ ...draft, consultationFee: e.target.value })} />
                    </Field>
                    <Field label="Max Patients / Day">
                      <input type="number" min="1" max="100" className={inputCls} placeholder="e.g. 20"
                        value={draft.maxPatientsPerDay || 20} onChange={(e) => setDraft({ ...draft, maxPatientsPerDay: e.target.value })} />
                    </Field>
                    <Field label="Start Time">
                      <input type="time" className={inputCls}
                        value={draft.startTime || ''} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                    </Field>
                    <Field label="End Time">
                      <input type="time" className={inputCls}
                        value={draft.endTime || ''} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Available Days">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {DAYS.map((day) => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            draft.availableDays?.includes(day)
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Bio">
                    <textarea rows={3} className={inputCls + ' resize-none'} placeholder="Brief professional bio…"
                      value={draft.bio || ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
                  </Field>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <ViewRow label="Specialization" value={profile.specialization} />
                    <ViewRow label="Department"     value={profile.department} />
                    <ViewRow label="Qualification"  value={profile.qualification} />
                    <ViewRow label="Experience"     value={profile.experience ? `${profile.experience} yrs` : ''} />
                    <ViewRow label="Consultation Fee" value={profile.consultationFee ? `₹${profile.consultationFee}` : ''} />
                    <ViewRow label="Max Patients/Day" value={profile.maxPatientsPerDay ?? 20} />
                    <ViewRow label="Working Hours"
                      value={profile.startTime && profile.endTime ? `${profile.startTime} – ${profile.endTime}` : (profile.availableTime || '')} />
                  </div>
                  {profile.availableDays?.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Days</p>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.availableDays.map((d) => (
                            <span key={d} className="rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
                              {d}
                            </span>
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
