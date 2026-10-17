import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusPill from '../../components/shared/StatusPill';
import { useSocket } from '../../hooks/useSocket';
import usePageTitle from '../../hooks/usePageTitle';
import { ListSkeleton } from '../../components/shared/SkeletonLoaders';

// ── Upload Records Modal (shown after marking appointment complete) ──────────
function RecordUploadModal({ appointment, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      fd.append('patientId', appointment.patient?._id);
      fd.append('title', data.title);
      fd.append('type', data.type);
      fd.append('description', data.description || '');
      fd.append('appointmentId', appointment._id);
      if (data.attachments?.[0]) fd.append('attachments', data.attachments[0]);
      return api.post('/records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      reset();
      onClose();
    },
  });

  const patientName = appointment?.patient?.user?.name || 'this patient';

  if (isLoading) return <ListSkeleton rows={5} />;
  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="bg-surface-white rounded-xl shadow-2xl w-full max-w-md p-stack-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-title-lg text-title-lg text-primary">Upload Medical Records</h2>
            <p className="font-body-md text-body-md text-text-muted mt-1">Add prescription or reports for <span className="font-semibold">{patientName}</span></p>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-error p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-text-primary mb-1">Record Type *</label>
            <select {...register('type', { required: true })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary">
              <option value="prescription">Prescription</option>
              <option value="diagnosis">Diagnosis / Consultation Note</option>
              <option value="lab_report">Lab Report</option>
              <option value="imaging">Imaging Report</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-text-primary mb-1">Title *</label>
            <input {...register('title', { required: true })} placeholder="e.g. Post-consultation Prescription"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-text-primary mb-1">Notes / Description</label>
            <textarea rows={4} {...register('description')}
              placeholder="Medications prescribed, dosage, follow-up instructions, diagnosis summary..."
              className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary resize-none" />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-text-primary mb-1">Attach File (PDF/image, optional)</label>
            <input type="file" accept="application/pdf,image/*" {...register('attachments')}
              className="w-full font-body-md text-text-muted" />
          </div>

          {mutation.isError && (
            <p className="text-error font-body-md">{mutation.error?.response?.data?.message || 'Upload failed. Please try again.'}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 h-11 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">upload</span>
              {mutation.isPending ? 'Uploading...' : 'Upload Record'}
            </button>
            <button type="button" onClick={onClose}
              className="px-6 h-11 border border-outline-variant text-text-primary rounded-full font-label-md text-label-md hover:bg-surface-container-low">
              Skip
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ActionDropdown({ appt, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { label: 'Mark Completed', icon: 'check_circle', status: 'completed', color: 'text-[#1e8e3e]', show: appt.status === 'confirmed' },
    { label: 'Mark No Show', icon: 'person_off', status: 'no_show', color: 'text-[#f29900]', show: appt.status === 'confirmed' },
    { label: 'Cancel', icon: 'cancel', status: 'cancelled', color: 'text-error', show: ['confirmed','pending_payment'].includes(appt.status) },
  ].filter(a => a.show);

  // Also show "Upload Records" for completed appointments
  const canUpload = appt.status === 'completed';

  if (actions.length === 0 && !canUpload) return null;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="text-text-muted hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, scale:0.95, y:-4 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
            className="absolute right-0 top-8 z-50 bg-surface-white border border-border-light rounded-lg shadow-lg w-52 overflow-hidden">
            {actions.map(a => (
              <button key={a.status} type="button"
                onClick={() => { onAction(appt._id, a.status); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors font-label-md text-label-md ${a.color}`}>
                <span className="material-symbols-outlined text-[18px]">{a.icon}</span>{a.label}
              </button>
            ))}
            {canUpload && (
              <button type="button"
                onClick={() => { onAction(appt._id, 'upload_records'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors font-label-md text-label-md text-primary border-t border-border-light">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>Upload Records
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_FILTERS = [
  { label: 'All Appointments', value: '' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const AVATAR_RING = ['bg-primary-fixed text-primary', 'bg-tertiary-fixed text-tertiary', 'bg-error-container text-error'];

export default function DoctorAppointmentsPage() {
  usePageTitle('Appointments');
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [uploadRecordAppt, setUploadRecordAppt] = useState(null); // appointment to upload records for
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: (_, { status, appt }) => {
      queryClient.invalidateQueries(['appointments']);
      // After marking complete, prompt to upload records
      if (status === 'completed' && appt) setUploadRecordAppt(appt);
    },
  });

  // Live refresh when a patient completes payment and appointment flips to confirmed.
  useSocket({
    'appointment:confirmed': () => {
      queryClient.invalidateQueries(['appointments']);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', activeStatus],
    queryFn: () =>
      api.get('/appointments', { params: { status: activeStatus || undefined } }).then(r => r.data),
  });

  const appointments = data?.appointments || [];
  const filtered = search
    ? appointments.filter(a => {
        const patientName = a.patient?.user?.name || '';
        return patientName.toLowerCase().includes(search.toLowerCase());
      })
    : appointments;

  // Today's stats
  const today = new Date().toDateString();
  const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === today);
  const remaining = todayAppts.filter(a => a.status === 'confirmed').length;
  const nextAppt = todayAppts.find(a => a.status === 'confirmed');

  return (
    <div className="max-w-container-max mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">Appointments</h2>
          <p className="font-body-md text-body-md text-text-muted">Manage your daily schedule and patient visits.</p>
        </div>
        <div className="w-full md:w-96 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-surface-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-body-md font-body-md transition-all"
            placeholder="Search patients, IDs, or procedures..."
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Table */}
        <div className="lg:col-span-8 flex flex-col gap-stack-md">
          {/* Status filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveStatus(f.value)}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                  activeStatus === f.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-white border border-border-light text-text-primary hover:border-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface-white rounded-lg border border-border-light overflow-hidden hover:shadow-[0px_4px_12px_rgba(40,50,140,0.08)] transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-light">
                    <th className="p-4 font-label-sm text-label-sm text-text-muted font-medium uppercase tracking-wider">Time</th>
                    <th className="p-4 font-label-sm text-label-sm text-text-muted font-medium uppercase tracking-wider">Patient Info</th>
                    <th className="p-4 font-label-sm text-label-sm text-text-muted font-medium uppercase tracking-wider">Type</th>
                    <th className="p-4 font-label-sm text-label-sm text-text-muted font-medium uppercase tracking-wider">Status</th>
                    <th className="p-4 font-label-sm text-label-sm text-text-muted font-medium uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center font-body-md text-body-md text-text-muted">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((appt, i) => {
                      const patientName = appt.patient?.user?.name || 'Unknown Patient';
                      const ringClass = AVATAR_RING[i % AVATAR_RING.length];
                      const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show';
                      return (
                        <motion.tr
                          key={appt._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className={`hover:bg-surface-bright transition-colors group ${isCancelled ? 'opacity-70' : ''}`}
                        >
                          <td className="p-4">
                            <p className="font-label-md text-label-md text-on-surface">{formatTime(appt.startTime)}</p>
                            <p className="font-label-sm text-label-sm text-text-muted">{appt.type === 'video' ? 'Video' : 'In-person'}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${ringClass}`}>
                                {initials(patientName)}
                              </div>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface">{patientName}</p>
                                <p className="font-label-sm text-label-sm text-text-muted">
                                  {appt.patient?.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-body-md text-body-md text-on-surface">
                              {appt.reasonForVisit || 'General Consultation'}
                            </p>
                          </td>
                          <td className="p-4">
                            <StatusPill status={appt.status} />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {appt.type === 'video' && appt.status === 'confirmed' && (
                                <button
                                  onClick={() => navigate('/video-consult', {
                                    state: {
                                      appointmentId: appt._id,
                                      doctorName: appt.doctor?.user?.name,
                                      patientName,
                                    }
                                  })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                                >
                                  <span className="material-symbols-outlined icon-fill" style={{ fontSize: '14px' }}>video_camera_front</span>
                                  Start Video
                                </button>
                              )}
                              <ActionDropdown
                                appt={appt}
                                onAction={(id, status) => {
                                  if (status === 'upload_records') {
                                    setUploadRecordAppt(appt);
                                  } else {
                                    actionMutation.mutate({ id, status, appt });
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Side Panel */}
        <div className="lg:col-span-4 flex flex-col gap-stack-md">
          {/* Today's overview stats */}
          <div className="bg-surface-white rounded-lg border border-border-light p-6 hover:shadow-[0px_4px_12px_rgba(40,50,140,0.08)] transition-shadow duration-300">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Today's Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-lg p-4">
                <p className="font-label-sm text-label-sm text-text-muted mb-1">Total</p>
                <p className="font-headline-md text-headline-md text-primary">{todayAppts.length}</p>
              </div>
              <div className="bg-surface-container-low rounded-lg p-4">
                <p className="font-label-sm text-label-sm text-text-muted mb-1">Remaining</p>
                <p className="font-headline-md text-headline-md text-secondary">{remaining}</p>
              </div>
            </div>
          </div>

          {/* Next appointment card */}
          <div className="bg-primary rounded-lg p-6 text-on-primary shadow-[0px_4px_12px_rgba(40,50,140,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white via-transparent to-transparent" />
            <h3 className="font-label-md text-label-md text-on-primary-container mb-4 uppercase tracking-wider">
              Next Appointment
            </h3>
            {nextAppt ? (
              <>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary font-headline-md text-headline-md font-bold">
                    {initials(nextAppt.patient?.user?.name)}
                  </div>
                  <div>
                    <p className="font-title-lg text-title-lg text-white mb-1">
                      {nextAppt.patient?.user?.name}
                    </p>
                    <p className="font-body-md text-body-md text-on-primary-container">
                      {formatTime(nextAppt.startTime)} – {formatTime(nextAppt.endTime)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10 border-t border-on-primary-container/30 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-primary-container">Reason</span>
                    <span className="font-label-sm text-label-sm font-medium text-white">
                      {nextAppt.reasonForVisit || 'Consultation'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-primary-container">Type</span>
                    <span className="font-label-sm text-label-sm font-medium text-white capitalize">
                      {nextAppt.type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button className="w-full mt-6 bg-white text-primary font-label-md text-label-md py-2.5 rounded-full hover:bg-surface-container-low transition-colors relative z-10 flex justify-center items-center gap-2">
                  View Chart
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </>
            ) : (
              <p className="relative z-10 font-body-md text-body-md text-on-primary-container">
                No upcoming appointments today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Record upload modal — appears after marking appointment complete */}
      <AnimatePresence>
        {uploadRecordAppt && (
          <RecordUploadModal
            appointment={uploadRecordAppt}
            onClose={() => setUploadRecordAppt(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
