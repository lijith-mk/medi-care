import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';
import Logo from '../components/Logo';

/* Nurse with clipboard illustration */
function LoginIllustration() {
  return (
    <svg viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      <ellipse cx="140" cy="280" rx="90" ry="14" fill="#bbf7d0" opacity="0.6" />
      {/* Door / window background */}
      <rect x="60" y="80" width="160" height="180" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
      <rect x="85" y="100" width="50" height="70" rx="4" fill="#bbf7d0" opacity="0.5" />
      <rect x="145" y="100" width="50" height="70" rx="4" fill="#bbf7d0" opacity="0.5" />
      {/* Waiting chairs */}
      <rect x="75" y="210" width="30" height="12" rx="3" fill="#86efac" />
      <rect x="78" y="222" width="6" height="16" rx="2" fill="#86efac" />
      <rect x="97" y="222" width="6" height="16" rx="2" fill="#86efac" />
      <rect x="115" y="210" width="30" height="12" rx="3" fill="#86efac" />
      <rect x="118" y="222" width="6" height="16" rx="2" fill="#86efac" />
      <rect x="137" y="222" width="6" height="16" rx="2" fill="#86efac" />
      {/* Nurse body */}
      <ellipse cx="175" cy="145" rx="18" ry="18" fill="#fde68a" />
      {/* hair */}
      <path d="M158 140 Q165 125 175 128 Q185 125 192 140" fill="#374151" />
      {/* uniform */}
      <rect x="157" y="162" width="36" height="50" rx="10" fill="#16a34a" />
      {/* collar cross */}
      <rect x="171" y="165" width="8" height="2.5" rx="1" fill="white" />
      <rect x="174" y="163" width="2.5" height="7" rx="1" fill="white" />
      {/* Clipboard */}
      <rect x="193" y="170" width="26" height="32" rx="3" fill="white" stroke="#86efac" strokeWidth="1.5" />
      <rect x="200" y="162" width="12" height="6" rx="2" fill="#16a34a" />
      <line x1="197" y1="180" x2="215" y2="180" stroke="#bbf7d0" strokeWidth="1.5" />
      <line x1="197" y1="186" x2="215" y2="186" stroke="#bbf7d0" strokeWidth="1.5" />
      <line x1="197" y1="192" x2="208" y2="192" stroke="#bbf7d0" strokeWidth="1.5" />
      {/* Clock */}
      <circle cx="148" cy="170" r="14" fill="white" stroke="#86efac" strokeWidth="1.5" />
      <line x1="148" y1="161" x2="148" y2="170" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="148" y1="170" x2="154" y2="174" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Legs */}
      <rect x="162" y="208" width="10" height="30" rx="4" fill="#374151" />
      <rect x="178" y="208" width="10" height="30" rx="4" fill="#374151" />
      {/* Shoes */}
      <ellipse cx="167" cy="238" rx="9" ry="5" fill="#1f2937" />
      <ellipse cx="183" cy="238" rx="9" ry="5" fill="#1f2937" />
      {/* stethoscope */}
      <path d="M163 175 Q156 188 164 196" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="164" cy="197" r="3" fill="white" />
    </svg>
  );
}

function InputIcon({ children }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      {children}
    </span>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(form.email, form.password);
      const role = response.data.data.user.role;
      navigate(getRoleHome(role), { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError('Invalid email or password.');
      else if (status === 403) setError(err?.response?.data?.message || 'Your account is disabled.');
      else setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden flex">
        {/* Form side */}
        <div className="flex-1 p-8 sm:p-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <Logo size={34} />
            <span className="text-xl font-bold text-gray-800">Login</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <InputIcon>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </InputIcon>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <InputIcon>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </InputIcon>
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : 'Login'}
            </button>
          </form>

          <p className="mt-5 text-xs text-gray-400 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-semibold hover:underline">Register</Link>
          </p>

          <p className="mt-8 text-xs text-gray-300 text-center">MediCare Hospital System</p>
        </div>

        {/* Illustration side */}
        <div className="hidden sm:flex w-56 bg-green-50 items-center justify-center border-l border-green-100">
          <LoginIllustration />
        </div>
      </div>
    </div>
  );
}
