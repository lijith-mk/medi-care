import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPatientProfile, updatePatientProfile } from '../services/profileService';
import { uploadDocument, deleteDocument } from '../services/uploadService';
import { ProfileCard, Field, ViewRow, Divider, Alert, SaveBar, inputCls, selectCls, FieldError, fieldCls } from '../components/ProfileCard';
import useValidation, { rules } from '../hooks/useValidation';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const empty = {
  medicalHistory: '', allergies: '', chronicDiseases: '', currentMedications: '',
  bloodGroup: '', height: '', weight: '', address: '',
  emergencyName: '', emergencyPhone: '',
};

const normalize = (p) => ({
  medicalHistory: p?.medicalHistory || '',
  allergies: Array.isArray(p?.allergies) ? p.allergies.join(', ') : '',
  chronicDiseases: Array.isArray(p?.chronicDiseases) ? p.chronicDiseases.join(', ') : '',
  currentMedications: Array.isArray(p?.currentMedications) ? p.currentMedications.join(', ') : '',
  bloodGroup: p?.bloodGroup || '',
  height: p?.height || '',
  weight: p?.weight || '',
  address: p?.address || '',
  emergencyName: p?.emergencyContact?.name || '',
  emergencyPhone: p?.emergencyContact?.phone || '',
});

const split = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

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

function EditBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 transition">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit
    </button>
  );
}

export default function PatientProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState(empty);
  const [draft, setDraft] = useState(empty);
  const [documents, setDocuments] = useState([]);
  const [section, setSection] = useState(null); // 'personal' | 'medical' | 'emergency' | 'medications'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const docRef = useRef(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docMsg, setDocMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPatientProfile();
        if (res?.data?.profile) {
          const n = normalize(res.data.profile);
          setData(n); setDraft(n);
          setDocuments(res.data.profile.documents || []);
        }
      } catch { setMsg({ type: 'error', text: 'Failed to load profile.' }); }
      finally { setLoading(false); }
    })();
  }, []);

  const startEdit = (s) => { setDraft({ ...data }); setSection(s); setMsg(null); };
  const cancel = () => { setSection(null); setMsg(null); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await updatePatientProfile({
        medicalHistory: draft.medicalHistory,
        allergies: split(draft.allergies),
        chronicDiseases: split(draft.chronicDiseases),
        currentMedications: split(draft.currentMedications),
        bloodGroup: draft.bloodGroup,
        height: draft.height ? Number(draft.height) : undefined,
        weight: draft.weight ? Number(draft.weight) : undefined,
        address: draft.address,
        emergencyContact: { name: draft.emergencyName, phone: draft.emergencyPhone },
      });
      if (res?.data?.profile) {
        const n = normalize(res.data.profile);
        setData(n); setDraft(n);
        setDocuments(res.data.profile.documents || documents);
      }
      setSection(null);
      setMsg({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setDocUploading(true); setDocMsg(null);
    try {
      const res = await uploadDocument(file);
      if (res?.data?.document) setDocuments((p) => [...p, res.data.document]);
      setDocMsg({ type: 'success', text: `"${file.name}" uploaded.` });
    } catch (err) { setDocMsg({ type: 'error', text: err?.response?.data?.message || 'Upload failed.' }); }
    finally { setDocUploading(false); e.target.value = ''; }
  };

  const handleDocDelete = async (id) => {
    setDeletingId(id); setDocMsg(null);
    try {
      await deleteDocument(id);
      setDocuments((p) => p.filter((d) => d._id !== id));
    } catch (err) { setDocMsg({ type: 'error', text: err?.response?.data?.message || 'Delete failed.' }); }
    finally { setDeletingId(null); }
  };

  const d = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  // Validation schemas per section
  const personalV = useValidation({
    height: rules.heightCm(),
    weight: rules.weightKg(),
  });
  const emergencyV = useValidation({
    emergencyName: rules.name('Contact name'),
    emergencyPhone: rules.indianPhone(true),
  });

  const getV = (s) => s === 'personal' ? personalV : s === 'emergency' ? emergencyV : null;

  const saveWithValidation = async (e) => {
    e.preventDefault();
    const v = getV(section);
    if (v && !v.touchAll(draft)) return;
    await save(e);
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-sm text-gray-400">
      <span className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
      Loading profile…
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── MRN Card ── */}
      {user?.mrn && (
        <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">Medical Record Number</p>
              <p className="text-lg font-bold font-mono text-green-900 tracking-wide">{user.mrn}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-600">Share this with your doctor</p>
            <p className="text-xs text-green-500">or hospital reception</p>
          </div>
        </div>
      )}

      <Alert type={msg?.type} text={msg?.text} />

      {/* ── 1. Personal Info ── */}
      <ProfileCard
        title="Personal Info"
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        action={section !== 'personal' && <EditBtn onClick={() => startEdit('personal')} />}
      >
        {section === 'personal' ? (
          <form onSubmit={saveWithValidation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Blood Group">
                <select className={selectCls} value={draft.bloodGroup} onChange={d('bloodGroup')}>
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Height (cm)">
                <input type="number" className={fieldCls(personalV.touched.height && personalV.errors.height)} placeholder="e.g. 170"
                  value={draft.height} onChange={d('height')} onBlur={() => personalV.touch('height', draft.height)} />
                <FieldError error={personalV.errors.height} />
              </Field>
              <Field label="Weight (kg)">
                <input type="number" className={fieldCls(personalV.touched.weight && personalV.errors.weight)} placeholder="e.g. 65"
                  value={draft.weight} onChange={d('weight')} onBlur={() => personalV.touch('weight', draft.weight)} />
                <FieldError error={personalV.errors.weight} />
              </Field>
            </div>
            <Field label="Address">
              <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Home address…" value={draft.address} onChange={d('address')} />
            </Field>
            <SaveBar saving={saving} onCancel={cancel} />
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ViewRow label="Blood Group" value={data.bloodGroup} />
            <ViewRow label="Height" value={data.height ? `${data.height} cm` : ''} />
            <ViewRow label="Weight" value={data.weight ? `${data.weight} kg` : ''} />
            <div className="col-span-2 sm:col-span-3">
              <ViewRow label="Address" value={data.address} />
            </div>
          </div>
        )}
      </ProfileCard>

      {/* ── 2. Medical History ── */}
      <ProfileCard
        title="Medical History"
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        action={section !== 'medical' && <EditBtn onClick={() => startEdit('medical')} />}
      >
        {section === 'medical' ? (
          <form onSubmit={save} className="space-y-4">            <Field label="Medical History">
              <textarea rows={4} className={inputCls + ' resize-none'} placeholder="Describe relevant medical history…" value={draft.medicalHistory} onChange={d('medicalHistory')} />
            </Field>
            <Field label="Allergies (comma separated)">
              <input type="text" className={inputCls} placeholder="e.g. Penicillin, Pollen" value={draft.allergies} onChange={d('allergies')} />
            </Field>
            <Field label="Chronic Diseases (comma separated)">
              <input type="text" className={inputCls} placeholder="e.g. Diabetes, Hypertension" value={draft.chronicDiseases} onChange={d('chronicDiseases')} />
            </Field>
            <SaveBar saving={saving} onCancel={cancel} />
          </form>
        ) : (
          <div className="space-y-4">
            <ViewRow label="Medical History" value={data.medicalHistory} />
            <Divider />
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Allergies</p>
              {split(data.allergies).length > 0
                ? <div className="flex flex-wrap gap-1.5">{split(data.allergies).map((a) => <Tag key={a} label={a} />)}</div>
                : <p className="text-sm text-gray-300 italic">None recorded.</p>}
            </div>
            <Divider />
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chronic Diseases</p>
              {split(data.chronicDiseases).length > 0
                ? <div className="flex flex-wrap gap-1.5">{split(data.chronicDiseases).map((d) => <Tag key={d} label={d} />)}</div>
                : <p className="text-sm text-gray-300 italic">None recorded.</p>}
            </div>
          </div>
        )}
      </ProfileCard>

      {/* ── 3. Emergency Contact ── */}
      <ProfileCard
        title="Emergency Contact"
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        action={section !== 'emergency' && <EditBtn onClick={() => startEdit('emergency')} />}
      >
        {section === 'emergency' ? (
          <form onSubmit={saveWithValidation} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Name">
                <input type="text" className={fieldCls(emergencyV.touched.emergencyName && emergencyV.errors.emergencyName)} placeholder="e.g. Priya Sharma"
                  value={draft.emergencyName} onChange={d('emergencyName')}
                  onBlur={() => emergencyV.touch('emergencyName', draft.emergencyName)} />
                <FieldError error={emergencyV.errors.emergencyName} />
              </Field>
              <Field label="Contact Phone (Indian)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 select-none pointer-events-none border-r border-gray-200 pr-2">+91</span>
                  <input type="tel" placeholder="98765 43210" maxLength={10}
                    className={fieldCls(emergencyV.touched.emergencyPhone && emergencyV.errors.emergencyPhone).replace('px-3', 'pl-14 pr-3')}
                    value={draft.emergencyPhone} onChange={d('emergencyPhone')}
                    onBlur={() => emergencyV.touch('emergencyPhone', draft.emergencyPhone)} />
                </div>
                <FieldError error={emergencyV.errors.emergencyPhone} />
              </Field>
            </div>
            <SaveBar saving={saving} onCancel={cancel} />
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <ViewRow label="Name" value={data.emergencyName} />
            <ViewRow label="Phone" value={data.emergencyPhone} />
          </div>
        )}
      </ProfileCard>

      {/* ── 4. Current Medications ── */}
      <ProfileCard
        title="Current Medications"
        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
        action={section !== 'medications' && <EditBtn onClick={() => startEdit('medications')} />}
      >
        {section === 'medications' ? (
          <form onSubmit={save} className="space-y-4">            <Field label="Current Medications (comma separated)">
              <textarea rows={3} className={inputCls + ' resize-none'} placeholder="e.g. Metformin 500mg, Aspirin 75mg" value={draft.currentMedications} onChange={d('currentMedications')} />
            </Field>
            <SaveBar saving={saving} onCancel={cancel} />
          </form>
        ) : (
          <div>
            {split(data.currentMedications).length > 0
              ? <div className="flex flex-wrap gap-1.5">{split(data.currentMedications).map((m) => <Tag key={m} label={m} />)}</div>
              : <p className="text-sm text-gray-300 italic">No medications recorded.</p>}
          </div>
        )}
      </ProfileCard>

      {/* ── 5. Medical Documents ── */}
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
          <button onClick={() => docRef.current?.click()} disabled={docUploading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-50 transition">
            {docUploading
              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            }
            {docUploading ? 'Uploading…' : 'Upload file'}
          </button>
          <input ref={docRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleDocUpload} />
        </div>
        {docMsg && <Alert type={docMsg.type} text={docMsg.text} />}
        {documents.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-gray-400">No documents uploaded yet.</p>
            <button onClick={() => docRef.current?.click()} className="mt-1.5 text-xs text-green-600 hover:underline">Upload your first document</button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <li key={doc._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
                <DocIcon type={doc.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.type?.toUpperCase()} · {new Date(doc.uploadedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 transition">View</a>
                  <button onClick={() => handleDocDelete(doc._id)} disabled={deletingId === doc._id}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 disabled:opacity-40 transition">
                    {deletingId === doc._id ? '…' : 'Delete'}
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
