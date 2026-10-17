import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS_BY_ROLE } from './navConfig';
import api from '../../services/api';
import EmergencyModal from '../shared/EmergencyModal';
import usePageTransition from '../../hooks/usePageTransition';

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function QuickStats({ role, appointments }) {
  const today = new Date().toDateString();

  if (role === 'doctor') {
    const todayAppts = appointments.filter(
      (a) => new Date(a.date).toDateString() === today
    );
    const confirmed = todayAppts.filter((a) => a.status === 'confirmed').length;
    const pending = todayAppts.filter((a) => a.status === 'pending_payment').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;

    return (
      <div className="mx-4 mb-4 rounded-xl bg-surface-container-low border border-border-light overflow-hidden">
        <p className="px-3 pt-3 pb-2 font-label-sm text-label-sm text-text-muted uppercase tracking-widest">Today's Summary</p>
        <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light">
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-primary leading-none">{confirmed}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Confirmed</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-[#f29900] leading-none">{pending}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Pending</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-[#1e8e3e] leading-none">{completed}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Done</span>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'patient') {
    const upcoming = appointments
      .filter((a) => ['confirmed', 'pending_payment'].includes(a.status) && new Date(a.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = upcoming[0];

    return (
      <div className="mx-4 mb-4 rounded-xl bg-surface-container-low border border-border-light p-3">
        <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-widest mb-2">Next Appointment</p>
        {next ? (
          <>
            <p className="font-label-md text-label-md text-primary truncate">
              {next.doctor?.user?.name || 'Doctor'}
            </p>
            <p className="font-label-sm text-label-sm text-text-muted mt-0.5">
              {new Date(next.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {next.timeSlot ? ` · ${next.timeSlot}` : ''}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              {next.status === 'confirmed' ? 'Confirmed' : 'Pending'}
            </span>
          </>
        ) : (
          <p className="font-label-sm text-label-sm text-text-muted italic">No upcoming appointments</p>
        )}
      </div>
    );
  }

  if (role === 'admin') {
    const total = appointments.length;
    const todayAppts = appointments.filter((a) => new Date(a.date).toDateString() === today).length;
    const pending = appointments.filter((a) => a.status === 'pending_payment').length;

    return (
      <div className="mx-4 mb-4 rounded-xl bg-surface-container-low border border-border-light overflow-hidden">
        <p className="px-3 pt-3 pb-2 font-label-sm text-label-sm text-text-muted uppercase tracking-widest">Platform Overview</p>
        <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light">
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-primary leading-none">{total}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Total</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-secondary leading-none">{todayAppts}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Today</span>
          </div>
          <div className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-lg font-bold text-[#f29900] leading-none">{pending}</span>
            <span className="font-label-sm text-label-sm text-text-muted text-center leading-tight">Pending</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SideNavBar() {
  const { user, role, logout } = useAuth();
  const { transitionTo } = usePageTransition();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const items = NAV_ITEMS_BY_ROLE[role] || [];

  const roleLabel =
    role === 'doctor'
      ? user?.specialization || 'Doctor'
      : role === 'admin'
      ? 'Administrator'
      : 'Patient';

  const { data } = useQuery({
    queryKey: ['appointments', 'sidebar', user?._id],
    queryFn: () => api.get('/appointments').then((r) => r.data),
    staleTime: 60 * 1000,
    gcTime: 0,
    enabled: !!user?._id,
  });
  const appointments = data?.appointments || [];

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 bg-surface-white border-r border-light fixed left-0 top-0 overflow-y-auto p-base z-40">

      {/* Logo */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">HealthFlow</h1>
      </div>

      {/* Avatar card with online dot */}
      <div className="flex items-center gap-3 mx-0 px-4 py-4 mb-5 rounded-lg bg-surface-container-low">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center">
            {user?.avatarUrl ? (
              <img className="w-full h-full object-cover" src={user.avatarUrl} alt={user.name} />
            ) : (
              <span className="font-bold text-sm text-primary">{initials(user?.name)}</span>
            )}
          </div>
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#1e8e3e] border-2 border-surface-white" />
        </div>
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-primary truncate">{user?.name}</p>
          <p className="font-label-sm text-label-sm text-text-muted truncate">{roleLabel}</p>
        </div>
        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-[#1e8e3e] bg-[#e6f4ea] px-1.5 py-0.5 rounded-full">
          Online
        </span>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1 px-0 mb-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Quick Stats */}
      <QuickStats role={role} appointments={appointments} />

      {/* Bottom section */}
      <div className="mt-auto pt-4 border-t border-light">
        {role === 'doctor' && (
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="w-full mb-4 px-4 py-2 bg-error text-on-error rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">warning</span>
            Emergency Alert
          </button>
        )}
        <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${isActive ? 'bg-primary-fixed text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`
              }
            >
              <span className="material-symbols-outlined">help</span>
              <span className="font-label-md text-label-md">Help Center</span>
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {logoutOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLogoutOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xs bg-surface-white rounded-2xl shadow-2xl border border-border-light overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: '24px' }}>logout</span>
                </div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">Sign Out</h3>
                <p className="font-body-md text-body-md text-text-muted mb-6">Are you sure you want to sign out of HealthFlow?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setLogoutOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={() => { setLogoutOpen(false); transitionTo('/login'); setTimeout(logout, 50); }}
                    className="flex-1 py-2.5 rounded-xl bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity">
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
