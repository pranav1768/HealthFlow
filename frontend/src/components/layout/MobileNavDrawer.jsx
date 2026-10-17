import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import usePageTransition from '../../hooks/usePageTransition';
import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../store/uiStore';
import { NAV_ITEMS_BY_ROLE } from './navConfig';

export default function MobileNavDrawer() {
  const { user, role, logout } = useAuth();
  const { transitionTo } = usePageTransition();
  const isOpen = useUIStore((s) => s.isMobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);
  const items = NAV_ITEMS_BY_ROLE[role] || [];
  const [logoutOpen, setLogoutOpen] = useState(false);

  function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-[60] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileNav}
            />
            <motion.nav
              className="fixed left-0 top-0 h-screen w-72 bg-surface-white z-[70] flex flex-col md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-border-light">
                <h1 className="font-headline-md text-headline-md font-bold text-primary">HealthFlow</h1>
                <button type="button" onClick={closeMobileNav} aria-label="Close menu"
                  className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              {/* User card */}
              <div className="flex items-center gap-3 mx-4 mt-4 mb-2 p-3 rounded-xl bg-surface-container-low">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      : <span className="font-bold text-sm text-primary">{initials(user?.name)}</span>
                    }
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#1e8e3e] border-2 border-surface-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">{user?.name}</p>
                  <p className="font-label-sm text-label-sm text-text-muted capitalize">{role}</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold text-[#1e8e3e] bg-[#e6f4ea] px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Online
                </span>
              </div>

              {/* Nav links */}
              <ul className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={closeMobileNav}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary-fixed text-primary font-bold'
                            : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`}>{item.icon}</span>
                          <span className="font-label-md text-label-md">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Bottom section */}
              <div className="px-3 pb-6 pt-2 border-t border-border-light mt-2 space-y-1">
                <NavLink
                  to="/help"
                  onClick={closeMobileNav}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? 'bg-primary-fixed text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`
                  }
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-label-md text-label-md">Help Center</span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => { closeMobileNav(); setTimeout(() => setLogoutOpen(true), 300); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error-container transition-all"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-label-md text-label-md">Sign Out</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {logoutOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 md:hidden">
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
    </>
  );
}
