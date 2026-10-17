import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusPill from '../../components/shared/StatusPill';
import { useSocket } from '../../hooks/useSocket';
import DashboardSkeleton from '../../components/shared/DashboardSkeleton';
import usePageTitle from '../../hooks/usePageTitle';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function initials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }); }

const AVATAR_COLORS = [
  'bg-primary-fixed text-primary',
  'bg-secondary-fixed text-secondary',
  'bg-[#e6f4ea] text-[#1e8e3e]',
  'bg-error-container text-error',
];

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DoctorDashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useSocket({
    'appointment:confirmed': () => queryClient.invalidateQueries(['appointments']),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments').then(r => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/status`, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries(['appointments']),
  });

  const appointments = data?.appointments || [];
  const today = new Date().toDateString();
  const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === today);
  const queue = appointments.filter(a => a.status === 'confirmed').slice(0, 4);
  const totalToday = todayAppts.length;
  const confirmedToday = todayAppts.filter(a => a.status === 'confirmed').length;
  const completedAll = appointments.filter(a => a.status === 'completed').length;
  const pendingPay = appointments.filter(a => a.status === 'pending_payment').length;
  const nextAppt = queue[0] || null;

  // Simulated weekly bar data
  const weeklyData = {
    labels: WEEK_LABELS,
    datasets: [{
      data: [4, 7, 5, 8, 6, 3],
      backgroundColor: (ctx) => {
        const idx = ctx.dataIndex;
        return idx === new Date().getDay() - 1 ? '#28328c' : '#dfe0ff';
      },
      borderRadius: 6,
    }],
  };

  const KPI_CARDS = [
    { label: "Today's Appointments", value: totalToday, sub: `${confirmedToday} confirmed`, icon: 'event_available', gradient: 'from-primary to-primary-container', light: 'bg-primary-fixed text-primary' },
    { label: 'Patients in Queue', value: queue.length, sub: 'Waiting for confirmation', icon: 'group', gradient: 'from-secondary to-[#14BEF0]', light: 'bg-secondary-fixed text-secondary' },
    { label: 'Total Completed', value: completedAll, sub: 'All time', icon: 'task_alt', gradient: 'from-[#1e8e3e] to-[#34A853]', light: 'bg-[#e6f4ea] text-[#1e8e3e]' },
    { label: 'Pending Payment', value: pendingPay, sub: 'Requires attention', icon: 'payments', gradient: 'from-[#f29900] to-[#FBBC05]', light: 'bg-[#fef7e0] text-[#f29900]' },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="max-w-container-max mx-auto space-y-6">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[180px] flex items-end">
        <img src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1200&q=80" alt=""
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        <div className="relative z-10 p-8 w-full flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <p className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-widest mb-1">{greeting}, Doctor</p>
            <h1 className="font-display-lg text-white mb-1" style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700 }}>
              {user?.name}
            </h1>
            <p className="font-body-md text-body-md text-on-primary-container">Here's your clinical overview for today.</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-[18px]">calendar_today</span>
            <span className="font-label-md text-label-md text-white">{fmtDate(new Date())}</span>
          </div>
        </div>
      </div>

      {/* KPI bento row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-surface-white rounded-2xl border border-border-light p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            {/* Decorative gradient strip top */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} rounded-t-2xl`} />
            <div className={`w-10 h-10 rounded-xl ${s.light} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-[20px] icon-fill">{s.icon}</span>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-bold text-on-surface" style={{ fontSize: '32px', lineHeight: 1 }}>{s.value}</p>
            <p className="font-label-sm text-label-sm text-text-muted mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Today's schedule — 8 cols */}
        <div className="lg:col-span-8 space-y-4">

          {/* Next patient hero card */}
          {nextAppt ? (
            <div className="rounded-2xl overflow-hidden relative min-h-[160px] flex items-center">
              <img src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=900&q=80" alt=""
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/60" />
              <div className="relative z-10 p-6 flex items-center gap-6 w-full">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center font-headline-md text-headline-md text-primary font-bold flex-shrink-0 shadow-lg">
                  {initials(nextAppt.patient?.user?.name)}
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-widest mb-1">Next Patient</p>
                  <p className="font-title-lg text-title-lg text-white font-bold">{nextAppt.patient?.user?.name || '—'}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-primary-container">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {fmt12(nextAppt.startTime)} – {fmt12(nextAppt.endTime)}
                    </span>
                    <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-primary-container capitalize">
                      <span className="material-symbols-outlined text-[14px]">
                        {nextAppt.type === 'video' ? 'video_camera_front' : 'local_hospital'}
                      </span>
                      {nextAppt.type?.replace('_', ' ')}
                    </span>
                  </div>
                  {nextAppt.reasonForVisit && (
                    <p className="font-label-sm text-label-sm text-on-primary-container mt-1 opacity-80">
                      Reason: {nextAppt.reasonForVisit}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => completeMutation.mutate(nextAppt._id)}
                  disabled={completeMutation.isPending}
                  className="flex-shrink-0 bg-white text-primary font-label-md text-label-md px-5 py-2.5 rounded-full hover:bg-surface-container-lowest transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  Mark Done
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-container-lowest border border-border-light p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant">event_available</span>
              <p className="font-body-md text-body-md text-text-muted mt-2">No confirmed appointments today.</p>
            </div>
          )}

          {/* Today's full schedule list */}
          <div className="bg-surface-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">Today's Schedule</h3>
                {totalToday > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-[11px]">
                    {totalToday}
                  </span>
                )}
              </div>
              <Link to="/doctor/appointments" className="font-label-md text-label-md text-secondary hover:text-primary flex items-center gap-1">
                Full Calendar <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            {todayAppts.length === 0 ? (
              <div className="py-10 text-center text-text-muted font-body-md">
                No appointments scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {todayAppts.map((appt, i) => {
                  const name = appt.patient?.user?.name || 'Patient';
                  const isNext = appt._id === nextAppt?._id;
                  return (
                    <motion.div key={appt._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-4 px-6 py-4 hover:bg-surface-bright transition-colors ${isNext ? 'bg-primary-fixed/40' : ''}`}>
                      {isNext && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${AVATAR_COLORS[i % 4]}`}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface">{name}</p>
                        <p className="font-label-sm text-label-sm text-text-muted">
                          {fmt12(appt.startTime)} – {fmt12(appt.endTime)} • {appt.reasonForVisit || 'Consultation'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={appt.status} />
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => completeMutation.mutate(appt._id)}
                            className="text-[#1e8e3e] hover:bg-[#e6f4ea] p-1.5 rounded-full transition-colors"
                            title="Mark complete"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — queue + weekly chart + tasks */}
        <div className="lg:col-span-4 space-y-4">

          {/* Weekly appointment bar chart */}
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-lg text-title-lg text-on-surface">This Week</h3>
              <span className="font-label-sm text-label-sm text-text-muted">Appointments</span>
            </div>
            <div className="h-28">
              <Bar data={weeklyData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: { display: false },
                },
              }} />
            </div>
          </div>

          {/* Patient queue */}
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-title-lg text-title-lg text-on-surface">Patient Queue</h3>
              <span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${queue.length > 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-text-muted'}`}>
                {queue.length} waiting
              </span>
            </div>
            {queue.length === 0 ? (
              <p className="font-body-md text-body-md text-text-muted text-center py-4">No patients in queue.</p>
            ) : (
              <div className="space-y-3">
                {queue.map((appt, i) => (
                  <div key={appt._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${i === 0 ? 'border-primary-fixed bg-primary-fixed/30' : 'border-border-light hover:bg-surface-bright'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${AVATAR_COLORS[i % 4]}`}>
                      {initials(appt.patient?.user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">{appt.patient?.user?.name || 'Patient'}</p>
                      <p className="font-label-sm text-label-sm text-text-muted">{fmt12(appt.startTime)}</p>
                    </div>
                    {i === 0 && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                ))}
              </div>
            )}
            <Link to="/doctor/appointments"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-secondary text-secondary rounded-full font-label-md text-label-md hover:bg-secondary-fixed transition-colors">
              View All Appointments
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'calendar_today', label: 'Schedule', to: '/doctor/schedule', bg: 'bg-primary-fixed', color: 'text-primary' },
                { icon: 'group', label: 'Patients', to: '/doctor/patients', bg: 'bg-secondary-fixed', color: 'text-secondary' },
                { icon: 'description', label: 'Records', to: '/doctor/records', bg: 'bg-[#e6f4ea]', color: 'text-[#1e8e3e]' },
                { icon: 'settings', label: 'Settings', to: '/doctor/settings', bg: 'bg-surface-variant', color: 'text-on-surface-variant' },
              ].map((a, i) => (
                <Link key={i} to={a.to}
                  className={`flex flex-col items-center justify-center p-4 ${a.bg} rounded-xl hover:opacity-80 transition-opacity`}>
                  <span className={`material-symbols-outlined ${a.color} icon-fill mb-1`}>{a.icon}</span>
                  <span className={`font-label-md text-label-md ${a.color}`}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
