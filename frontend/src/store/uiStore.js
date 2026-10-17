import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isMobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ isMobileNavOpen: !s.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),

  activeModal: null,
  openModal: (type, props = {}) => set({ activeModal: { type, props } }),
  closeModal: () => set({ activeModal: null }),

  // Notification system
  notifications: [],
  notificationCount: 0,
  isNotifPanelOpen: false,

  addNotification: (notif) =>
    set((s) => ({
      notifications: [
        { id: Date.now(), time: new Date(), read: false, ...notif },
        ...s.notifications,
      ].slice(0, 30), // keep latest 30
      notificationCount: s.notificationCount + 1,
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      notificationCount: 0,
    })),

  toggleNotifPanel: () =>
    set((s) => ({ isNotifPanelOpen: !s.isNotifPanelOpen })),

  closeNotifPanel: () => set({ isNotifPanelOpen: false }),
}));
