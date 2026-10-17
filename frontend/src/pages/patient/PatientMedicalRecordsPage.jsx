import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { TimelineSkeleton } from '../../components/shared/SkeletonLoaders';
import Modal from '../../components/shared/Modal';
import { useForm } from 'react-hook-form';
import usePageTitle from '../../hooks/usePageTitle';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

const TYPE_FILTERS = [
  { label: 'All Records', value: '' },
  { label: 'Lab Reports', value: 'lab_report' },
  { label: 'Prescriptions', value: 'prescription' },
  { label: 'Consultations', value: 'diagnosis' },
  { label: 'Imaging', value: 'imaging' },
];

const SOURCE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'From Doctors', value: 'doctor' },
  { label: 'My Uploads', value: 'self' },
];

// Icon chip colors per record type — matches the export's three-colour palette
const TYPE_CHIP = {
  lab_report: { bg: 'bg-[#14BEF0]', icon: 'science', badge: 'bg-secondary-container/10 text-secondary' },
  prescription: { bg: 'bg-tertiary-container', icon: 'medication', badge: 'bg-surface-variant text-text-primary' },
  diagnosis: { bg: 'bg-primary-container', icon: 'health_and_safety', badge: 'bg-primary-fixed text-on-primary-fixed' },
  imaging: { bg: 'bg-surface-variant', icon: 'image_search', badge: 'bg-surface-container text-on-surface-variant' },
  vaccination: { bg: 'bg-[#e6f4ea]', icon: 'vaccines', badge: 'bg-[#e6f4ea] text-[#1e8e3e]' },
  other: { bg: 'bg-surface-variant', icon: 'folder', badge: 'bg-surface-variant text-text-primary' },
};

function RecordTimelineItem({ record, index }) {
  const chip = TYPE_CHIP[record.type] || TYPE_CHIP.other;
  const isOdd = index % 2 === 0;
  const dateStr = record.recordDate
    ? new Date(record.recordDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const uploadedByDoctor = record.doctor != null;
  const doctorName = record.doctor?.user?.name;

  async function handleDownload(att) {
    if (!att.url) return;
    try {
      const res = await fetch(att.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = att.fileName || 'attachment';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(att.url, '_blank');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex items-center justify-between md:justify-normal ${isOdd ? 'md:flex-row-reverse' : ''} group mb-8`}
    >
      {/* Timeline dot */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-white ${chip.bg} text-white shrink-0 md:order-1 shadow-sm z-10 absolute left-0 md:left-1/2 -translate-x-1/2`}>
        <span className="material-symbols-outlined text-sm">{chip.icon}</span>
      </div>

      {/* Card */}
      <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] ml-auto pl-4 md:pl-0 ${isOdd ? 'md:pr-8' : 'md:pl-8'}`}>
        <div className="bg-surface-white p-6 rounded-lg card-hover relative">
          {/* Doctor badge — shown when record was uploaded by a doctor */}
          {uploadedByDoctor && (
            <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-primary-fixed rounded-lg w-fit">
              <span className="material-symbols-outlined text-primary text-[14px]">local_hospital</span>
              <span className="font-label-sm text-label-sm text-primary">
                Uploaded by {doctorName || 'Your Doctor'}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-1 rounded-full ${chip.badge} font-label-sm text-[10px] uppercase tracking-wider`}>
                  {record.type?.replace('_', ' ')}
                </span>
                <span className="font-label-sm text-label-sm text-text-muted">{dateStr}</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-text-primary">{record.title}</h3>
              {record.description && (
                <p className="font-body-md text-body-md text-text-muted mt-2 leading-relaxed">{record.description}</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          {record.attachments?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <p className="font-label-sm text-label-sm text-text-muted mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">attach_file</span>
                {record.attachments.length} Attachment{record.attachments.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {record.attachments.map((att, ai) => (
                  <div key={ai} className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        {att.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                      </span>
                      <span className="font-body-md text-body-md text-text-primary truncate">{att.fileName}</span>
                    </div>
                    <button
                      onClick={() => handleDownload(att)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-primary-container text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-90 transition-opacity ml-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UploadRecordModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (k !== 'attachments') fd.append(k, v); });
      if (data.attachments?.[0]) fd.append('attachments', data.attachments[0]);
      return api.post('/records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['records']);
      reset();
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Medical Record">
      <form className="flex flex-col gap-stack-sm" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-text-primary">Title *</label>
          <input required className="px-3 py-2 border border-outline-variant rounded-lg font-body-md" {...register('title')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-text-primary">Type</label>
          <select className="px-3 py-2 border border-outline-variant rounded-lg font-body-md bg-surface-white" {...register('type')}>
            <option value="other">Other</option>
            <option value="lab_report">Lab Report</option>
            <option value="prescription">Prescription</option>
            <option value="diagnosis">Diagnosis / Consultation</option>
            <option value="imaging">Imaging</option>
            <option value="vaccination">Vaccination</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-text-primary">Description</label>
          <textarea rows={3} className="px-3 py-2 border border-outline-variant rounded-lg font-body-md resize-none" {...register('description')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-sm text-label-sm text-text-primary">Attach file (PDF / image, max 10MB)</label>
          <input type="file" accept="application/pdf,image/*" className="font-body-md" {...register('attachments')} />
        </div>
        {mutation.isError && (
          <p className="text-error font-body-md">{mutation.error?.response?.data?.message || 'Upload failed.'}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="w-full h-10 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 disabled:opacity-60 mt-2"
        >
          {mutation.isPending ? 'Uploading…' : 'Save Record'}
        </button>
      </form>
    </Modal>
  );
}

export default function PatientMedicalRecordsPage() {
  usePageTitle('Medical Records');
  const { user } = useAuth();
  const [activeType, setActiveType] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['records', activeType],
    queryFn: () => api.get('/records', { params: { type: activeType || undefined } }).then(r => r.data),
  });

  const records = data?.records || [];
  const filtered = records.filter(r => {
    const matchSearch = search ? r.title.toLowerCase().includes(search.toLowerCase()) : true;
    const matchSource = sourceFilter === 'all' ? true
      : sourceFilter === 'doctor' ? r.doctor != null
      : r.doctor == null; // self
    return matchSearch && matchSource;
  });

  // Mock BP chart data — real app would come from vitals API
  const bpChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [130, 125, 135, 115, 120, 110],
      borderColor: '#006783',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#006783',
      tension: 0.4,
    }],
  };

  if (isLoading) return <TimelineSkeleton rows={4} />;
  return (
    <div className="max-w-container-max mx-auto">
      {/* Page header */}
      <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-text-primary mb-2">
            Medical Records
          </h2>
          <p className="font-body-lg text-body-lg text-text-muted">Your health history, all in one place</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-outline-variant bg-surface-white focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-colors text-body-md font-body-md"
              placeholder="Search records..."
            />
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="bg-primary-container text-on-primary py-2 px-6 rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined">add</span>
            New Record
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Timeline */}
        <div className="lg:col-span-8 space-y-stack-md">
          {/* Source filter */}
          <div className="flex gap-2 mb-3">
            {SOURCE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setSourceFilter(f.value)}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors border ${
                  sourceFilter === f.value ? 'bg-primary text-on-primary border-primary' : 'bg-surface-white border-border-light text-text-primary hover:border-secondary'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveType(f.value)}
                className={`px-4 py-2 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                  activeType === f.value
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-white border border-light text-text-primary hover:bg-surface-container-low'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-outline-variant before:opacity-30 pt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-outline-variant">description</span>
                <p className="font-body-lg text-body-lg text-text-muted mt-4">No records found.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((record, i) => (
                  <RecordTimelineItem key={record._id} record={record} index={i} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-stack-md">
          {/* Patient Snapshot */}
          <div className="bg-surface-white p-6 rounded-xl border border-light shadow-sm">
            <h3 className="font-headline-md text-headline-md text-text-primary mb-4 border-b border-light pb-2">
              Patient Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-label-sm text-label-sm text-text-muted">Blood Type</p>
                <p className="font-title-lg text-title-lg text-text-primary font-bold">—</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-text-muted">Age / Sex</p>
                <p className="font-title-lg text-title-lg text-text-primary font-bold">—</p>
              </div>
            </div>
          </div>

          {/* Allergies & Conditions */}
          <div className="bg-primary-fixed/30 p-6 rounded-xl border border-primary-fixed">
            <h3 className="font-label-md text-label-md text-on-primary-fixed uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span> Important
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-label-sm text-label-sm text-text-muted mb-2">Known Allergies</p>
                <div className="flex flex-wrap gap-2">
                  <span className="font-body-md text-body-md text-text-muted italic">None on file</span>
                </div>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-text-muted mb-2">Chronic Conditions</p>
                <div className="flex flex-wrap gap-2">
                  <span className="font-body-md text-body-md text-text-muted italic">None on file</span>
                </div>
              </div>
            </div>
          </div>

          {/* BP Trend Chart */}
          <div className="bg-surface-white p-6 rounded-xl border border-light shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-label-md text-label-md text-text-primary font-semibold">Blood Pressure Trend</h3>
              <span className="font-label-sm text-label-sm text-text-muted">Last 6 months</span>
            </div>
            <div className="h-32 chart-container">
              <Line
                data={bpChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: '#EEEEF4' }, ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <UploadRecordModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
