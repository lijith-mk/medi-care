import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar, deleteAvatar } from '../services/uploadService';
import Logo from '../components/Logo';

const roleMeta = {
  patient:      { label: 'Patient',      cls: 'bg-green-100 text-green-700' },
  doctor:       { label: 'Doctor',       cls: 'bg-blue-100 text-blue-700' },
  admin:        { label: 'Admin',        cls: 'bg-violet-100 text-violet-700' },
  receptionist: { label: 'Receptionist', cls: 'bg-amber-100 text-amber-700' },
  lab:          { label: 'Lab Staff',    cls: 'bg-rose-100 text-rose-700' },
};

function AvatarMenu({ user, updateUser }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setOpen(false);
    try {
      const res = await uploadAvatar(file);
      updateUser({ avatarUrl: res.data.avatarUrl });
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    setOpen(false);
    try {
      await deleteAvatar();
      updateUser({ avatarUrl: null });
    } catch (err) {
      console.error('Avatar remove failed', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-200 bg-green-50 overflow-hidden text-xs font-bold text-green-700 hover:border-green-400 transition focus:outline-none"
        title="Profile photo"
      >
        {uploading ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        ) : user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
        {/* camera badge */}
        {!uploading && (
          <span className="absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-green-600 border border-white">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 text-sm">
            <button
              onClick={() => { setOpen(false); fileRef.current?.click(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload photo
            </button>
            {user?.avatarUrl && (
              <button
                onClick={handleRemove}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove photo
              </button>
            )}
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function DashboardPage({ title, subtitle, children }) {
  const { user, logout, updateUser } = useAuth();
  const meta = roleMeta[user?.role] || { label: user?.role, cls: 'bg-gray-100 text-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size={30} />
            <span className="hidden font-bold text-gray-800 sm:block">MediCare</span>
          </Link>

          <div className="flex items-center gap-3 ml-auto">
            {/* Role + name pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="max-w-[130px] truncate text-xs font-medium text-gray-600">{user?.name}</span>
            </div>

            {/* Avatar with upload */}
            <AvatarMenu user={user} updateUser={updateUser} />

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:border-red-300 hover:text-red-500 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-3 text-xs text-gray-300 text-center">
          © 2026 MediCare Hospital System
        </div>
      </footer>
    </div>
  );
}
