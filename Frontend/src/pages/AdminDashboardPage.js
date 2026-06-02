import React, { useEffect, useMemo, useState } from 'react';
import DashboardPage from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { getAdminAppointments, getAdminStats, getAdminUsers, toggleUserStatus } from '../services/adminService';

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

  return (
    <DashboardPage title="Admin Dashboard" subtitle="Monitor users, appointments, and system health.">
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={visibleStats.totalUsers} />
          <StatCard label="Total Patients" value={visibleStats.totalPatients} />
          <StatCard label="Total Doctors" value={visibleStats.totalDoctors} />
          <StatCard label="Total Appointments" value={visibleStats.totalAppointments} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Appointment Status Overview</h2>
              <p className="mt-1 text-sm text-slate-400">Basic operational snapshot.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="Pending" value={visibleStats.appointmentsByStatus?.pending || 0} />
              <MiniStat label="Confirmed" value={visibleStats.appointmentsByStatus?.confirmed || 0} />
              <MiniStat label="Completed" value={visibleStats.appointmentsByStatus?.completed || 0} />
              <MiniStat label="Cancelled" value={visibleStats.appointmentsByStatus?.cancelled || 0} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">User Management</h2>
              <p className="mt-1 text-sm text-slate-400">Enable or disable non-admin accounts.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-slate-300">
                Search
                <input
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setUsersPage(1);
                  }}
                  className="mt-2 w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Search name or email"
                />
              </label>
              <label className="text-sm text-slate-300">
                Filter by role
                <select
                  value={userRoleFilter}
                  onChange={(event) => {
                    setUserRoleFilter(event.target.value);
                    setUsersPage(1);
                  }}
                  className="ml-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role === 'all' ? 'All roles' : role}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={clearUserFilters}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={5}>Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={5}>No users found.</td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user._id || user.id} className="border-b border-slate-800/80">
                    <td className="py-3 pr-4 text-slate-100">{user.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{user.email}</td>
                    <td className="py-3 pr-4 text-slate-300 capitalize">{user.role}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleToggle(user._id || user.id)}
                        disabled={busyUserId === (user._id || user.id) || user.role === 'admin' || currentUserId === (user._id || user.id)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyUserId === (user._id || user.id) ? 'Updating...' : user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={usersPagination.page}
            totalPages={usersPagination.totalPages}
            total={usersPagination.total}
            onPrevious={() => setUsersPage((page) => Math.max(page - 1, 1))}
            onNext={() => setUsersPage((page) => Math.min(page + 1, usersPagination.totalPages))}
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Appointment Monitoring</h2>
              <p className="mt-1 text-sm text-slate-400">Track bookings by status and date range.</p>
            </div>
            <button
              onClick={clearAppointmentFilters}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
              type="button"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm text-slate-300 md:col-span-3">
              Search
              <input
                value={appointmentSearch}
                onChange={(event) => {
                  setAppointmentSearch(event.target.value);
                  setAppointmentsPage(1);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                placeholder="Search patient or doctor"
              />
            </label>

            <label className="text-sm text-slate-300">
              Status
              <select
                value={appointmentStatusFilter}
                onChange={(event) => {
                  setAppointmentStatusFilter(event.target.value);
                  setAppointmentsPage(1);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                {appointmentStatuses.map((status) => (
                  <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              From
              <input
                type="date"
                value={appointmentFrom}
                onChange={(event) => {
                  setAppointmentFrom(event.target.value);
                  setAppointmentsPage(1);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              To
              <input
                type="date"
                value={appointmentTo}
                onChange={(event) => {
                  setAppointmentTo(event.target.value);
                  setAppointmentsPage(1);
                }}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 pr-4 font-medium">Patient</th>
                  <th className="py-3 pr-4 font-medium">Doctor</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={4}>Loading appointments...</td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={4}>No appointments found.</td>
                  </tr>
                ) : appointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b border-slate-800/80">
                    <td className="py-3 pr-4 text-slate-100">{appointment.patient?.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-300">{appointment.doctor?.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-300">{formatDate(appointment.appointmentDate)}</td>
                    <td className="py-3 pr-4 capitalize text-slate-300">{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={appointmentsPagination.page}
            totalPages={appointmentsPagination.totalPages}
            total={appointmentsPagination.total}
            onPrevious={() => setAppointmentsPage((page) => Math.max(page - 1, 1))}
            onNext={() => setAppointmentsPage((page) => Math.min(page + 1, appointmentsPagination.totalPages))}
          />
        </section>
      </div>
    </DashboardPage>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function PaginationBar({ page, totalPages, total, onPrevious, onNext }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-sm text-slate-400">
      <p>
        Showing page <span className="text-slate-100">{page}</span> of <span className="text-slate-100">{totalPages}</span>
        {' '}({total} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
