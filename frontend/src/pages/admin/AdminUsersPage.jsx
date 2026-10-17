import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { TableSkeleton } from '../../components/shared/SkeletonLoaders';
import DataTable from '../../components/shared/DataTable';
import StatusPill from '../../components/shared/StatusPill';
import usePageTitle from '../../hooks/usePageTitle';

export default function AdminUsersPage() {
  usePageTitle('User Management');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => api.get('/admin/users', {
      params: { search: search || undefined, role: role || undefined, page },
    }).then(r => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  const verifyDoctor = useMutation({
    mutationFn: ({ doctorId }) => api.patch(`/admin/doctors/${doctorId}/verify`, {}),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / 20);

  const columns = [
    {
      key: 'name', header: 'Name', render: u => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-label-sm text-label-sm text-primary flex-shrink-0">
            {u.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">{u.name}</p>
            <p className="font-label-sm text-label-sm text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role', render: u => (
        <div className="flex items-center gap-2">
          <span className="capitalize font-label-sm text-label-sm text-on-surface">{u.role}</span>
          {u.role === 'doctor' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wide ${
              u.isVerified
                ? 'bg-[#e6f4ea] text-[#1e8e3e]'
                : 'bg-[#fff3e0] text-[#b06000]'
            }`}>
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                {u.isVerified ? 'verified' : 'pending'}
              </span>
              {u.isVerified ? 'Verified' : 'Unverified'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive', header: 'Status', render: u => (
        <span className={`font-label-sm text-label-sm ${u.isActive ? 'text-[#1e8e3e]' : 'text-text-muted'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt', header: 'Joined', render: u =>
        new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions', header: 'Actions', align: 'right', render: u => (
        <div className="flex items-center justify-end gap-3">
          {/* Verify button — only for unverified doctors */}
          {u.role === 'doctor' && !u.isVerified && u.doctorId && (
            <button
              onClick={() => verifyDoctor.mutate({ doctorId: u.doctorId })}
              disabled={verifyDoctor.isPending}
              className="flex items-center gap-1 font-label-sm text-label-sm text-[#1e8e3e] hover:underline disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
              Verify
            </button>
          )}
          <button
            onClick={() => toggleActive.mutate({ id: u._id, isActive: !u.isActive })}
            disabled={toggleActive.isPending}
            className={`font-label-sm text-label-sm hover:underline disabled:opacity-50 ${u.isActive ? 'text-error' : 'text-secondary'}`}
          >
            {u.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <TableSkeleton rows={6} />;
  return (
    <div className="max-w-container-max mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">User Management</h2>
          <p className="font-body-md text-body-md text-text-muted">Manage platform users, roles and verification.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-secondary"
              placeholder="Search users..."
            />
          </div>
          <select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary"
          >
            <option value="">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

      <DataTable
        columns={columns}
        rows={users}
        emptyMessage={isLoading ? 'Loading...' : 'No users found.'}
      />

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-stack-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg border border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-low disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-4 py-2 font-label-md text-label-md text-text-muted">
            Page {page} of {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-low disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
