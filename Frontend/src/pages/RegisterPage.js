import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: '', gender: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await register(form);
      const role = response.data.data.user.role;
      navigate(getRoleHome(role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Left panel */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-10 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-sm font-black text-slate-950">M</div>
          <span className="text-lg font-semibold text-white">MediCare</span>
        </Link>
        <div>
          <p className="text-sm uppercase tracking-widest text-cyan-400 mb-3">New patient portal</p>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Start managing<br />your health today.
          </h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
            Register as a patient to book appointments, track your medical profile, and stay on top of your health.
          </p>
          <div className="mt-6 space-y-2">
            {['Free to register', 'Book appointments instantly', 'Secure and private'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
                <svg className="w-4 h-4 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© 2026 MediCare. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-xs font-black text-slate-950">M</div>
            <span className="font-semibold text-white">MediCare</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-sm text-slate-400 mb-7">Register to access your patient dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
              <input name="name" type="text" placeholder="John Smith" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
                <input name="phone" type="tel" placeholder="+1 555 000" value={form.phone} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Age</label>
                <input name="age" type="number" placeholder="28" min="1" max="120" value={form.age} onChange={handleChange} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
                <option value="">Select gender…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300" role="alert">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
