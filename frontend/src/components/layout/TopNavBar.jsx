import { useState, useRef, useEffect } from 'react';
import usePageTransition from '../../hooks/usePageTransition';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../store/uiStore';
import NotificationPanel from '../shared/NotificationPanel';

// ─── Role-specific nav menus ──────────────────────────────────────────────────

const NAV_MENUS = {
  patient: [
    {
      label: 'Find Care',
      items: [
        { title: 'Search Doctors',      icon: 'search',           desc: 'Browse verified specialists near you',           to: '/patient/find-doctors' },
        { title: 'Book Appointment',    icon: 'calendar_today',   desc: 'Schedule an in-person or video consultation',    to: '/patient/appointments' },
        { title: 'Medical Records',     icon: 'description',      desc: 'View your prescriptions, lab reports & more',    to: '/patient/records' },
      ],
    },
    {
      label: 'Account',
      items: [
        { title: 'Payments & Billing',  icon: 'account_balance_wallet', desc: 'Invoices, receipts and payment history',   to: '/patient/payments' },
        { title: 'Settings',            icon: 'settings',               desc: 'Profile, notifications and security',      to: '/patient/settings' },
      ],
    },
  ],
  doctor: [
    {
      label: 'Practice',
      items: [
        { title: 'Appointments',        icon: 'calendar_today',   desc: 'View and manage your upcoming schedule',        to: '/doctor/appointments' },
        { title: 'My Patients',         icon: 'group',            desc: 'Patient list and consultation history',         to: '/doctor/patients' },
        { title: 'Medical Records',     icon: 'description',      desc: 'Access patient files and lab reports',          to: '/doctor/records' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { title: 'Schedule & Slots',    icon: 'event_available',  desc: 'Set availability and time-off blocks',          to: '/doctor/schedule' },
        { title: 'Settings',            icon: 'settings',         desc: 'Clinic info, profile and security',             to: '/doctor/settings' },
      ],
    },
  ],
  admin: [
    {
      label: 'Platform',
      items: [
        { title: 'User Management',     icon: 'group',            desc: 'View, verify and moderate all accounts',        to: '/admin/users' },
        { title: 'Analytics',           icon: 'trending_up',      desc: 'Revenue, appointments and growth metrics',      to: '/admin/analytics' },
        { title: 'Platform Settings',   icon: 'settings',         desc: 'System config, security and notifications',     to: '/admin/settings' },
      ],
    },
  ],
};

// ─── Search suggestions per role ─────────────────────────────────────────────

const SEARCH_SUGGESTIONS = {
  patient:  ['Find a Cardiologist', 'Book follow-up', 'Download lab report', 'Pay outstanding bill'],
  doctor:   ["Today's appointments", 'Pending patient records', 'Update availability', 'Emergency contacts'],
  admin:    ['Pending doctor verifications', 'Monthly revenue report', 'New user registrations', 'System health'],
};

// ─── City picker ─────────────────────────────────────────────────────────────

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad'];

function CityPicker() {
  const [city, setCity] = useState('Mumbai');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-border-light hover:bg-surface-container-high transition-colors"
      >
        <span className="material-symbols-outlined text-secondary icon-fill" style={{ fontSize: '15px' }}>location_on</span>
        <span className="font-label-md text-label-md text-on-surface hidden sm:block">{city}</span>
        <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>expand_more</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute top-10 left-0 z-50 w-48 bg-surface-white rounded-xl shadow-2xl border border-border-light overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border-light">
              <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Select City</p>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {CITIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setCity(c); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container-low transition-colors ${c === city ? 'text-primary font-semibold' : 'text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[13px]">{c === city ? 'location_on' : 'radio_button_unchecked'}</span>
                  <span className="font-body-md text-body-md">{c}</span>
                  {c === city && <span className="ml-auto material-symbols-outlined text-primary text-[13px]">check</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────

function DropdownMenu({ group, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.14 }}
      className="absolute top-full mt-2 left-0 z-50 w-72 bg-surface-white border border-border-light rounded-2xl shadow-2xl overflow-hidden"
    >
      <ul className="p-2">
        {group.items.map(item => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClose}
              className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-low transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-white" style={{ fontSize: '17px' }}>{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">{item.title}</p>
                <p className="font-label-sm text-label-sm text-text-muted leading-snug mt-0.5">{item.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Nav menu trigger ─────────────────────────────────────────────────────────

function NavMenuTrigger({ group }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors ${open ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
      >
        {group.label}
        <span className="material-symbols-outlined" style={{ fontSize: '16px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>expand_more</span>
      </button>
      <AnimatePresence>
        {open && <DropdownMenu group={group} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Search dialog ────────────────────────────────────────────────────────────

function SearchDialog({ open, onClose, role }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const suggestions = SEARCH_SUGGESTIONS[role] || [];

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); }
  }, [open]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSuggestion = (s) => {
    // Route based on suggestion keywords
    const lower = s.toLowerCase();
    if (role === 'patient') {
      if (lower.includes('doctor') || lower.includes('find')) navigate('/patient/find-doctors');
      else if (lower.includes('appoint') || lower.includes('book')) navigate('/patient/appointments');
      else if (lower.includes('lab') || lower.includes('record')) navigate('/patient/records');
      else if (lower.includes('pay') || lower.includes('bill')) navigate('/patient/payments');
    } else if (role === 'doctor') {
      if (lower.includes('appoint') || lower.includes('today')) navigate('/doctor/appointments');
      else if (lower.includes('patient') || lower.includes('record')) navigate('/doctor/records');
      else if (lower.includes('avail') || lower.includes('slot')) navigate('/doctor/schedule');
    } else if (role === 'admin') {
      if (lower.includes('verif') || lower.includes('user')) navigate('/admin/users');
      else if (lower.includes('revenue') || lower.includes('report')) navigate('/admin/analytics');
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.16 }}
        className="relative w-full max-w-lg bg-surface-white rounded-2xl shadow-2xl border border-border-light overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-light">
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search appointments, doctors, records..."
            className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface placeholder:text-text-muted outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>close</span>
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border-light font-label-sm text-label-sm text-text-muted">Esc</kbd>
        </div>

        {/* Suggestions */}
        {!query && (
          <div className="p-3">
            <p className="px-2 pb-2 font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Quick Links</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '17px' }}>arrow_forward</span>
                <span className="font-body-md text-body-md text-on-surface">{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state when typing */}
        {query && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-3xl text-outline-variant">search</span>
            <p className="font-body-md text-body-md text-text-muted mt-2">Press Enter to search for "{query}"</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── User avatar dropdown ─────────────────────────────────────────────────────

function UserMenu({ user, role, logout }) {
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { transitionTo } = usePageTransition();
  const ref = useRef(null);

  function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const settingsPath = role === 'doctor' ? '/doctor/settings' : role === 'admin' ? '/admin/settings' : '/patient/settings';

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-container-high transition-colors"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : <span className="font-bold text-xs text-primary">{initials(user?.name)}</span>
            }
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1e8e3e] border-2 border-surface-white" />
        </div>
        <span className="font-label-md text-label-md text-on-surface hidden lg:block max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
        <span className="material-symbols-outlined text-text-muted hidden lg:block" style={{ fontSize: '16px' }}>expand_more</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface-white border border-border-light rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-border-light bg-surface-container-lowest">
              <p className="font-label-md text-label-md text-on-surface truncate">{user?.name}</p>
              <p className="font-label-sm text-label-sm text-text-muted truncate">{user?.email}</p>
            </div>

            <div className="p-1.5">
              <Link
                to={settingsPath}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>settings</span>
                <span className="font-label-md text-label-md text-on-surface">Settings</span>
              </Link>
              <Link
                to="/help"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>help</span>
                <span className="font-label-md text-label-md text-on-surface">Help Center</span>
              </Link>

              <div className="border-t border-border-light mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setLogoutOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-error-container transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>logout</span>
                  <span className="font-label-md text-label-md text-error">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout confirmation modal — inside UserMenu so logoutOpen is in scope */}
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
    </div>
  );
}

// ─── Main TopNavBar ───────────────────────────────────────────────────────────

export default function TopNavBar() {
  const { user, role, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const menus = NAV_MENUS[role] || [];

  // Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface-white/95 backdrop-blur border-b border-border-light">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 gap-4">

          {/* Left — city picker + nav menus */}
          <div className="flex items-center gap-2">
            <CityPicker />

            {/* Dropdown nav menus — hidden on mobile */}
            <div className="hidden md:flex items-center gap-0.5 ml-2">
              {menus.map(group => (
                <NavMenuTrigger key={group.label} group={group} />
              ))}
            </div>
          </div>

          {/* Right — search + notifications + user */}
          <div className="flex items-center gap-1.5">
            {/* Search button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light text-text-muted hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>search</span>
              <span className="font-label-md text-label-md hidden sm:block">Search</span>
              <kbd className="hidden md:flex items-center text-[10px] gap-0.5 px-1.5 py-0.5 rounded border border-border-light font-medium bg-surface-container">⌘K</kbd>
            </button>

            {/* Notification bell */}
            <NotificationPanel />

            {/* User avatar menu */}
            <UserMenu user={user} role={role} logout={logout} />
          </div>
        </div>
      </header>

      {/* Search dialog (portal-like, rendered outside header) */}
      <AnimatePresence>
        {searchOpen && (
          <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} role={role} />
        )}
      </AnimatePresence>
    </>
  );
}
