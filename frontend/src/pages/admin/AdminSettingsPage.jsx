import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import usePageTitle from '../../hooks/usePageTitle';

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
      type === 'success' ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-error-container text-error'
    }`}>
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      {msg}
    </div>
  );
}

function PlatformTab({ user }) {
  const [form, setForm] = useState({
    name: user?.name || 'HealthFlow Admin',
    email: user?.email || 'admin@healthflow.app',
    phone: '+91 1800 000 0000',
  });
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const mutation = useMutation({
    mutationFn: () => api.patch('/patients/me', { name: form.name }),
    onSuccess: () => showToast('Settings saved successfully.'),
    onError: () => showToast('Failed to save settings.', 'error'),
  });

  return (
    <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">
        Platform Settings
      </h3>
      <Toast msg={toast?.msg} type={toast?.type} />
      <div className="space-y-4 max-w-md">
        {[
          { label: 'Platform Name', key: 'name', type: 'text' },
          { label: 'Support Email', key: 'email', type: 'email' },
          { label: 'Contact Phone', key: 'phone', type: 'tel' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        ))}
        <div className="pt-2 space-y-0">
          {[
            { label: 'Maintenance Mode', desc: 'Temporarily disable patient bookings', def: false },
            { label: 'Doctor Verification Required', desc: 'New doctors must be verified before accepting appointments', def: true },
          ].map(({ label, desc, def }) => {
            const [checked, setChecked] = useState(def);
            return (
              <div key={label} className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{label}</p>
                  <p className="font-body-md text-body-md text-text-muted">{desc}</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={checked} onChange={() => setChecked(c => !c)} />
                  <div className="relative w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${mutation.isPending ? 'animate-spin' : ''}`}>
            {mutation.isPending ? 'autorenew' : 'save'}
          </span>
          {mutation.isPending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      showToast('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Failed to update password.', 'error'),
  });

  function handleSubmit() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return showToast('Please fill in all fields.', 'error');
    }
    if (form.newPassword.length < 8) {
      return showToast('New password must be at least 8 characters.', 'error');
    }
    if (form.newPassword !== form.confirmPassword) {
      return showToast('New passwords do not match.', 'error');
    }
    mutation.mutate();
  }

  return (
    <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">
        Security Settings
      </h3>
      <Toast msg={toast?.msg} type={toast?.type} />
      <div className="space-y-4 max-w-md">
        {[
          { label: 'Current Password', key: 'currentPassword' },
          { label: 'New Password', key: 'newPassword' },
          { label: 'Confirm New Password', key: 'confirmPassword' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{label}</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${mutation.isPending ? 'animate-spin' : ''}`}>
            {mutation.isPending ? 'autorenew' : 'lock'}
          </span>
          {mutation.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const items = [
    { label: 'New doctor registration', desc: 'When a new doctor signs up', def: true },
    { label: 'Payment issues', desc: 'Failed or disputed transactions', def: true },
    { label: 'System alerts', desc: 'Server errors and downtime', def: true },
    { label: 'Weekly reports', desc: 'Summary of platform activity', def: false },
  ];
  const [checks, setChecks] = useState(items.map(i => i.def));
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">
        Notification Settings
      </h3>
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#e6f4ea] text-[#1e8e3e] text-sm font-medium mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
          Preferences saved.
        </div>
      )}
      <div className="space-y-0 max-w-md mb-6">
        {items.map(({ label, desc }, i) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
            <div>
              <p className="font-label-md text-label-md text-on-surface">{label}</p>
              <p className="font-body-md text-body-md text-text-muted">{desc}</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={checks[i]}
                onChange={() => setChecks(c => c.map((v, j) => j === i ? !v : v))} />
              <div className="relative w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">save</span>
        Save Preferences
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const [tab, setTab] = useState('platform');

  const TABS = [
    { id: 'platform',      icon: 'settings',      label: 'Platform' },
    { id: 'security',      icon: 'lock',           label: 'Security' },
    { id: 'notifications', icon: 'notifications',  label: 'Notifications' },
  ];

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">Admin Settings</h2>
        <p className="font-body-md text-body-md text-text-muted">Configure platform-wide settings and preferences.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="bg-surface-white border border-border-light rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border-light bg-surface-container-lowest text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface">{user?.name || 'HealthFlow Admin'}</p>
              <p className="font-label-sm text-label-sm text-text-muted">Administrator</p>
            </div>
            <nav className="p-2">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-label-md text-label-md transition-colors ${
                    tab === t.id ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}>
                  <span className="material-symbols-outlined">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-9">
          {tab === 'platform'      && <PlatformTab user={user} />}
          {tab === 'security'      && <SecurityTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
