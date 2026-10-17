import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, BarElement,
  ArcElement, LinearScale, CategoryScale, Tooltip, Legend,
} from 'chart.js';
import api from '../../services/api';
import { AnalyticsSkeleton } from '../../components/shared/SkeletonLoaders';
import KPICard from '../../components/shared/KPICard';
import usePageTitle from '../../hooks/usePageTitle';

ChartJS.register(LineElement, PointElement, BarElement, ArcElement, LinearScale, CategoryScale, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AGE_GROUPS = ['0-18', '19-30', '31-45', '46-60', '60+'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function heatColor(load) {
  if (load >= 80) return 'bg-primary opacity-90';
  if (load >= 50) return 'bg-primary opacity-60';
  if (load >= 20) return 'bg-primary-fixed';
  return 'bg-surface-variant';
}

export default function AdminAnalyticsPage() {
  usePageTitle('Analytics');
  const [period, setPeriod] = useState('6m');

  const { data } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => api.get('/admin/analytics', { params: { period } }).then(r => r.data.analytics),
    refetchInterval: 120_000,
  });

  const analytics = data || {};

  const lineData = {
    labels: MONTHS.slice(0, 6),
    datasets: [
      {
        label: 'Scheduled',
        data: [280, 320, 300, 380, 410, 390],
        borderColor: '#28328c',
        backgroundColor: 'rgba(40,50,140,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: 'Completed',
        data: [240, 290, 270, 350, 370, 360],
        borderColor: '#006783',
        backgroundColor: 'rgba(0,103,131,0.06)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const doughnutData = {
    labels: ['Recovered', 'Improved', 'Ongoing', 'Critical'],
    datasets: [{
      data: [52, 28, 14, 6],
      backgroundColor: ['#28328c', '#006783', '#dfe0ff', '#ffdad6'],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: AGE_GROUPS,
    datasets: [{
      label: 'New Patients',
      data: [80, 210, 340, 290, 130],
      backgroundColor: '#28328c',
      borderRadius: 4,
    }],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#EEEEF4' }, ticks: { font: { size: 11 } } },
    },
  };

  if (isLoading) return <AnalyticsSkeleton />;
  return (
    <div className="max-w-container-max mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Platform Analytics</h2>
          <p className="font-body-md text-body-md text-text-muted">Real-time insights into platform performance.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-lg">
            {[['7d','7D'], ['1m','1M'], ['6m','6M'], ['1y','1Y']].map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-3 py-1.5 rounded font-label-sm text-label-sm transition-colors ${
                  period === v ? 'bg-surface-white text-primary shadow-sm font-semibold' : 'text-text-muted hover:text-on-surface'
                }`}>
                {l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-light bg-surface-white hover:bg-surface-container-low transition-colors font-label-md text-label-md text-text-primary">
            <span className="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </header>

      {/* KPI bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
        <KPICard icon="event_available" iconBg="bg-primary-fixed" iconColor="text-primary"
          label="Total Appointments" value={analytics.totalAppointments?.toLocaleString() ?? '—'} trend={12} />
        <KPICard icon="group_add" iconBg="bg-secondary-fixed" iconColor="text-secondary"
          label="Total Patients" value={analytics.totalPatients?.toLocaleString() ?? '—'} trend={8.4} />
        <KPICard icon="hourglass_empty" iconBg="bg-error-container" iconColor="text-on-error-container"
          label="Avg Wait Time" value="14" suffix="min" trend={-2.1} />
        <KPICard icon="verified" iconBg="bg-tertiary-fixed" iconColor="text-on-tertiary-fixed"
          label="Satisfaction" value="4.8" suffix="/5" trend={1.5} />
      </div>

      {/* Charts bento grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Appointment Trends line chart */}
        <div className="col-span-12 lg:col-span-8 glass-card p-stack-md flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface">Appointment Trends</h2>
              <p className="font-body-md text-body-md text-text-muted">Monthly comparison of scheduled vs completed visits</p>
            </div>
            <button className="text-text-muted hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-variant">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="relative" style={{ height: '320px' }}>
            <Line data={lineData} options={chartOpts} />
          </div>
        </div>

        {/* Doughnut — Treatment Outcomes */}
        <div className="col-span-12 lg:col-span-4 glass-card p-stack-md flex flex-col h-[420px]">
          <div className="mb-2">
            <h2 className="font-title-lg text-title-lg text-on-surface">Treatment Outcomes</h2>
            <p className="font-body-md text-body-md text-text-muted">Success rate categorization</p>
          </div>
          <div className="relative flex-1 mt-4" style={{ minHeight: 0 }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="font-bold text-on-surface" style={{ fontSize: '32px' }}>86%</span>
              <span className="font-label-sm text-label-sm text-text-muted">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Bar — Patient Growth by Age */}
        <div className="col-span-12 lg:col-span-6 glass-card p-stack-md flex flex-col h-[400px]">
          <div className="mb-6">
            <h2 className="font-title-lg text-title-lg text-on-surface">Patient Growth by Age</h2>
            <p className="font-body-md text-body-md text-text-muted">New registrations segmented by age group</p>
          </div>
          <div className="relative" style={{ height: '280px' }}>
            <Bar data={barData} options={chartOpts} />
          </div>
        </div>

        {/* Doctor Workload Heatmap */}
        <div className="col-span-12 lg:col-span-6 glass-card p-stack-md flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-title-lg text-title-lg text-on-surface">Doctor Workload Capacity</h2>
              <p className="font-body-md text-body-md text-text-muted">Appointment distribution by day</p>
            </div>
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-text-muted bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-border-light">
              <span>Low</span>
              <div className="w-16 h-2.5 rounded-full bg-gradient-to-r from-surface-variant via-primary-fixed to-primary" />
              <span>High</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-x-auto min-h-0 mt-2">
            <div className="grid grid-cols-6 gap-2 mb-3 ml-20">
              {DAYS.map(d => (
                <div key={d} className="font-label-sm text-label-sm text-text-muted text-center">{d}</div>
              ))}
            </div>
            <div className="flex-1 flex flex-col justify-between gap-2 pb-2">
              {(analytics.topDoctors || [
                { name: 'Dr. Aisha Khan',  loads: [80, 90, 30, 60, 100, 10] },
                { name: 'Dr. Rohan Mehta', loads: [60, 30, 80, 40, 30, 10] },
                { name: 'Dr. Priya Nair',  loads: [30, 50, 70, 90, 80, 30] },
                { name: 'Dr. Arjun Das',   loads: [90, 100, 80, 50, 30, 10] },
              ]).map(row => (
                <div key={row.name} className="flex items-center gap-3">
                  <div className="w-16 font-label-md text-label-md text-on-surface truncate" title={row.name}>
                    {row.name.replace('Dr. ', '')}
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2">
                    {(row.loads || [50,50,50,50,50,50]).map((load, di) => (
                      <div
                        key={di}
                        className={`h-10 rounded-md transition-opacity hover:opacity-100 ${heatColor(load)}`}
                        title={`${load}% Load`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
