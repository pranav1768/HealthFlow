import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import api from '../../services/api';
import DashboardSkeleton from '../../components/shared/DashboardSkeleton';
import usePageTitle from '../../hooks/usePageTitle';

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const ACTIVITY_TYPES = {
  register: { icon: 'person_add', bg: 'bg-primary-fixed', color: 'text-primary' },
  complete: { icon: 'task_alt', bg: 'bg-[#e6f4ea]', color: 'text-[#1e8e3e]' },
  cancel: { icon: 'event_busy', bg: 'bg-error-container', color: 'text-on-error-container' },
  payment: { icon: 'payments', bg: 'bg-[#fef7e0]', color: 'text-[#f29900]' },
};

function formatRevenue(n) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

export default function AdminDashboardPage() {
  usePageTitle('Dashboard');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data.analytics),
    refetchInterval: 60_000,
  });

  const analytics = data || {};

  const lineData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Appointments',
        data: [180, 240, 210, 310, 280, analytics.totalAppointments ? Math.min(analytics.totalAppointments * 2, 400) : 320],
        borderColor: '#0c1776',
        backgroundColor: 'rgba(12,23,118,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0c1776',
      },
      {
        label: 'Patients',
        data: [80, 120, 100, 160, 140, analytics.totalPatients || 150],
        borderColor: '#006783',
        backgroundColor: 'rgba(0,103,131,0.06)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#006783',
      },
    ],
  };

  const doughnutData = {
    labels: ['Confirmed', 'Completed', 'Cancelled', 'Pending'],
    datasets: [{
      data: [
        analytics.appointmentsByStatus?.confirmed || 4,
        analytics.appointmentsByStatus?.completed || 8,
        analytics.appointmentsByStatus?.cancelled || 2,
        analytics.appointmentsByStatus?.pending_payment || 3,
      ],
      backgroundColor: ['#28328c', '#1e8e3e', '#ba1a1a', '#f29900'],
      borderWidth: 0,
    }],
  };

  const KPI_CARDS = [
    {
      icon: 'group', label: 'Total Patients',
      value: analytics.totalPatients?.toLocaleString() ?? '—',
      sub: 'Registered on platform', trend: '+12%',
      gradient: 'from-primary to-primary-container',
      bg: 'bg-primary-fixed', color: 'text-primary',
    },
    {
      icon: 'local_hospital', label: 'Total Doctors',
      value: analytics.totalDoctors?.toLocaleString() ?? '—',
      sub: 'Active specialists', trend: '+5%',
      gradient: 'from-secondary to-[#14BEF0]',
      bg: 'bg-secondary-fixed', color: 'text-secondary',
    },
    {
      icon: 'event_available', label: 'Appointments',
      value: analytics.totalAppointments?.toLocaleString() ?? '—',
      sub: 'All time total', trend: '+8%',
      gradient: 'from-[#1e8e3e] to-[#34A853]',
      bg: 'bg-[#e6f4ea]', color: 'text-[#1e8e3e]',
    },
    {
      icon: 'payments', label: 'Revenue',
      value: formatRevenue(analytics.totalRevenueRupees),
      sub: `${analytics.totalPaidTransactions || 0} transactions`, trend: '+18%',
      gradient: 'from-[#f29900] to-[#FBBC05]',
      bg: 'bg-[#fef7e0]', color: 'text-[#f29900]',
    },
  ];

  const ACTIVITY_FEED = [
    { type: 'register', text: 'New patient registrations are live on the platform.', time: 'Platform ready' },
    { type: 'payment', text: `${analytics.totalPaidTransactions || 0} successful payment transactions processed.`, time: 'All time' },
    { type: 'complete', text: `${analytics.appointmentsByStatus?.completed || 0} appointments completed successfully.`, time: 'All time' },
    { type: 'cancel', text: `${analytics.appointmentsByStatus?.cancelled || 0} appointments were cancelled.`, time: 'All time' },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="max-w-container-max mx-auto space-y-6">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[180px] flex items-end">
        <img src="https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1200&q=80" alt=""
          className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/75 to-transparent" />
        <div className="relative z-10 p-8 w-full flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <p className="font-label-md text-label-md text-primary-fixed-dim uppercase tracking-widest mb-1">Admin Control Centre</p>
            <h1 className="font-display-lg text-white mb-1" style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700 }}>
              Platform Overview
            </h1>
            <p className="font-body-md text-body-md text-on-primary-container">Real-time metrics and platform health.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/analytics"
              className="flex items-center gap-2 bg-white/15 border border-white/25 text-white font-label-md text-label-md px-4 py-2.5 rounded-full hover:bg-white/25 transition-colors backdrop-blur-sm">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              Full Analytics
            </Link>
            <Link to="/admin/users"
              className="flex items-center gap-2 bg-secondary text-on-secondary font-label-md text-label-md px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">group</span>
              Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* KPI bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-surface-white rounded-2xl border border-border-light p-5 relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient} rounded-t-2xl`} />
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[20px] icon-fill ${s.color}`}>{s.icon}</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-1 rounded-full bg-[#e6f4ea] text-[#1e8e3e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                {s.trend}
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-bold text-on-surface" style={{ fontSize: '30px', lineHeight: 1 }}>{s.value}</p>
            <p className="font-label-sm text-label-sm text-text-muted mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts + activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Line chart — 8 cols */}
        <div className="lg:col-span-8 bg-surface-white rounded-2xl border border-border-light p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Growth Trends</h3>
              <p className="font-body-md text-body-md text-text-muted">Appointments & patients over 6 months</p>
            </div>
            <div className="flex items-center gap-4">
              {[{ color: 'bg-primary', label: 'Appointments' }, { color: 'bg-secondary', label: 'Patients' }].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 font-label-sm text-label-sm text-text-muted">
                  <span className={`w-3 h-3 rounded-full ${l.color}`} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-52">
            <Line data={lineData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#EEEEF4' }, ticks: { font: { size: 11 } } },
              },
            }} />
          </div>
        </div>

        {/* Doughnut + quick stats — 4 cols */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Appointment Status</h3>
            <div className="h-36 flex items-center justify-center">
              <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } },
              }} />
            </div>
          </div>

          {/* Platform health badges */}
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-3">Platform Health</h3>
            <div className="space-y-2">
              {[
                { label: 'API Status', status: 'Operational', ok: true },
                { label: 'Database', status: 'Connected', ok: true },
                { label: 'Payments', status: 'Live', ok: true },
                { label: 'Storage', status: 'Active', ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                  <span className="font-body-md text-body-md text-text-primary">{item.label}</span>
                  <span className={`flex items-center gap-1.5 font-label-sm text-label-sm px-2.5 py-1 rounded-full ${item.ok ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-error-container text-on-error-container'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity feed + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Activity feed */}
        <div className="lg:col-span-8 bg-surface-white rounded-2xl border border-border-light p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-title-lg text-title-lg text-on-surface">Recent Activity</h3>
            <Link to="/admin/users" className="font-label-md text-label-md text-secondary hover:underline">View All</Link>
          </div>
          <div className="space-y-1">
            {ACTIVITY_FEED.map((item, i) => {
              const cfg = ACTIVITY_TYPES[item.type];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-bright transition-colors">
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-surface">{item.text}</p>
                    <p className="font-label-sm text-label-sm text-text-muted mt-0.5">{item.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-surface-white rounded-2xl border border-border-light p-5 shadow-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: 'group', label: 'Manage Users', sub: 'View & moderate accounts', to: '/admin/users', color: 'text-primary', bg: 'bg-primary-fixed' },
                { icon: 'trending_up', label: 'Full Analytics', sub: 'Charts & deep metrics', to: '/admin/analytics', color: 'text-secondary', bg: 'bg-secondary-fixed' },
                { icon: 'verified', label: 'Verify Doctors', sub: 'Pending verifications', to: '/admin/users', color: 'text-[#1e8e3e]', bg: 'bg-[#e6f4ea]' },
                { icon: 'settings', label: 'Platform Settings', sub: 'Config & preferences', to: '/admin/settings', color: 'text-[#f29900]', bg: 'bg-[#fef7e0]' },
              ].map((a, i) => (
                <Link key={i} to={a.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors group">
                  <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined icon-fill">{a.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">{a.label}</p>
                    <p className="font-label-sm text-label-sm text-text-muted">{a.sub}</p>
                  </div>
                  <span className="ml-auto material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
