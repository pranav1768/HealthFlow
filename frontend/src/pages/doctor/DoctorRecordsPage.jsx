import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { TimelineSkeleton } from '../../components/shared/SkeletonLoaders';
import usePageTitle from '../../hooks/usePageTitle';

const TYPE_CHIP = {
  lab_report:   { bg: 'bg-[#14BEF0]/20',   icon: 'science',           color: 'text-secondary' },
  prescription: { bg: 'bg-tertiary-fixed',  icon: 'medication',        color: 'text-tertiary' },
  diagnosis:    { bg: 'bg-primary-fixed',   icon: 'health_and_safety', color: 'text-primary' },
  imaging:      { bg: 'bg-surface-variant', icon: 'image_search',      color: 'text-on-surface-variant' },
  other:        { bg: 'bg-surface-variant', icon: 'folder',            color: 'text-on-surface-variant' },
};

async function downloadFile(url, fileName) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName || 'record';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

export default function DoctorRecordsPage() {
  usePageTitle('Medical Records');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-records', typeFilter],
    queryFn: () => api.get('/records', { params: { type: typeFilter || undefined } }).then(r => r.data),
  });

  const records = (data?.records || []).filter(r =>
    search
      ? r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.patient?.user?.name?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  if (isLoading) return <TimelineSkeleton rows={4} />;
  return (
    <div className="max-w-container-max mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-stack-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-1">Medical Records</h2>
          <p className="font-body-md text-body-md text-text-muted">Patient records from your consultations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white focus:outline-none focus:border-secondary"
            placeholder="Search by title or patient name..." />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-stack-md">
        {[['', 'All'], ['lab_report', 'Lab Reports'], ['prescription', 'Prescriptions'], ['diagnosis', 'Diagnoses'], ['imaging', 'Imaging']].map(([v, l]) => (
          <button key={v} onClick={() => setTypeFilter(v)}
            className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
              typeFilter === v ? 'bg-primary text-on-primary' : 'bg-surface-white border border-border-light text-text-primary hover:border-secondary'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline-variant">description</span>
          <p className="font-body-lg text-body-lg text-text-muted mt-4">No records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {records.map((rec, i) => {
            const chip = TYPE_CHIP[rec.type] || TYPE_CHIP.other;
            const date = rec.recordDate
              ? new Date(rec.recordDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '';
            const patientName = rec.patient?.user?.name || 'Unknown Patient';
            const patientEmail = rec.patient?.user?.email || '';

            return (
              <motion.div key={rec._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-surface-white border border-border-light rounded-xl p-5 card-hover flex gap-4"
              >
                <div className={`w-12 h-12 rounded-full ${chip.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${chip.color}`}>{chip.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Patient name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>person</span>
                    <p className="font-label-md text-label-md text-primary truncate">{patientName}</p>
                    {patientEmail && (
                      <p className="font-label-sm text-label-sm text-text-muted truncate hidden sm:block">· {patientEmail}</p>
                    )}
                  </div>

                  {/* Title + download */}
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-title-md text-title-md text-on-surface truncate">{rec.title}</p>
                    {rec.attachments?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => downloadFile(rec.attachments[0].url, rec.attachments[0].fileName)}
                        className="text-secondary hover:text-primary ml-2 flex-shrink-0 p-1 rounded-lg hover:bg-surface-container-high transition-colors"
                        title="Download"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </button>
                    )}
                  </div>

                  <p className="font-label-sm text-label-sm text-text-muted mb-2">{date}</p>
                  {rec.description && (
                    <p className="font-body-md text-body-md text-text-muted line-clamp-2">{rec.description}</p>
                  )}
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full ${chip.bg} ${chip.color} font-label-sm text-[10px] uppercase tracking-wider`}>
                    {rec.type?.replace('_', ' ')}
                  </span>
                  {rec.attachments?.length > 1 && (
                    <p className="font-label-sm text-label-sm text-text-muted mt-1">
                      +{rec.attachments.length - 1} more attachment{rec.attachments.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
