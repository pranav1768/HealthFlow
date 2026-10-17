import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import StatusPill from '../../components/shared/StatusPill';
import RatingModal from '../../components/shared/RatingModal';
import { ListSkeleton } from '../../components/shared/SkeletonLoaders';
import usePageTitle from '../../hooks/usePageTitle';

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Pending Payment', value: 'pending_payment' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }); }
function formatTime(t) { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }

export default function PatientAppointmentsPage() {
  usePageTitle('My Appointments');
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingAppt, setRatingAppt] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter],
    queryFn: () => api.get('/appointments', { params: { status: statusFilter || undefined } }).then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/status`, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['appointments']),
  });

  const appointments = data?.appointments || [];

  if (isLoading) return <ListSkeleton rows={5} />;
  return (
    <div className="max-w-container-max mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">My Appointments</h2>
          <p className="font-body-md text-body-md text-text-muted">View and manage your consultations.</p>
        </div>
        <Link to="/patient/find-doctors"
          className="bg-primary-container text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:opacity-90 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span> Book New
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-stack-md">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
              statusFilter === f.value ? 'bg-primary text-on-primary' : 'bg-surface-white border border-border-light text-text-primary hover:border-secondary'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline-variant">calendar_today</span>
          <p className="font-body-lg text-body-lg text-text-muted mt-4">No appointments found.</p>
          <Link to="/patient/find-doctors" className="inline-block mt-4 bg-primary-container text-on-primary px-6 py-2 rounded-full font-label-md text-label-md">
            Book Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt, i) => {
            const doctorName = appt.doctor?.user?.name || 'Doctor';
            const canCancel = ['pending_payment', 'confirmed'].includes(appt.status);
            const needsPayment = appt.status === 'pending_payment';
            const canRate = appt.status === 'completed' && !appt.rating?.score;
            const alreadyRated = appt.status === 'completed' && appt.rating?.score;
            const canJoinVideo = appt.status === 'confirmed' && appt.type === 'video';
            return (
              <motion.div key={appt._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-surface-white border border-border-light rounded-lg p-6 card-hover flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center font-label-md text-label-md text-primary flex-shrink-0">
                    {doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{doctorName}</p>
                    <p className="font-body-md text-body-md text-text-muted">{appt.doctor?.specialization}</p>
                    <p className="font-label-sm text-label-sm text-text-muted mt-1">
                      {formatDate(appt.date)} • {formatTime(appt.startTime)} • <span className="capitalize">{appt.type?.replace('_', ' ')}</span>
                    </p>
                    {alreadyRated && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`material-symbols-outlined icon-fill text-[14px] ${n <= appt.rating.score ? 'text-[#f29900]' : 'text-outline-variant'}`}>star</span>
                        ))}
                        <span className="font-label-sm text-label-sm text-text-muted ml-1">Your rating</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={appt.status} />
                  {canJoinVideo && (
                    <button
                      onClick={() => navigate('/video-consult', {
                        state: { appointmentId: appt._id, doctorName, patientName: appt.patient?.user?.name }
                      })}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: '14px' }}>video_camera_front</span>
                      Join Video
                    </button>
                  )}
                  {needsPayment && (
                    <Link to="/patient/payments/select"
                      state={{ appointmentId: appt._id, doctorName, dateLabel: formatDate(appt.date), timeLabel: formatTime(appt.startTime) }}
                      className="px-4 py-1.5 bg-primary-container text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-90">
                      Pay Now
                    </Link>
                  )}
                  {canRate && (
                    <button onClick={() => setRatingAppt(appt)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#fff8e1] text-[#b06000] rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity border border-[#f29900]/30">
                      <span className="material-symbols-outlined icon-fill text-[#f29900]" style={{ fontSize: '14px' }}>star</span>
                      Rate Visit
                    </button>
                  )}
                  {canCancel && (
                    <button onClick={() => cancelMutation.mutate(appt._id)}
                      className="font-label-sm text-label-sm text-text-muted hover:text-error transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <RatingModal
        open={!!ratingAppt}
        onClose={() => setRatingAppt(null)}
        appointment={ratingAppt}
      />
    </div>
  );
}
