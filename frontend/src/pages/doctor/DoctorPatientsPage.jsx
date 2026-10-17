import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { CardGridSkeleton } from '../../components/shared/SkeletonLoaders';
import StatusPill from '../../components/shared/StatusPill';
import usePageTitle from '../../hooks/usePageTitle';

function fmt(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function initials(n = '') { return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
const COLORS = ['bg-primary-fixed text-primary', 'bg-secondary-fixed text-secondary', 'bg-tertiary-fixed text-on-tertiary-fixed', 'bg-error-container text-error'];

export default function DoctorPatientsPage() {
  usePageTitle('My Patients');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | completed

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments-patients'],
    queryFn: () => api.get('/appointments').then(r => r.data),
  });

  const appointments = data?.appointments || [];

  // Build patient map with all their appointments
  const patientMap = {};
  appointments.forEach(a => {
    const id = a.patient?._id;
    if (!id) return;
    if (!patientMap[id]) {
      patientMap[id] = {
        id,
        name: a.patient?.user?.name || 'Patient',
        email: a.patient?.user?.email || '',
        appointments: [],
      };
    }
    patientMap[id].appointments.push(a);
  });

  let patients = Object.values(patientMap).map(p => ({
    ...p,
    total: p.appointments.length,
    completed: p.appointments.filter(a => a.status === 'completed').length,
    lastVisit: p.appointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0],
  }));

  // Filter
  if (filter === 'active') patients = patients.filter(p => p.appointments.some(a => a.status === 'confirmed'));
  if (filter === 'completed') patients = patients.filter(p => p.completed > 0);

  // Search
  if (search) patients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPatients = Object.keys(patientMap).length;
  const totalCompleted = appointments.filter(a => a.status === 'completed').length;
  const activeToday = appointments.filter(a =>
    a.status === 'confirmed' && new Date(a.date).toDateString() === new Date().toDateString()
  ).length;

  if (isLoading) return <CardGridSkeleton cols={3} rows={2} />;
  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">My Patients</h2>
        <p className="font-body-md text-body-md text-text-muted">All patients who have booked appointments with you.</p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-stack-lg">
        {[
          { label: 'Total Patients',     value: totalPatients, icon: 'group',          color: 'text-primary bg-primary-fixed' },
          { label: 'Consultations Done', value: totalCompleted, icon: 'task_alt',       color: 'text-[#1e8e3e] bg-[#e6f4ea]' },
          { label: 'Active Today',       value: activeToday,   icon: 'calendar_today',  color: 'text-secondary bg-secondary-fixed' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-white border border-border-light rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: '20px' }}>{icon}</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{value}</p>
              <p className="font-label-sm text-label-sm text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-stack-md">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-xl font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                filter === v ? 'bg-primary text-on-primary' : 'bg-surface-white border border-border-light text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Patient cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline-variant">group</span>
          <p className="font-body-lg text-body-lg text-text-muted mt-4">
            {search ? `No patients matching "${search}"` : 'No patients yet.'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-3 font-label-md text-label-md text-primary hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {patients.map((patient, i) => (
            <motion.div key={patient.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-surface-white border border-border-light rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                  {initials(patient.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-title-md text-title-md text-on-surface truncate">{patient.name}</p>
                  <p className="font-label-sm text-label-sm text-text-muted truncate">{patient.email}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Total', value: patient.total },
                  { label: 'Done', value: patient.completed },
                  { label: 'Pending', value: patient.total - patient.completed },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-container-low rounded-lg p-2.5 text-center">
                    <p className="font-title-md text-title-md font-bold text-primary">{value}</p>
                    <p className="font-label-sm text-label-sm text-text-muted">{label}</p>
                  </div>
                ))}
              </div>

              {/* Last visit */}
              <div className="border-t border-border-light pt-3 flex justify-between items-center">
                <div>
                  <p className="font-label-sm text-label-sm text-text-muted">Last visit</p>
                  <p className="font-label-md text-label-md text-on-surface">{fmt(patient.lastVisit?.date)}</p>
                </div>
                <StatusPill status={patient.lastVisit?.status} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
