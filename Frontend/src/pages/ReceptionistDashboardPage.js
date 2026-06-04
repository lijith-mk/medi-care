import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';
import ProfileCompletionBanner from '../components/ProfileCompletionBanner';
import { getProfile, updateProfile } from '../services/profileService';
import { getAppointments, createAppointment, checkAvailability, getDoctors } from '../services/appointmentService';
import { getUsers } from '../services/userService';
import { ProfileCard, Field, ViewRow, Alert, SaveBar, inputCls, selectCls } from '../components/ProfileCard';

// ─── helpers ──────────────────────────────────────────────────────────────────
const FULL_DAYS = {
  Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
};
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayAbbr(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAY_ABBR[new Date(y, m - 1, d).getDay()];
}

const statusConfig = {
  pending:       { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:     { label: 'Confirmed',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'checked-in':  { label: 'Checked In',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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

function InfoChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
      <span className="text-green-500 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-xs font-medium text-gray-700 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Doctor detail card (same as patient side) ────────────────────────────────
function DoctorCard({ doctor, selectedDate, checking, availInfo }) {
  const selectedDayAbbr = getDayAbbr(selectedDate);
  return (
    <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-base font-bold">
          {doctor.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">Dr. {doctor.name}</p>
          <p className="text-xs text-green-700 font-medium">{doctor.specialization || 'General Physician'}</p>
          <p className="text-xs text-gray-400">{doctor.department || ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoChip
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Fee"
          value={doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Free'}
        />
        <InfoChip
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          label="Max / Day"
          value={`${doctor.maxPatientsPerDay || 20} patients`}
        />
        <InfoChip
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Timings"
          value={doctor.startTime && doctor.endTime ? `${doctor.startTime} – ${doctor.endTime}` : doctor.availableTime || 'Not set'}
        />
        <InfoChip
          icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          label="Days"
          value={doctor.availableDays?.length ? doctor.availableDays.join(', ') : 'Not set'}
        />
      </div>

      {/* Day pills */}
      {doctor.availableDays?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {DAY_ABBR.map((abbr) => {
            const isAvail    = doctor.availableDays.includes(abbr);
            const isSelected = abbr === selectedDayAbbr;
            return (
              <span key={abbr} className={`rounded-full px-2 py-0.5 text-[11px] font-medium border transition ${
                isSelected && isAvail    ? 'bg-green-600 text-white border-green-600'
                : isSelected && !isAvail ? 'bg-red-500 text-white border-red-500'
                : isAvail                ? 'bg-green-50 text-green-700 border-green-200'
                :                          'bg-gray-50 text-gray-300 border-gray-100'
              }`}>
                {abbr}
              </span>
            );
          })}
        </div>
      )}

      {/* Availability banner */}
      {checking && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin shrink-0" />
          Checking availability…
        </div>
      )}
      {!checking && availInfo && selectedDate && (
        availInfo.available ? (
          <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-semibold text-green-700">Available on {FULL_DAYS[selectedDayAbbr] || selectedDayAbbr}</p>
            </div>
            <p className="text-xs text-green-600 pl-6">
              {availInfo.slotsLeft} slot{availInfo.slotsLeft !== 1 ? 's' : ''} left · Token <strong>#{availInfo.nextToken}</strong>
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-semibold text-red-600">{availInfo.reason}</p>
          </div>
        )
      )}
      {!checking && !availInfo && !selectedDate && (
        <p className="text-xs text-gray-400 italic">Select a date to check availability.</p>
      )}
    </div>
  );
}

// ─── Booking form for receptionist ───────────────────────────────────────────
function ReceptionistBookingForm({ doctors, patients, onBooked }) {
  const [mode, setMode] = useState('registered'); // 'registered' | 'walkin'

  // Registered patient fields
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientSearch,   setPatientSearch]   = useState('');

  // Walk-in guest fields
  const [guestName,  setGuestName]  = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAge,   setGuestAge]   = useState('');

  // Shared fields
  const [selectedDoctor,  setSelectedDoctor]  = useState(null);
  const [selectedDate,    setSelectedDate]    = useState('');
  const [symptoms,        setSymptoms]        = useState('');
  const [availInfo,       setAvailInfo]       = useState(null);
  const [checking,        setChecking]        = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState('');

  const filteredPatients = patients.filter((p) =>
    !patientSearch || p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const runCheck = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) { setAvailInfo(null); return; }
    setChecking(true); setAvailInfo(null); setError('');
    try {
      const res = await checkAvailability(doctorId, date);
      setAvailInfo(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not check availability.');
    } finally { setChecking(false); }
  }, []);

  const handleDoctorChange = (e) => {
    const doc = doctors.find((d) => d._id === e.target.value) || null;
    setSelectedDoctor(doc); setAvailInfo(null); setError('');
    runCheck(doc?._id, selectedDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value); setAvailInfo(null); setError('');
    runCheck(selectedDoctor?._id, e.target.value);
  };

  const switchMode = (m) => {
    setMode(m); setError('');
    setSelectedPatient(''); setPatientSearch('');
    setGuestName(''); setGuestPhone(''); setGuestAge('');
  };

  const canBook = selectedDoctor && selectedDate && availInfo?.available && !checking &&
    (mode === 'walkin' ? guestName.trim() : selectedPatient);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor)  { setError('Please select a doctor.');      return; }
    if (!selectedDate)    { setError('Please select a date.');        return; }
    if (!availInfo?.available) {
      setError(availInfo?.reason || 'Doctor is not available on this date.'); return;
    }
    if (mode === 'registered' && !selectedPatient) {
      setError('Please select a registered patient.'); return;
    }
    if (mode === 'walkin' && !guestName.trim()) {
      setError('Please enter the walk-in patient\'s name.'); return;
    }

    setSubmitting(true); setError('');
    try {
      const payload = {
        doctor:          selectedDoctor._id,
        appointmentDate: selectedDate,
        symptoms,
      };
      if (mode === 'registered') {
        payload.patient = selectedPatient;
      } else {
        payload.guestPatient = {
          name:  guestName.trim(),
          phone: guestPhone.trim(),
          age:   guestAge ? Number(guestAge) : undefined,
        };
      }

      const res = await createAppointment(payload);
      onBooked(res?.data?.appointment, res?.message || 'Appointment booked.');
      // reset
      setSelectedDoctor(null); setSelectedPatient(''); setPatientSearch('');
      setGuestName(''); setGuestPhone(''); setGuestAge('');
      setSelectedDate(''); setSymptoms(''); setAvailInfo(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">

      {/* ── Mode toggle ── */}
      <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 gap-0.5">
        {[
          { key: 'registered', label: 'Registered Patient', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          { key: 'walkin',     label: 'Walk-in / Guest',    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
        ].map(({ key, label, icon }) => (
          <button key={key} type="button" onClick={() => switchMode(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
              mode === key
                ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Registered patient fields ── */}
      {mode === 'registered' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Search Patient</label>
            <input type="text" className={inputCls} placeholder="Type name or email…"
              value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Patient</label>
            <select className={selectCls} value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)} required>
              <option value="">Choose a patient…</option>
              {filteredPatients.map((p) => (
                <option key={p._id} value={p._id}>{p.name} — {p.email}</option>
              ))}
            </select>
            {filteredPatients.length === 0 && patientSearch && (
              <p className="mt-1 text-xs text-gray-400">No patients found for "{patientSearch}"</p>
            )}
          </div>
        </>
      )}

      {/* ── Walk-in guest fields ── */}
      {mode === 'walkin' && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700 font-medium">Walk-in — no account required</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
            <input type="text" className={inputCls} placeholder="e.g. Rahul Kumar"
              value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input type="tel" className={inputCls} placeholder="98765 43210"
                value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} maxLength={10} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Age</label>
              <input type="number" className={inputCls} placeholder="e.g. 35"
                min={1} max={120} value={guestAge} onChange={(e) => setGuestAge(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <hr className="border-gray-100" />

      {/* ── Doctor selector ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Doctor</label>
        <select className={selectCls} value={selectedDoctor?._id || ''} onChange={handleDoctorChange} required>
          <option value="">Choose a doctor…</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor detail card */}
      {selectedDoctor ? (
        <DoctorCard doctor={selectedDoctor} selectedDate={selectedDate} checking={checking} availInfo={availInfo} />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 py-5 text-center text-xs text-gray-400">
          Doctor details appear after selection
        </div>
      )}

      {/* ── Date picker ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Appointment Date</label>
        <input type="date" className={inputCls} value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={handleDateChange} disabled={!selectedDoctor} required />
        {!selectedDoctor && <p className="mt-1 text-[11px] text-gray-400">Select a doctor first</p>}
      </div>

      {/* ── Symptoms ── */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          Symptoms <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Patient's symptoms…"
          value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Submit ── */}
      <button type="button" onClick={handleSubmit} disabled={!canBook || submitting}
        className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition ${
          canBook && !submitting ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
        }`}>
        {submitting ? (
          <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Booking…</>
        ) : (
          <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {mode === 'walkin' ? 'Book Walk-in Appointment' : 'Book Appointment'}
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const emptyProfile = { deskNumber: '', shift: '' };

export default function ReceptionistDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('appointments');

  const [doctors,      setDoctors]      = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [banner,       setBanner]       = useState(null);
  const [filter,       setFilter]       = useState('all');

  // Profile
  const [profile,         setProfile]         = useState(emptyProfile);
  const [draft,           setDraft]           = useState(emptyProfile);
  const [profileLoading,  setProfileLoading]  = useState(true);
  const [editing,         setEditing]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [profileMsg,      setProfileMsg]      = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dres, pres, ares] = await Promise.all([
          getDoctors(),
          getUsers('patient'),
          getAppointments(),
        ]);
        if (dres?.data?.doctors)       setDoctors(dres.data.doctors);
        if (pres?.data?.users)         setPatients(pres.data.users);
        if (ares?.data?.appointments)  setAppointments(ares.data.appointments);
      } catch (err) { console.error(err); }
      finally { setDataLoading(false); }
    })();
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
        const p = res?.data?.profile;
        setProfileComplete(!!(p?.deskNumber && p?.shift));
      } catch { }
      finally { setProfileLoading(false); }
    })();
  }, []);

  const handleBooked = (appointment, message) => {
    if (appointment) setAppointments((s) => [appointment, ...s]);
    setBanner({ type: 'success', text: message });
    setTimeout(() => setBanner(null), 5000);
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setProfileMsg(null);
    try {
      const res = await updateProfile({ deskNumber: draft.deskNumber, shift: draft.shift });
      if (res?.data?.profile) { setProfile(res.data.profile); setDraft(res.data.profile); }
      setEditing(false);
      setProfileComplete(!!(draft.deskNumber && draft.shift));
      setProfileMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.message || 'Failed.' });
    } finally { setSaving(false); }
  };

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardPage
      title="Receptionist Dashboard"
      subtitle={`Hello, ${user?.name || 'Receptionist'}. Manage appointments on behalf of patients.`}
    >
      {!profileComplete && <ProfileCompletionBanner role="receptionist" onComplete={() => setTab('profile')} />}

      {/* Global banner */}
      {banner && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 mb-4 text-sm ${
          banner.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {banner.text}
          </div>
          <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[['appointments', 'Appointments'], ['profile', 'My Profile']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Appointments tab ──────────────────────────────────────────────── */}
      {tab === 'appointments' && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left: booking form */}
          <div className="lg:w-80 xl:w-96 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-green-50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-green-800">Book for Patient</h2>
                  <p className="text-xs text-green-600">Book on behalf of any patient</p>
                </div>
              </div>
              <div className="p-5">
                {dataLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                    <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                    Loading…
                  </div>
                ) : (
                  <ReceptionistBookingForm
                    doctors={doctors}
                    patients={patients}
                    onBooked={handleBooked}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: all appointments */}
          <div className="flex-1 min-w-0">
            {/* Summary counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { key: 'all',       label: 'Total',     color: 'text-gray-800',   bg: 'bg-white border-gray-100' },
                { key: 'confirmed', label: 'Confirmed', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
                { key: 'completed', label: 'Completed', color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
                { key: 'cancelled', label: 'Cancelled', color: 'text-red-500',    bg: 'bg-red-50 border-red-100' },
              ].map(({ key, label, color, bg }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`rounded-2xl border p-3 text-left shadow-sm transition ${bg} ${
                    filter === key ? 'ring-2 ring-green-400 ring-offset-1' : 'hover:shadow-md'
                  }`}>
                  <p className={`text-xl font-bold ${color}`}>
                    {key === 'all' ? appointments.length : (counts[key] || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">
                  {filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
                </h2>
                <span className="text-xs text-gray-400">{filtered.length} shown</span>
              </div>

              {dataLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                  <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">No appointments found.</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {filtered.map((a) => (
                    <li key={a._id} className="px-5 py-3.5 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Token */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
                            {a.tokenNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {a.patient?.name || a.guestPatient?.name || '—'}
                                {!a.patient && a.guestPatient?.name && (
                                  <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Walk-in</span>
                                )}
                              </p>
                              <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                              <p className="text-sm text-gray-500 truncate">Dr. {a.doctor?.name || '—'}</p>
                            </div>
                            <p className="text-xs text-gray-400">
                              {new Date(a.appointmentDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </p>
                            {a.guestPatient?.phone && (
                              <p className="text-xs text-gray-400">📞 {a.guestPatient.phone}</p>
                            )}
                            {a.symptoms?.length > 0 && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">Symptoms: {a.symptoms.join(', ')}</p>
                            )}
                          </div>
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

      {/* ── Profile tab ───────────────────────────────────────────────────── */}
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
                      <input required type="text" className={inputCls} placeholder="e.g. Front Desk 1"
                        value={draft.deskNumber || ''} onChange={(e) => setDraft({ ...draft, deskNumber: e.target.value })} />
                    </Field>
                    <Field label="Shift *">
                      <select required className={selectCls} value={draft.shift || ''} onChange={(e) => setDraft({ ...draft, shift: e.target.value })}>
                        <option value="">Select…</option>
                        {['Morning', 'Afternoon', 'Evening', 'Night'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <SaveBar saving={saving} onCancel={() => setEditing(false)} />
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewRow label="Desk Number" value={profile.deskNumber} />
                  <ViewRow label="Shift"       value={profile.shift} />
                </div>
              )}
            </ProfileCard>
          )}
        </div>
      )}
    </DashboardPage>
  );
}
