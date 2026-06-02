import React, { useEffect, useMemo, useState } from 'react';
import DashboardPage from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { createAdminUser, getAdminAppointments, getAdminStats, getAdminUsers, toggleUserStatus } from '../services/adminService';

const roles = ['all', 'patient', 'doctor', 'receptionist', 'lab', 'admin'];
const appointmentStatuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?._id || currentUser?.id;
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [appointmentsPagination, setAppointmentsPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [appointmentFrom, setAppointmentFrom] = useState('');
  const [appointmentTo, setAppointmentTo] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [busyUserId, setBusyUserId] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  // Create user form state
  const emptyForm = { name: '', email: '', password: '', role: 'patient', phone: '', age: '', gender: '' };
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsRes, usersRes, appointmentsRes] = await Promise.all([
          getAdminStats(),
          getAdminUsers({
            role: userRoleFilter === 'all' ? '' : userRoleFilter,
            q: userSearch,
            page: usersPage,
            limit: usersPagination.limit,
          }),
          getAdminAppointments({
            status: appointmentStatusFilter === 'all' ? '' : appointmentStatusFilter,
            from: appointmentFrom || '',
            to: appointmentTo || '',
            q: appointmentSearch,
            page: appointmentsPage,
            limit: appointmentsPagination.limit,
          }),
        ]);

        setStats(statsRes?.data?.stats || null);
        setUsers(usersRes?.data?.users || []);
        setAppointments(appointmentsRes?.data?.appointments || []);
        setUsersPagination((current) => ({ ...current, ...(usersRes?.data?.pagination || {}) }));
        setAppointmentsPagination((current) => ({ ...current, ...(appointmentsRes?.data?.pagination || {}) }));
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [
    userRoleFilter,
    userSearch,
    usersPage,
    appointmentStatusFilter,
    appointmentFrom,
    appointmentTo,
    appointmentSearch,
    appointmentsPage,
    refreshTick,
  ]);

  const visibleStats = useMemo(() => stats || {
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    appointmentsByStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
  }, [stats]);

  const handleToggle = async (userId) => {
    setBusyUserId(userId);
    setError('');
    try {
      await toggleUserStatus(userId);
      setRefreshTick((value) => value + 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update user status.');
    } finally {
      setBusyUserId('');
    }
  };

  const clearAppointmentFilters = () => {
    setAppointmentStatusFilter('all');
    setAppointmentFrom('');
    setAppointmentTo('');
    setAppointmentSearch('');
    setAppointmentsPage(1);
  };

  const clearUserFilters = () => {
    setUserRoleFilter('all');
    setUserSearch('');
    setUsersPage(1);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const res = await createAdminUser(createForm);
      setCreateMessage({ type: 'success', text: `Account created for ${res.data.user.name} (${res.data.user.role}).` });
      setCreateForm(emptyForm);
      setRefreshTick((v) => v + 1); // refresh user list
    } catch (err) {
      setCreateMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to create user.' });
    } finally {
      setCreating(false);
    }
  };

  const inputCls = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition";

  return (
    <DashboardPage title="Admin Dashboard" subtitle="Monitor users, appointments, and system health.">
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Stat cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={visibleStats.totalUsers} accent="border-gray-100 bg-white" />
          <StatCard label="Total Patients" value={visibleStats.totalPatients} accent="border-green-100 bg-green-50" />
          <StatCard label="Total Doctors" value={visibleStats.totalDoctors} accent="border-blue-100 bg-blue-50" />
          <StatCard label="Total Appointments" value={visibleStats.totalAppointments} accent="border-violet-100 bg-violet-50" />
        </section>

        {/* Status overview */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Appointment Status Overview</h2>
              <p className="mt-0.5 text-xs text-gray-400">Operational snapshot across all appointments.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="Pending"   value={visibleStats.appointmentsByStatus?.pending   || 0} cls="border-amber-100 bg-amber-50 text-amber-700" />
              <MiniStat label="Confirmed" value={visibleStats.appointmentsByStatus?.confirmed || 0} cls="border-blue-100 bg-blue-50 text-blue-700" />
              <MiniStat label="Completed" value={visibleStats.appointmentsByStatus?.completed || 0} cls="border-green-100 bg-green-50 text-green-700" />
              <MiniStat label="Cancelled" value={visibleStats.appointmentsByStatus?.cancelled || 0} cls="border-red-100 bg-red-50 text-red-600" />
            </div>
          </div>
        </section>

        {/* Create Staff Account */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-green-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-green-800">Create Staff Account</h2>
              <p className="text-xs text-green-600">Only admins can create doctor, receptionist, lab, and admin accounts.</p>
            </div>
          </div>

          {createMessage && (
            <div className={`mx-5 mt-4 rounded-lg px-4 py-2.5 text-xs border ${
              createMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {createMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text" placeholder="Dr. Jane Smith" required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className={inputCls + ' w-full pl-10'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email" placeholder="jane@hospital.com" required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className={inputCls + ' w-full pl-10'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password" placeholder="Min. 6 characters" required minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className={inputCls + ' w-full pl-10'}
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role</label>
                <select
                  required
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className={inputCls + ' w-full'}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab">Lab Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone <span className="font-normal text-gray-300">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <input
                    type="tel" placeholder="+1 555 000 0000"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className={inputCls + ' w-full pl-10'}
                  />
                </div>
              </div>

              {/* Age (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Age <span className="font-normal text-gray-300">(optional)</span></label>
                <input
                  type="number" placeholder="e.g. 32" min="1" max="120"
                  value={createForm.age}
                  onChange={(e) => setCreateForm({ ...createForm, age: e.target.value })}
                  className={inputCls + ' w-full'}
                />
              </div>

              {/* Gender (optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender <span className="font-normal text-gray-300">(optional)</span></label>
                <select
                  value={createForm.gender}
                  onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                  className={inputCls + ' w-full'}
                >
                  <option value="">Select gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Creating…
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* User management */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">User Management</h2>
              <p className="mt-0.5 text-xs text-gray-400">Enable or disable non-admin accounts.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUsersPage(1); }}
                className={inputCls + ' w-48'}
                placeholder="Search name or email"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUsersPage(1); }}
                className={inputCls}
              >
                {roles.map((r) => <option key={r} value={r}>{r === 'all' ? 'All roles' : r}</option>)}
              </select>
              <button type="button" onClick={clearUserFilters} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Email</th>
                  <th className="pb-3 pr-4 font-semibold">Role</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-6 text-gray-400 text-sm" colSpan={5}>Loading users…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="py-6 text-gray-400 text-sm" colSpan={5}>No users found.</td></tr>
                ) : users.map((user) => (
                  <tr key={user._id || user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">{user.email}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">{user.role}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggle(user._id || user.id)}
                        disabled={busyUserId === (user._id || user.id) || user.role === 'admin' || currentUserId === (user._id || user.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${user.isActive ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
                      >
                        {busyUserId === (user._id || user.id) ? 'Updating…' : user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={usersPagination.page} totalPages={usersPagination.totalPages} total={usersPagination.total}
            onPrevious={() => setUsersPage((p) => Math.max(p - 1, 1))}
            onNext={() => setUsersPage((p) => Math.min(p + 1, usersPagination.totalPages))}
          />
        </section>

        {/* Appointment monitoring */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Appointment Monitoring</h2>
              <p className="mt-0.5 text-xs text-gray-400">Track bookings by status, date range, and keyword.</p>
            </div>
            <button onClick={clearAppointmentFilters} type="button" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
              Clear filters
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3 mb-4">
            <input
              value={appointmentSearch}
              onChange={(e) => { setAppointmentSearch(e.target.value); setAppointmentsPage(1); }}
              className={inputCls + ' md:col-span-3'}
              placeholder="Search patient or doctor name…"
            />
            <select
              value={appointmentStatusFilter}
              onChange={(e) => { setAppointmentStatusFilter(e.target.value); setAppointmentsPage(1); }}
              className={inputCls}
            >
              {appointmentStatuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
            </select>
            <input type="date" value={appointmentFrom} onChange={(e) => { setAppointmentFrom(e.target.value); setAppointmentsPage(1); }} className={inputCls} placeholder="From" />
            <input type="date" value={appointmentTo} onChange={(e) => { setAppointmentTo(e.target.value); setAppointmentsPage(1); }} className={inputCls} placeholder="To" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Patient</th>
                  <th className="pb-3 pr-4 font-semibold">Doctor</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-6 text-gray-400 text-sm" colSpan={4}>Loading appointments…</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td className="py-6 text-gray-400 text-sm" colSpan={4}>No appointments found.</td></tr>
                ) : appointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900">{appointment.patient?.name || '—'}</td>
                    <td className="py-3 pr-4 text-sm text-gray-500">Dr. {appointment.doctor?.name || '—'}</td>
                    <td className="py-3 pr-4 text-xs text-gray-400">{formatDate(appointment.appointmentDate)}</td>
                    <td className="py-3 pr-4"><AppointmentStatusBadge status={appointment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={appointmentsPagination.page} totalPages={appointmentsPagination.totalPages} total={appointmentsPagination.total}
            onPrevious={() => setAppointmentsPage((p) => Math.max(p - 1, 1))}
            onNext={() => setAppointmentsPage((p) => Math.min(p + 1, appointmentsPagination.totalPages))}
          />
        </section>
      </div>
    </DashboardPage>
  );
}

const apptStatusConfig = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-200' },
};

function AppointmentStatusBadge({ status }) {
  const cfg = apptStatusConfig[status] || { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${accent || 'border-gray-100 bg-white'}`}>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, cls }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${cls || 'border-gray-100 bg-gray-50'}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-700">{value}</p>
    </div>
  );
}

function PaginationBar({ page, totalPages, total, onPrevious, onNext }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-400">
      <p>Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span> · {total} total</p>
      <div className="flex gap-2">
        <button type="button" onClick={onPrevious} disabled={page <= 1}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Previous
        </button>
        <button type="button" onClick={onNext} disabled={page >= totalPages}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          Next
        </button>
      </div>
    </div>
  );
}
