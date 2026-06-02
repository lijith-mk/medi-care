import React, { useEffect, useRef, useState } from 'react';
import { getProfile, updateProfile } from '../services/profileService';
import { uploadDocument, deleteDocument } from '../services/uploadService';

const emptyProfile = { medicalHistory: '', allergies: '', chronicDiseases: '' };

const normalizeProfile = (p) => ({
  medicalHistory: p?.medicalHistory || '',
  allergies: Array.isArray(p?.allergies) ? p.allergies.join(', ') : (p?.allergies || ''),
  chronicDiseases: Array.isArray(p?.chronicDiseases) ? p.chronicDiseases.join(', ') : (p?.chronicDiseases || ''),
});

const splitList = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

function Tag({ label }) {
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
      {label}
    </span>
  );
}

function DocIcon({ type }) {
  if (type === 'pdf') return (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white";

export default function PatientProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [documents, setDocuments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Document upload state
  const docInputRef = useRef(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docMessage, setDocMessage] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        if (res?.data?.profile) {
          const n = normalizeProfile(res.data.profile);
          setProfile(n);
          setDraft(n);
          setDocuments(res.data.profile.documents || []);
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = () => { setDraft({ ...profile }); setEditing(true); setMessage(null); };
  const cancel = () => { setEditing(false); setMessage(null); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    try {
      const res = await updateProfile({
        medicalHistory: draft.medicalHistory,
        allergies: splitList(draft.allergies),
        chronicDiseases: splitList(draft.chronicDiseases),
      });
      if (res?.data?.profile) {
        const n = normalizeProfile(res.data.profile);
        setProfile(n); setDraft(n);
        setDocuments(res.data.profile.documents || documents);
      }
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true);
    setDocMessage(null);
    try {
      const res = await uploadDocument(file);
      if (res?.data?.document) setDocuments((prev) => [...prev, res.data.document]);
      setDocMessage({ type: 'success', text: `"${file.name}" uploaded.` });
    } catch (err) {
      setDocMessage({ type: 'error', text: err?.response?.data?.message || 'Upload failed.' });
    } finally {
      setDocUploading(false);
      e.target.value = '';
    }
  };

  const handleDocDelete = async (docId) => {
    setDeletingDocId(docId);
    setDocMessage(null);
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch (err) {
      setDocMessage({ type: 'error', text: err?.response?.data?.message || 'Delete failed.' });
    } finally { setDeletingDocId(null); }
  };

  const allergiesList = profile.allergies ? splitList(profile.allergies) : [];
  const diseasesList  = profile.chronicDiseases ? splitList(profile.chronicDiseases) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Medical Profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-800">Medical Profile</h2>
          </div>
          {!editing && (
            <button onClick={startEdit} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {message && (
          <div className={`mx-5 mt-4 rounded-lg px-4 py-2.5 text-xs border ${
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="p-5">
          {editing ? (
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Medical History</label>
                <textarea rows={4} className={inputCls + ' resize-none'} placeholder="Describe any relevant medical history…" value={draft.medicalHistory} onChange={(e) => setDraft({ ...draft, medicalHistory: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Allergies <span className="text-gray-300 font-normal">(comma separated)</span></label>
                <input type="text" className={inputCls} placeholder="e.g. Penicillin, Pollen" value={draft.allergies} onChange={(e) => setDraft({ ...draft, allergies: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Chronic Diseases <span className="text-gray-300 font-normal">(comma separated)</span></label>
                <input type="text" className={inputCls} placeholder="e.g. Diabetes, Hypertension" value={draft.chronicDiseases} onChange={(e) => setDraft({ ...draft, chronicDiseases: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={cancel} disabled={saving} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medical History</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {profile.medicalHistory || <span className="text-gray-300 italic">No medical history recorded.</span>}
                </p>
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Allergies</p>
                {allergiesList.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{allergiesList.map((a) => <Tag key={a} label={a} />)}</div>
                  : <p className="text-sm text-gray-300 italic">None recorded.</p>
                }
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chronic Diseases</p>
                {diseasesList.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{diseasesList.map((d) => <Tag key={d} label={d} />)}</div>
                  : <p className="text-sm text-gray-300 italic">None recorded.</p>
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Medical Documents card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Medical Documents</h2>
              <p className="text-xs text-gray-400">Reports, prescriptions, lab results — JPG, PNG, PDF up to 10 MB</p>
            </div>
          </div>
          <button
            onClick={() => docInputRef.current?.click()}
            disabled={docUploading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-50 transition"
          >
            {docUploading ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {docUploading ? 'Uploading…' : 'Upload file'}
          </button>
          <input
            ref={docInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleDocUpload}
          />
        </div>

        {docMessage && (
          <div className={`mx-5 mt-4 rounded-lg px-4 py-2.5 text-xs border ${
            docMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {docMessage.text}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">No documents uploaded yet.</p>
            <button onClick={() => docInputRef.current?.click()} className="mt-1.5 text-xs text-green-600 hover:underline">
              Upload your first document
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <li key={doc._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
                <DocIcon type={doc.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    {doc.type?.toUpperCase()} · {new Date(doc.uploadedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDocDelete(doc._id)}
                    disabled={deletingDocId === doc._id}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition"
                  >
                    {deletingDocId === doc._id ? '…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
