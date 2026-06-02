// Shared card shell used by all role profile pages
export function ProfileCard({ icon, title, headerBg = 'bg-white', children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${headerBg}`}>
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              {icon}
            </div>
          )}
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white";
export const selectCls = inputCls + ' appearance-none';

// Apply error border when there's a validation error
export const errBorder = (err) => err ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '';
export const fieldCls = (err) => inputCls.replace('border-gray-200', err ? 'border-red-400' : 'border-gray-200');

export function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
    {error}
  </p>;
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function ViewRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-700">{value || <span className="text-gray-300 italic">Not set</span>}</p>
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-gray-100" />;
}

export function Alert({ type, text }) {
  if (!text) return null;
  return (
    <div className={`mb-4 rounded-lg px-4 py-2.5 text-xs border ${
      type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'
    }`}>
      {text}
    </div>
  );
}

export function SaveBar({ saving, onCancel }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" disabled={saving}
        className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <button type="button" onClick={onCancel} disabled={saving}
        className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:border-gray-300 transition">
        Cancel
      </button>
    </div>
  );
}
