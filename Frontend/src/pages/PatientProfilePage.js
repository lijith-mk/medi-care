import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/profileService';

const emptyProfile = { medicalHistory: '', allergies: '', chronicDiseases: '' };

const normalizeProfile = (p) => ({
  medicalHistory: p?.medicalHistory || '',
  allergies: Array.isArray(p?.allergies) ? p.allergies.join(', ') : (p?.allergies || ''),
  chronicDiseases: Array.isArray(p?.chronicDiseases) ? p.chronicDiseases.join(', ') : (p?.chronicDiseases || ''),
});

const splitList = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

function Tag({ label }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
      {label}
    </span>
  );
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) {
          const normalized = normalizeProfile(res.data.profile);
          setProfile(normalized);
          setDraft(normalized);
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = () => {
    setDraft({ ...profile });
    setEditing(true);
    setMessage(null);
  };

  const cancel = () => {
    setEditing(false);
    setMessage(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        medicalHistory: draft.medicalHistory,
        allergies: splitList(draft.allergies),
        chronicDiseases: splitList(draft.chronicDiseases),
      };
      const res = await updateProfile(payload);
      if (res?.data?.profile) {
        const normalized = normalizeProfile(res.data.profile);
        setProfile(normalized);
        setDraft(normalized);
      }
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const allergiesList = profile.allergies ? splitList(profile.allergies) : [];
  const diseasesList = profile.chronicDiseases ? splitList(profile.chronicDiseases) : [];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span className="text-sm text-slate-400">Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Medical Profile</h2>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-400"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Alert */}
      {message && (
        <div className={`mx-5 mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
          message.type === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-300'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
        }`}>
          {message.type === 'error' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <div className="p-5">
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Medical History</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none resize-none focus:border-cyan-500 transition"
                placeholder="Describe any relevant medical history…"
                value={draft.medicalHistory}
                onChange={(e) => setDraft({ ...draft, medicalHistory: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Allergies</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition"
                placeholder="e.g. Penicillin, Pollen (comma separated)"
                value={draft.allergies}
                onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Chronic Diseases</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition"
                placeholder="e.g. Diabetes, Hypertension (comma separated)"
                value={draft.chronicDiseases}
                onChange={(e) => setDraft({ ...draft, chronicDiseases: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Medical History</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {profile.medicalHistory || <span className="text-slate-600 italic">No medical history recorded.</span>}
              </p>
            </div>
            <div className="h-px bg-slate-800" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Allergies</p>
              {allergiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergiesList.map((a) => <Tag key={a} label={a} />)}
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">No allergies recorded.</p>
              )}
            </div>
            <div className="h-px bg-slate-800" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Chronic Diseases</p>
              {diseasesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {diseasesList.map((d) => <Tag key={d} label={d} />)}
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">No chronic diseases recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
