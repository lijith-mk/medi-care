import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../services/profileService';

export default function PatientProfilePage() {
  const [profile, setProfile] = useState({ medicalHistory: '', allergies: '', chronicDiseases: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProfile();
        if (res && res.data && res.data.profile) setProfile(res.data.profile);
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateProfile(profile);
      if (res && res.data && res.data.profile) setProfile(res.data.profile);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Your Profile</h2>
      {message && (
        <div className={`mb-3 p-2 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center">Loading profile…</div>
      ) : (
        <form onSubmit={save}>
          <label className="block mb-2">Medical History</label>
          <textarea className="w-full border p-2 mb-3" value={profile.medicalHistory || ''} onChange={(e) => setProfile({ ...profile, medicalHistory: e.target.value })} readOnly={!editing} />

          <label className="block mb-2">Allergies</label>
          <input className="w-full border p-2 mb-3" value={profile.allergies || ''} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} readOnly={!editing} />

          <label className="block mb-2">Chronic Diseases</label>
          <input className="w-full border p-2 mb-3" value={profile.chronicDiseases || ''} onChange={(e) => setProfile({ ...profile, chronicDiseases: e.target.value })} readOnly={!editing} />

          <div className="flex gap-2">
            {editing ? (
              <>
                <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="px-4 py-2 border rounded" type="button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              </>
            ) : (
              <button className="px-4 py-2 bg-green-600 text-white rounded" type="button" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
