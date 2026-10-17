import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import usePageTitle from '../../hooks/usePageTitle';

export default function PatientSettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => api.get('/patients/me').then(r => r.data.patient),
  });

  const profileForm = useForm({
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
      gender: profileData?.gender || 'prefer_not_to_say',
    },
  });

  const healthForm = useForm({
    values: {
      bloodGroup: profileData?.bloodGroup || '',
      allergies: profileData?.allergies?.join(', ') || '',
      chronicConditions: profileData?.chronicConditions?.join(', ') || '',
      medications: '',
    },
  });

  const passwordForm = useForm();

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/patients/me', data),
    onSuccess: () => { queryClient.invalidateQueries(['patient-profile']); },
  });

  const healthMutation = useMutation({
    mutationFn: (data) => api.patch('/patients/me', data),
    onSuccess: () => { queryClient.invalidateQueries(['patient-profile']); },
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.patch('/patients/me/password', data),
    onSuccess: () => passwordForm.reset(),
  });

  const TABS = [
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'health', icon: 'favorite', label: 'Health Info' },
    { id: 'security', icon: 'lock', label: 'Security' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  function SaveFeedback({ mutation }) {
    if (mutation.isPending) return <p className="text-secondary font-label-md flex items-center gap-1"><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Saving...</p>;
    if (mutation.isSuccess) return <p className="text-[#1e8e3e] font-label-md flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">check_circle</span> Saved successfully!</p>;
    if (mutation.isError) return <p className="text-error font-label-md">{mutation.error?.response?.data?.message || 'Save failed. Please try again.'}</p>;
    return null;
  }

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">Settings</h2>
        <p className="font-body-md text-body-md text-text-muted">Manage your account and health profile.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="bg-surface-white border border-border-light rounded-lg overflow-hidden">
            <div className="p-6 text-center border-b border-border-light bg-surface-container-lowest">
              <div className="relative w-20 h-20 mx-auto mb-3 group">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary-fixed flex items-center justify-center">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="font-headline-md text-headline-md text-secondary font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>photo_camera</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const form = new FormData();
                      form.append('avatar', file);
                      try {
                        await api.patch('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                        window.location.reload();
                      } catch (err) {
                        alert(err.response?.data?.message || 'Upload failed. Check Supabase keys.');
                      }
                    }}
                  />
                </label>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted mb-1">Hover to change photo</p>
              <p className="font-label-md text-label-md text-on-surface">{user?.name}</p>
              <p className="font-label-sm text-label-sm text-text-muted">Patient</p>
            </div>
            <nav className="p-2">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-label-md text-label-md ${activeTab === t.id ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                  <span className="material-symbols-outlined">{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-9">
          {activeTab === 'profile' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Personal Information</h3>
              <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[['Full Name','name','text','Jane Doe'],['Phone Number','phone','tel','+91 98765 43210'],['Email Address','email','email','you@example.com']].map(([l,n,t,p]) => (
                    <div key={n}>
                      <label className="block font-label-sm text-label-sm text-text-primary mb-1">{l}</label>
                      <input type={t} placeholder={p} {...profileForm.register(n)}
                        className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary" />
                    </div>
                  ))}
                  <div>
                    <label className="block font-label-sm text-label-sm text-text-primary mb-1">Date of Birth</label>
                    <input type="date" {...profileForm.register('dateOfBirth')}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary" />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-text-primary mb-1">Gender</label>
                    <select {...profileForm.register('gender')}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary">
                      <option value="prefer_not_to_say">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <SaveFeedback mutation={profileMutation} />
                <button type="submit" disabled={profileMutation.isPending}
                  className="px-8 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60">
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Health Information</h3>
              <form onSubmit={healthForm.handleSubmit(d => healthMutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-primary mb-1">Blood Group</label>
                  <select {...healthForm.register('bloodGroup')}
                    className="w-full max-w-xs px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary">
                    <option value="">Select Blood Group</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {[['Known Allergies','allergies','e.g. Penicillin, Peanuts (comma separated)'],
                  ['Chronic Conditions','chronicConditions','e.g. Diabetes, Hypertension (comma separated)'],
                  ['Current Medications','medications','e.g. Metformin 500mg']].map(([l,n,p]) => (
                  <div key={n}>
                    <label className="block font-label-sm text-label-sm text-text-primary mb-1">{l}</label>
                    <textarea rows={2} placeholder={p} {...healthForm.register(n)}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary resize-none" />
                  </div>
                ))}
                <SaveFeedback mutation={healthMutation} />
                <button type="submit" disabled={healthMutation.isPending}
                  className="px-8 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60">
                  Save Health Info
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Security</h3>
              <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4 max-w-md">
                {[['Current Password','currentPassword'],['New Password','newPassword'],['Confirm Password','confirmPassword']].map(([l,n]) => (
                  <div key={n}>
                    <label className="block font-label-sm text-label-sm text-text-primary mb-1">{l}</label>
                    <input type="password" placeholder="••••••••" {...passwordForm.register(n, { required: true })}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary" />
                  </div>
                ))}
                <SaveFeedback mutation={passwordMutation} />
                <button type="submit" disabled={passwordMutation.isPending}
                  className="px-8 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60">
                  Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[['Appointment reminders','24 hours before your appointment',true],
                  ['Payment receipts','Email confirmation after payment',true],
                  ['Health tips','Weekly health articles and tips',false],
                  ['Promotional offers','Offers and discounts from HealthFlow',false]].map(([t,d,def]) => (
                  <div key={t} className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
                    <div><p className="font-label-md text-label-md text-on-surface">{t}</p><p className="font-body-md text-body-md text-text-muted">{d}</p></div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={def} className="sr-only peer" />
                      <div className="relative w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
