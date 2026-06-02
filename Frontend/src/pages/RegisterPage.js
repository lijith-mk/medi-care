import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../utils/roleRoutes';
import Logo from '../components/Logo';

/* Surgery team illustration */
function RegisterIllustration() {
  return (
    <svg viewBox="0 0 260 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      <ellipse cx="130" cy="285" rx="80" ry="12" fill="#bbf7d0" opacity="0.6" />
      {/* OR lights */}
      <ellipse cx="100" cy="60" rx="30" ry="18" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
      <ellipse cx="160" cy="55" rx="26" ry="16" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="100" y1="78" x2="100" y2="100" stroke="#9ca3af" strokeWidth="2" />
      <line x1="160" y1="71" x2="155" y2="95" stroke="#9ca3af" strokeWidth="2" />
      {/* Operating table */}
      <rect x="55" y="210" width="150" height="16" rx="5" fill="#16a34a" />
      <rect x="70" y="195" width="120" height="20" rx="5" fill="#22c55e" />
      <rect x="55" y="224" width="8" height="30" rx="3" fill="#374151" />
      <rect x="197" y="224" width="8" height="30" rx="3" fill="#374151" />
      {/* Surgeon 1 */}
      <ellipse cx="105" cy="158" rx="14" ry="14" fill="#fde68a" />
      <rect x="93" y="135" width="24" height="8" rx="4" fill="#16a34a" opacity="0.6"/>
      <rect x="91" y="171" width="28" height="38" rx="9" fill="#16a34a" />
      <rect x="82" y="175" width="10" height="22" rx="4" fill="#16a34a" />
      <rect x="109" y="175" width="10" height="22" rx="4" fill="#16a34a" />
      {/* Surgeon 2 */}
      <ellipse cx="155" cy="155" rx="14" ry="14" fill="#fde68a" />
      <rect x="143" y="132" width="24" height="8" rx="4" fill="#16a34a" opacity="0.6"/>
      <rect x="141" y="168" width="28" height="40" rx="9" fill="#15803d" />
      <rect x="132" y="172" width="10" height="22" rx="4" fill="#15803d" />
      <rect x="159" y="172" width="10" height="22" rx="4" fill="#15803d" />
      {/* Masks */}
      <rect x="97" y="162" width="16" height="10" rx="4" fill="#86efac" />
      <rect x="147" y="159" width="16" height="10" rx="4" fill="#86efac" />
      {/* Gloves hint */}
      <ellipse cx="82" cy="198" rx="6" ry="5" fill="#bbf7d0" />
      <ellipse cx="119" cy="198" rx="6" ry="5" fill="#bbf7d0" />
      <ellipse cx="132" cy="195" rx="6" ry="5" fill="#86efac" />
      <ellipse cx="169" cy="195" rx="6" ry="5" fill="#86efac" />
    </svg>
  );
}

function InputIcon({ children }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      {children}
    </span>
  );
}

const iconEmail = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const iconUser = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const iconLock = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const iconPhone = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const inputCls = "w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition";

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

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden flex">
        {/* Form side */}
        <div className="flex-1 p-8 sm:p-10">
          <div className="flex items-center gap-2.5 mb-7">
            <Logo size={34} />
            <span className="text-xl font-bold text-gray-800">Register</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <InputIcon>{iconUser}</InputIcon>
              <input name="name" type="text" placeholder="Full Name" value={form.name} onChange={handleChange} required className={inputCls} />
            </div>

            {/* Email */}
            <div className="relative">
              <InputIcon>{iconEmail}</InputIcon>
              <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className={inputCls} />
            </div>

            {/* Password */}
            <div className="relative">
              <InputIcon>{iconLock}</InputIcon>
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className={inputCls} />
            </div>

            {/* Phone */}
            <div className="relative">
              <InputIcon>{iconPhone}</InputIcon>
              <input name="phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={handleChange} className={inputCls} />
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <InputIcon>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </InputIcon>
                <input name="age" type="number" placeholder="Age" min="1" max="120" value={form.age} onChange={handleChange} className={inputCls} />
              </div>
              <div className="relative">
                <InputIcon>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </InputIcon>
                <select name="gender" value={form.gender} onChange={handleChange} className={inputCls + ' appearance-none'}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
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
                  Creating account…
                </span>
              ) : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Log in</Link>
          </p>

          <p className="mt-6 text-xs text-gray-300 text-center">MediCare Hospital System</p>
        </div>

        {/* Illustration side */}
        <div className="hidden sm:flex w-52 bg-green-50 items-center justify-center border-l border-green-100">
          <RegisterIllustration />
        </div>
      </div>
    </div>
  );
}
