import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import usePageTitle from '../../hooks/usePageTitle';

function SaveFeedback({ mutation }) {
  if (mutation.isPending) return <p className="text-secondary font-label-md flex items-center gap-1"><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Saving...</p>;
  if (mutation.isSuccess) return <p className="text-[#1e8e3e] font-label-md flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">check_circle</span> Saved successfully!</p>;
  if (mutation.isError) return <p className="text-error font-label-md">{mutation.error?.response?.data?.message || 'Save failed. Please try again.'}</p>;
  return null;
}

export default function DoctorSettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: doctorData } = useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => api.get('/doctors/me/profile').then(r => r.data.doctor),
  });

  const profileForm = useForm({
    values: {
      name: user?.name || '',
      phone: user?.phone || '',
      specialization: doctorData?.specialization || '',
      consultationFee: doctorData?.consultationFee || '',
      bio: doctorData?.bio || '',
      yearsOfExperience: doctorData?.yearsOfExperience || '',
    },
  });

  const clinicForm = useForm({
    values: {
      line1: doctorData?.clinicAddress?.line1 || '',
      city: doctorData?.clinicAddress?.city || '',
      state: doctorData?.clinicAddress?.state || '',
      pincode: doctorData?.clinicAddress?.pincode || '',
    },
  });

  const passwordForm = useForm();

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/doctors/me/profile', {
      specialization: data.specialization,
      consultationFee: Number(data.consultationFee),
      bio: data.bio,
      yearsOfExperience: Number(data.yearsOfExperience),
    }),
    onSuccess: () => queryClient.invalidateQueries(['my-doctor-profile']),
  });

  const clinicMutation = useMutation({
    mutationFn: (data) => api.patch('/doctors/me/profile', {
      clinicAddress: { line1: data.line1, city: data.city, state: data.state, pincode: data.pincode },
    }),
    onSuccess: () => queryClient.invalidateQueries(['my-doctor-profile']),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.post('/auth/change-password', data),
    onSuccess: () => passwordForm.reset(),
  });

  const TABS = [
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'clinic', icon: 'local_hospital', label: 'Clinic Info' },
    { id: 'security', icon: 'lock', label: 'Security' },
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">Settings</h2>
        <p className="font-body-md text-body-md text-text-muted">Manage your account preferences and profile information.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="bg-surface-white border border-border-light rounded-lg overflow-hidden">
            <div className="p-6 text-center border-b border-border-light bg-surface-container-lowest">
              <div className="relative w-20 h-20 mx-auto mb-3 group">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-fixed">
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover object-top" />
                    : <div className="w-full h-full flex items-center justify-center font-headline-md text-headline-md text-primary font-bold">{user?.name?.[0]?.toUpperCase()}</div>
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
                        const res = await api.patch('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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
              <p className="font-label-sm text-label-sm text-text-muted">{doctorData?.specialization || 'Doctor'}</p>
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
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Professional Profile</h3>
              <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Full Name','name','text','Dr. Aisha Khan',false],
                    ['Phone Number','phone','tel','+91 98765 43210',false],
                    ['Specialization','specialization','text','Cardiologist',true],
                    ['Consultation Fee (₹)','consultationFee','number','500',true],
                    ['Years of Experience','yearsOfExperience','number','10',true],
                  ].map(([label, name, type, placeholder, editable]) => (
                    <div key={name}>
                      <label className="block font-label-sm text-label-sm text-text-primary mb-1">{label}</label>
                      <input type={type} placeholder={placeholder} {...profileForm.register(name)}
                        readOnly={!editable && name !== 'phone'}
                        className={`w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary ${!editable && name !== 'phone' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-primary mb-1">Bio / About (shown to patients)</label>
                  <textarea rows={4} {...profileForm.register('bio')} placeholder="Describe your expertise and approach to patient care..."
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary resize-none" />
                </div>
                <SaveFeedback mutation={profileMutation} />
                <button type="submit" disabled={profileMutation.isPending}
                  className="px-8 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60">
                  {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Clinic Information</h3>
              <form onSubmit={clinicForm.handleSubmit(d => clinicMutation.mutate(d))} className="space-y-4">
                {[['Address Line 1','line1','Enter clinic address'],['City','city','Mumbai'],['State','state','Maharashtra'],['Pincode','pincode','400001']].map(([l,n,p]) => (
                  <div key={n}>
                    <label className="block font-label-sm text-label-sm text-text-primary mb-1">{l}</label>
                    <input type="text" placeholder={p} {...clinicForm.register(n)}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary" />
                  </div>
                ))}
                <SaveFeedback mutation={clinicMutation} />
                <button type="submit" disabled={clinicMutation.isPending}
                  className="px-8 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60">
                  Save Clinic Info
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-surface-white border border-border-light rounded-lg p-stack-md">
              <h3 className="font-title-lg text-title-lg text-on-surface mb-stack-md border-b border-border-light pb-4">Security Settings</h3>
              <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4 max-w-md">
                {[['Current Password','currentPassword'],['New Password','newPassword'],['Confirm New Password','confirmPassword']].map(([l,n]) => (
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
                {[['New appointment bookings','Notify when a patient books a slot',true],
                  ['Appointment reminders','Reminders 1 hour before each appointment',true],
                  ['Cancellations','When a patient cancels their appointment',true],
                  ['Payment received','When a patient pays online',false]].map(([t,d,def]) => (
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
