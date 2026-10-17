import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusPill from '../../components/shared/StatusPill';
import DashboardSkeleton from '../../components/shared/DashboardSkeleton';
import usePageTitle from '../../hooks/usePageTitle';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const HEALTH_TIPS = [
  { icon: 'local_drink', color: 'text-secondary', bg: 'bg-secondary-fixed', tip: 'Drink 8 glasses of water today' },
  { icon: 'directions_walk', color: 'text-[#1e8e3e]', bg: 'bg-[#e6f4ea]', tip: 'Take a 30-minute walk' },
  { icon: 'bedtime', color: 'text-primary', bg: 'bg-primary-fixed', tip: 'Get 7–8 hours of sleep tonight' },
  { icon: 'self_improvement', color: 'text-[#f29900]', bg: 'bg-[#fef7e0]', tip: 'Practice 10 mins of mindfulness' },
];

const QUICK_ACTIONS = [
  { icon: 'search', bg: 'from-primary to-primary-container', label: 'Find Doctors', sub: 'Browse specialists', to: '/patient/find-doctors' },
  { icon: 'calendar_today', bg: 'from-secondary to-[#14BEF0]', label: 'Appointments', sub: 'View schedule', to: '/patient/appointments' },
  { icon: 'description', bg: 'from-[#1e8e3e] to-[#34A853]', label: 'Medical Records', sub: 'Your health history', to: '/patient/records' },
  { icon: 'account_balance_wallet', bg: 'from-[#f29900] to-[#FBBC05]', label: 'Payments', sub: 'Bills & history', to: '/patient/payments' },
];

export default function PatientDashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const { data: apptData, isLoading } = useQuery({
    queryKey: ['appointments', 'patient'],
    queryFn: () => api.get('/appointments').then(r => r.data),
  });

  const appointments = apptData?.appointments || [];
  const upcoming = appointments.filter(a => a.status === 'confirmed').slice(0, 3);
  const totalAppts = appointments.length;
  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const pendingAppts = appointments.filter(a => a.status === 'pending_payment').length;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="max-w-container-max mx-auto space-y-6">

      {/* Hero greeting banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[200px] flex items-end">
        <img
          src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 p-8 w-full">
          <p className="font-label-md text-label-md text-primary-fixed-dim mb-1 uppercase tracking-widest">
            {greeting}
          </p>
          <h1 className="font-display-lg text-white mb-2" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700 }}>
            {user?.name?.split(' ')[0]}
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container max-w-md">
            Your health dashboard — everything you need at a glance.
          </p>
          {/* Mini stats inside banner */}
          <div className="flex gap-6 mt-4">
            {[
              { label: 'Total Visits', value: totalAppts },
              { label: 'Completed', value: completedAppts },
              { label: 'Pending', value: pendingAppts },
            ].map(s => (
              <div key={s.label}>
                <p className="font-headline-md text-headline-md text-white font-bold">{s.value}</p>
                <p className="font-label-sm text-label-sm text-primary-fixed-dim">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action gradient tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link to={a.to}
              className={`group block rounded-2xl p-5 bg-gradient-to-br ${a.bg} text-white hover:scale-[1.03] hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
              {/* Decorative circle */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/5" />
              <span className="material-symbols-outlined text-[32px] mb-3 block icon-fill opacity-90">{a.icon}</span>
              <p className="font-title-lg text-title-lg font-bold leading-tight">{a.label}</p>
              <p className="font-label-sm text-label-sm opacity-80 mt-0.5">{a.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Main grid — appointments + health tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Upcoming appointments — left 8 cols */}
        <section className="lg:col-span-8">
          <div className="bg-surface-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-light bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface">Upcoming Appointments</h3>
              </div>
              <Link to="/patient/appointments"
                className="font-label-md text-label-md text-secondary hover:text-primary transition-colors flex items-center gap-1">
                View All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">event_busy</span>
                </div>
                <p className="font-title-lg text-title-lg text-on-surface mb-1">No upcoming appointments</p>
                <p className="font-body-md text-body-md text-text-muted mb-5">Book a consultation with a top doctor</p>
                <Link to="/patient/find-doctors"
                  className="bg-primary-container text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  Find a Doctor
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {upcoming.map((appt, i) => {
                  const doctorName = appt.doctor?.user?.name || 'Doctor';
                  const spec = appt.doctor?.specialization || '';
                  const avatarColors = ['bg-primary-fixed text-primary', 'bg-secondary-fixed text-secondary', 'bg-[#e6f4ea] text-[#1e8e3e]'];
                  return (
                    <motion.div key={appt._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-surface-bright transition-colors group">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-label-md text-label-md font-bold flex-shrink-0 ${avatarColors[i % 3]}`}>
                        {doctorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface">{doctorName}</p>
                        <p className="font-label-sm text-label-sm text-text-muted">{spec}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 font-label-sm text-label-sm text-text-muted">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            {formatDate(appt.date)}
                          </span>
                          <span className="flex items-center gap-1 font-label-sm text-label-sm text-text-muted">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {formatTime(appt.startTime)}
                          </span>
                        </div>
                      </div>
                      {/* Status + type badge */}
                      <div className="flex flex-col items-end gap-2">
                        <StatusPill status={appt.status} />
                        <span className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-text-muted uppercase tracking-wide">
                          {appt.type === 'video' ? 'Video' : 'In-person'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right column — health tips */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Health tips card */}
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#1e8e3e] icon-fill">health_and_safety</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">Today's Health Tips</h3>
            </div>
            <div className="space-y-3">
              {HEALTH_TIPS.map((tip, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-border-light">
                  <div className={`w-9 h-9 rounded-full ${tip.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[18px] ${tip.color}`}>{tip.icon}</span>
                  </div>
                  <p className="font-body-md text-body-md text-text-primary">{tip.tip}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick book CTA card */}
          <div className="rounded-2xl overflow-hidden relative min-h-[140px] flex items-center">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80" alt=""
              className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary/60" />
            <div className="relative z-10 p-5 w-full">
              <p className="font-label-md text-label-md text-secondary-fixed mb-1">Need a doctor?</p>
              <p className="font-title-lg text-title-lg text-white mb-3">Book in under 2 minutes</p>
              <Link to="/patient/find-doctors"
                className="inline-flex items-center gap-2 bg-white text-secondary font-label-md text-label-md px-4 py-2 rounded-full hover:bg-surface-container-lowest transition-colors">
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                Find Doctors
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
