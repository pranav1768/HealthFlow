export const NAV_ITEMS_BY_ROLE = {
  patient: [
    { label: 'Dashboard', icon: 'dashboard', to: '/patient/dashboard' },
    { label: 'Find Doctors', icon: 'search', to: '/patient/find-doctors' },
    { label: 'My Appointments', icon: 'calendar_today', to: '/patient/appointments' },
    { label: 'Medical Records', icon: 'description', to: '/patient/records' },
    { label: 'Payments', icon: 'account_balance_wallet', to: '/patient/payments' },
    { label: 'Settings', icon: 'settings', to: '/patient/settings' },
  ],
  doctor: [
    { label: 'Dashboard', icon: 'dashboard', to: '/doctor/dashboard' },
    { label: 'Appointments', icon: 'calendar_today', to: '/doctor/appointments' },
    { label: 'Patients', icon: 'group', to: '/doctor/patients' },
    { label: 'Medical Records', icon: 'description', to: '/doctor/records' },
    { label: 'Schedule', icon: 'event_available', to: '/doctor/schedule' },
    { label: 'Settings', icon: 'settings', to: '/doctor/settings' },
  ],
  admin: [
    { label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' },
    { label: 'Users', icon: 'group', to: '/admin/users' },
    { label: 'Analytics', icon: 'trending_up', to: '/admin/analytics' },
    { label: 'Settings', icon: 'settings', to: '/admin/settings' },
  ],
};
