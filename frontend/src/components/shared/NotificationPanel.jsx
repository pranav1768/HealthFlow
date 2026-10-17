import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

const TYPE_CONFIG = {
  appointment_confirmed: { icon: 'event_available', color: 'text-[#1e8e3e]', bg: 'bg-[#e6f4ea]' },
  appointment_cancelled: { icon: 'event_busy', color: 'text-error', bg: 'bg-error-container' },
  new_booking: { icon: 'calendar_today', color: 'text-secondary', bg: 'bg-secondary-fixed' },
  payment_received: { icon: 'payments', color: 'text-primary', bg: 'bg-primary-fixed' },
  info: { icon: 'info', color: 'text-text-muted', bg: 'bg-surface-variant' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function NotificationPanel() {
  const { notifications, notificationCount, isNotifPanelOpen, toggleNotifPanel, closeNotifPanel, markAllRead } = useUIStore();
  const panelRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) closeNotifPanel();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeNotifPanel]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={toggleNotifPanel}
        className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-on-surface-variant text-2xl">
          notifications
        </span>
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white font-bold"
            style={{ fontSize: '10px' }}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isNotifPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 bg-surface-white border border-border-light rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <h3 className="font-title-lg text-title-lg text-primary">Notifications</h3>
              {notifications.some(n => !n.read) && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="font-label-sm text-label-sm text-secondary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border-light">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">notifications_none</span>
                  <p className="font-body-md text-body-md text-text-muted mt-2">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  return (
                    <div
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-surface-bright transition-colors ${!notif.read ? 'bg-primary-fixed/30' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className={`material-symbols-outlined text-[18px] ${cfg.color}`}>{cfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface leading-snug">{notif.title}</p>
                        {notif.body && <p className="font-body-md text-body-md text-text-muted mt-0.5 line-clamp-2">{notif.body}</p>}
                        <p className="font-label-sm text-label-sm text-text-muted mt-1">{timeAgo(notif.time)}</p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
