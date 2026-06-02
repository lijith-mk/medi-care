import { useState } from 'react';

export default function ProfileCompletionBanner({ role, onComplete }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const tips = {
    patient: 'Add your blood group, emergency contact, and medical history.',
    doctor: 'Add your specialization, department, and qualifications.',
    lab: 'Add your lab name, type, and qualifications.',
    receptionist: 'Add your desk number and shift.',
    admin: null,
  };

  const tip = tips[role];
  if (!tip) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
        <p className="text-xs text-amber-700 mt-0.5">{tip}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onComplete}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
        >
          Complete now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-100 transition"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
