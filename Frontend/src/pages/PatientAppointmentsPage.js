import { useEffect, useState, useCallback } from 'react';
import { getAppointments, createAppointment, checkAvailability, getDoctors, updateAppointmentStatus } from '../services/appointmentService';
import { getMyReports } from '../services/labService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const FULL_DAYS = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
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

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable UI pieces
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Detail Card
// ─────────────────────────────────────────────────────────────────────────────

function DoctorCard({ doctor, selectedDate, checking, availInfo }) {
  const selectedDayAbbr = getDayAbbr(selectedDate);

  return (
    <div className="rounded-xl border border-green-100 bg-green-50/40 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white text-lg font-bold">
          {doctor.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">Dr. {doctor.name}</p>
          <p className="text-xs text-green-700 font-medium">{doctor.specialization || 'General Physician'}</p>
          <p className="text-xs text-gray-400">{doctor.department || ''}</p>
        </div>
      </div>

      {/* Info chips */}
      <div className="grid grid-cols-2 gap-2">
        <InfoChip
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Consultation Fee"
          value={doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Free'}
        />
        <InfoChip
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          label="Max Patients / Day"
          value={`${doctor.maxPatientsPerDay || 20} patients`}
        />
        <InfoChip
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Timings"
          value={
            doctor.startTime && doctor.endTime
              ? `${doctor.startTime} – ${doctor.endTime}`
              : doctor.availableTime || 'Not set'
          }
        />
        <InfoChip
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Available Days"
          value={doctor.availableDays?.length ? doctor.availableDays.join(', ') : 'Not set'}
        />
      </div>

      {/* Day pills */}
      {doctor.availableDays?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {DAY_ABBR.filter((d) => d !== 'Sun' || doctor.availableDays.includes('Sun')).map((abbr) => {
            const isAvailable = doctor.availableDays.includes(abbr);
            const isSelected  = abbr === selectedDayAbbr;
            return (
              <span
                key={abbr}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition ${
                  isSelected && isAvailable
                    ? 'bg-green-600 text-white border-green-600'
                    : isSelected && !isAvailable
                    ? 'bg-red-500 text-white border-red-500'
                    : isAvailable
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-300 border-gray-100'
                }`}
              >
                {abbr}
              </span>
            );
          })}
        </div>
      )}

      {/* Availability result banner */}
      {checking && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-500">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin shrink-0" />
          Checking availability for {selectedDate}…
        </div>
      )}

      {!checking && availInfo && selectedDate && (
        availInfo.available ? (
          <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-green-700">
                Available on {FULL_DAYS[selectedDayAbbr] || selectedDayAbbr}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-green-600 pl-6">
              <span>{availInfo.slotsLeft} slot{availInfo.slotsLeft !== 1 ? 's' : ''} remaining</span>
              <span className="font-semibold">Your token: #{availInfo.nextToken}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-red-600">{availInfo.reason}</p>
            </div>
          </div>
        )
      )}

      {/* Hint when no date yet */}
      {!checking && !availInfo && !selectedDate && (
        <p className="text-xs text-gray-400 italic">Select a date to check availability.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Form
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition';

function BookingForm({ doctors, onBooked, onClose }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate,   setSelectedDate]   = useState('');
  const [symptoms,       setSymptoms]       = useState('');
  const [availInfo,      setAvailInfo]      = useState(null);
  const [checking,       setChecking]       = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  // Check availability whenever doctor or date changes
  const runCheck = useCallback(async (doctorId, date) => {
    if (!doctorId || !date) { setAvailInfo(null); return; }
    setChecking(true); setAvailInfo(null); setError('');
    try {
      const res = await checkAvailability(doctorId, date);
      setAvailInfo(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not check availability. Please try again.');
    } finally {
      setChecking(false);
    }
  }, []);

  const handleDoctorChange = (e) => {
    const doc = doctors.find((d) => d._id === e.target.value) || null;
    setSelectedDoctor(doc);
    setAvailInfo(null);
    setError('');
    runCheck(doc?._id, selectedDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setAvailInfo(null);
    setError('');
    runCheck(selectedDoctor?._id, e.target.value);
  };

  const canBook = selectedDoctor && selectedDate && availInfo?.available && !checking;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canBook) {
      setError(
        !selectedDoctor   ? 'Please select a doctor.' :
        !selectedDate     ? 'Please select a date.' :
        !availInfo        ? 'Please wait for availability check.' :
        availInfo.reason  || 'Doctor is not available on this date.'
      );
      return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await createAppointment({
        doctor:          selectedDoctor._id,
        appointmentDate: selectedDate,
        symptoms,
      });
      onBooked(res?.data?.appointment, res?.message);
    } catch (err) {
      setError(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ── Left: form fields ── */}
        <div className="flex-1 space-y-4">
          {/* Doctor dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Doctor</label>
            <select
              className={inputCls}
              value={selectedDoctor?._id || ''}
              onChange={handleDoctorChange}
              required
            >
              <option value="">Choose a doctor…</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Appointment Date</label>
            <input
              type="date"
              className={inputCls}
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
              disabled={!selectedDoctor}
              required
            />
            {!selectedDoctor && (
              <p className="mt-1 text-[11px] text-gray-400">Select a doctor first</p>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Symptoms
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Briefly describe your symptoms…"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canBook || submitting}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                canBook && !submitting
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Booking…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Book Appointment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:border-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Right: doctor detail card ── */}
        <div className="lg:w-72 xl:w-80 shrink-0">
          {selectedDoctor ? (
            <DoctorCard
              doctor={selectedDoctor}
              selectedDate={selectedDate}
              checking={checking}
              availInfo={availInfo}
            />
          ) : (
            <div className="h-full rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 p-8 text-center">
              <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-400">Doctor details will appear here after you select one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [labReports,   setLabReports]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [banner,       setBanner]       = useState(null);
  const [cancelling,   setCancelling]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [apptRes, docRes, repRes] = await Promise.all([
          getAppointments(), getDoctors(), getMyReports()
        ]);
        if (apptRes?.data?.appointments) setAppointments(apptRes.data.appointments);
        if (docRes?.data?.doctors)       setDoctors(docRes.data.doctors);
        if (repRes?.data?.reports)       setLabReports(repRes.data.reports);
      } catch {
        setBanner({ type: 'error', text: 'Failed to load data. Please refresh.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBooked = (appointment, message) => {
    if (appointment) setAppointments((s) => [appointment, ...s]);
    setShowForm(false);
    setBanner({ type: 'success', text: message || 'Appointment booked successfully.' });
    setTimeout(() => setBanner(null), 5000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(id);
    try {
      const res = await updateAppointmentStatus(id, 'cancelled');
      if (res?.data?.appointment) {
        setAppointments((s) => s.map((a) => a._id === id ? res.data.appointment : a));
      }
      setBanner({ type: 'success', text: 'Appointment cancelled.' });
      setTimeout(() => setBanner(null), 4000);
    } catch (err) {
      setBanner({ type: 'error', text: err?.response?.data?.message || 'Failed to cancel.' });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Global banner */}
      {banner && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          banner.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {banner.text}
          </div>
          <button onClick={() => setBanner(null)} className="text-current opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Book card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Book Appointment</h2>
              <p className="text-xs text-gray-400">Select a doctor and date to get started</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition"
          >
            {showForm ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Collapse
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New booking
              </>
            )}
          </button>
        </div>

        {showForm && (
          <BookingForm
            doctors={doctors}
            onBooked={handleBooked}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>

      {/* ── Appointments list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Your Appointments</h2>
          </div>
          <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">
            {appointments.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
            <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            Loading…
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-14 text-center">
            <svg className="mx-auto w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400">No appointments yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-green-600 hover:underline">
              Book your first appointment
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {appointments.map((a) => {
              const canCancel = a.status === 'confirmed' || a.status === 'pending';
              const isCancelling = cancelling === a._id;
              return (
                <li key={a._id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  {/* Token circle */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    a.status === 'cancelled'  ? 'bg-gray-100 text-gray-400' :
                    a.status === 'completed'  ? 'bg-green-100 text-green-700' :
                    'bg-green-600 text-white'
                  }`}>
                    {a.tokenNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">Dr. {a.doctor?.name || '—'}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(a.appointmentDate).toLocaleDateString('en-US', { dateStyle: 'full' })}
                    </p>
                    {a.symptoms?.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400 truncate">
                        Symptoms: {a.symptoms.join(', ')}
                      </p>
                    )}
                  </div>
                  {/* Cancel button — only for pending/confirmed */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(a._id)}
                      disabled={isCancelling}
                      className="shrink-0 flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 transition"
                    >
                      {isCancelling ? (
                        <span className="h-3 w-3 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Cancel
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Lab Reports ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-800">My Lab Reports</h2>
          </div>
          <span className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs text-gray-400">
            {labReports.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-400">
            <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            Loading…
          </div>
        ) : labReports.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No lab reports yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {labReports.map((r) => (
              <li key={r._id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  r.fileType === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {r.fileType === 'pdf' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.testType}</p>
                  <p className="text-xs text-gray-400">
                    Dr. {r.doctor?.name || '—'} · {new Date(r.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  {r.notes && <p className="text-xs text-gray-500 mt-0.5 italic">"{r.notes}"</p>}
                </div>
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  View / Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
