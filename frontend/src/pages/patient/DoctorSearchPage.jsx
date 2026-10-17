import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { CardGridSkeleton } from '../../components/shared/SkeletonLoaders';
import usePageTitle from '../../hooks/usePageTitle';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'experience', label: 'Experience — High to Low' },
  { value: 'fee_asc', label: 'Fee — Low to High' },
  { value: 'fee_desc', label: 'Fee — High to Low' },
  { value: 'rating', label: 'Rating — High to Low' },
];

const SPECIALIZATIONS = ['Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'General Physician'];

const FEE_RANGES = [
  { label: 'Free', min: 0, max: 0 },
  { label: '₹1 – ₹500', min: 1, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: '₹1000+', min: 1000, max: Infinity },
];

export default function DoctorSearchPage() {
  usePageTitle('Find Doctors');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [feeRange, setFeeRange] = useState(null); // index into FEE_RANGES or null
  const [sortBy, setSortBy] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, specialization],
    queryFn: () =>
      api.get('/doctors', { params: { search: search || undefined, specialization: specialization || undefined } })
        .then(r => r.data),
    keepPreviousData: true,
  });

  const doctors = useMemo(() => {
    let list = data?.doctors || [];

    // Fee filter (client-side since API doesn't support range)
    if (feeRange !== null) {
      const { min, max } = FEE_RANGES[feeRange];
      list = list.filter(d => d.consultationFee >= min && (max === Infinity || d.consultationFee <= max));
    }

    // Sort
    if (sortBy === 'experience') list = [...list].sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0));
    if (sortBy === 'fee_asc') list = [...list].sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    if (sortBy === 'fee_desc') list = [...list].sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));

    return list;
  }, [data?.doctors, feeRange, sortBy]);

  if (isLoading) return <CardGridSkeleton cols={3} rows={2} />;
  return (
    <div className="max-w-container-max mx-auto">
      {/* Search sub-bar */}
      <div className="bg-surface-white border-b border-light w-full sticky top-0 z-30 py-3 mb-stack-md -mx-margin-mobile px-margin-mobile md:-mx-margin-desktop md:px-margin-desktop">
        <div className="flex w-full bg-surface-white border border-light rounded-lg overflow-hidden focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all">
          <div className="flex-1 flex items-center px-3 relative">
            <span className="material-symbols-outlined text-[20px] text-text-muted mr-2">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm py-2 focus:ring-0 font-body-md"
              placeholder="Search doctors, specializations..."
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb + title */}
      <div className="mb-stack-md">
        <div className="text-label-sm font-label-sm text-text-muted flex items-center gap-2 mb-stack-sm">
          <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/patient/dashboard')}>Home</span>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          <span className="text-text-primary">Find Doctors</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          {isLoading ? 'Searching…' : `${doctors.length} Doctors available`}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mt-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>verified</span>
          Book appointments with minimum wait-time & verified doctor details
        </p>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left sidebar: filters */}
        <aside className="col-span-1 md:col-span-3">
          <div className="bg-surface-white border border-border-light rounded-lg p-stack-md sticky top-32">
            <div className="flex justify-between items-center mb-stack-md">
              <h2 className="font-title-lg text-title-lg text-primary">Filters</h2>
              <button onClick={() => setSpecialization('')} className="font-label-sm text-label-sm text-secondary hover:underline">
                Clear All
              </button>
            </div>

            {/* Specialization filter */}
            <div className="mb-stack-md border-b border-border-light pb-stack-md">
              <h3 className="font-label-md text-label-md text-text-primary mb-3">Specialization</h3>
              <div className="space-y-3">
                {SPECIALIZATIONS.map(s => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="spec"
                      checked={specialization === s}
                      onChange={() => setSpecialization(specialization === s ? '' : s)}
                      className="w-4 h-4 border-outline-variant text-primary-container focus:ring-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fee range filter — now functional */}
            <div className="mb-stack-md">
              <h3 className="font-label-md text-label-md text-text-primary mb-3">Consultation Fee</h3>
              <div className="space-y-3">
                {FEE_RANGES.map((f, i) => (
                  <label key={f.label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={feeRange === i}
                      onChange={() => setFeeRange(feeRange === i ? null : i)}
                      className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container"
                    />
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right: results list */}
        <div className="col-span-1 md:col-span-9 space-y-stack-md">
          {/* Sorting + active filter chip */}
          <div className="flex justify-between items-center pb-4 border-b border-border-light">
            <div className="flex gap-2">
              {specialization && (
                <button
                  onClick={() => setSpecialization('')}
                  className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer hover:bg-secondary/20 transition-colors"
                >
                  {specialization}
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-text-muted">Sort By:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="font-label-md text-label-md text-primary border-none bg-transparent focus:ring-0 cursor-pointer pr-2">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Doctor cards */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-outline-variant">search</span>
              <p className="font-body-lg text-body-lg text-text-muted mt-4">No doctors found.</p>
            </div>
          ) : (
            doctors.map((doc, i) => (
              <DoctorCard key={doc._id} doctor={doc} index={i} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// Gender-matched photos keyed by index position matching the seed order:
// 0=Aisha Khan(F), 1=Rohan Mehta(M), 2=Priya Nair(F), 3=Arjun Rao(M), 4=Sneha Patil(F), 5=Vikram Singh(M)
const DOCTOR_IMGS_BY_GENDER = {
  female: [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=300&h=300&fit=crop&crop=faces&q=80',
  ],
  male: [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=faces&q=80',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=faces&q=80',
  ],
};

// Detect gender from first name
function getDoctorImg(name = '', index = 0) {
  if (name) {
    // Strip "Dr." prefix then check first name
    const firstName = name.replace(/^Dr\.?\s*/i, '').split(' ')[0].toLowerCase();
    const femaleNames = ['aisha', 'priya', 'sneha', 'elena', 'sarah', 'sophia', 'linda', 'maria', 'sarah'];
    const isFemale = femaleNames.includes(firstName);
    const arr = isFemale ? DOCTOR_IMGS_BY_GENDER.female : DOCTOR_IMGS_BY_GENDER.male;
    return arr[index % arr.length];
  }
  return DOCTOR_IMGS_BY_GENDER.male[index % 4];
}

function DoctorCard({ doctor, index }) {
  const navigate = useNavigate();
  const user = doctor.user || {};
  const rating = doctor.rating?.average?.toFixed(1) ?? '—';
  const isVerified = doctor.isVerified;

  function bookAppointment() {
    navigate('/patient/appointments/book', { state: { doctorId: doctor._id, doctor } });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-white border border-border-light rounded-lg p-stack-md hover:shadow-[0px_4px_12px_rgba(40,50,140,0.08)] transition-shadow duration-300 flex flex-col md:flex-row gap-stack-md"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-low mb-2 bg-surface-variant flex items-center justify-center">
          <img
            src={user.avatarUrl || getDoctorImg(user.name, index)}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>
        {isVerified && (
          <div className="flex items-center gap-1 text-[#00875A] font-label-sm text-label-sm bg-[#E3FCEF] px-2 py-1 rounded-sm">
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '14px' }}>verified</span>
            Verified
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary mb-1 hover:text-secondary cursor-pointer transition-colors">
            {user.name || 'Unknown Doctor'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-2">
            {doctor.specialization}
            {doctor.qualifications?.length > 0 && ` • ${doctor.qualifications.join(', ')}`}
          </p>
          <p className="font-body-md text-body-md text-text-muted mb-4">
            {doctor.yearsOfExperience} Years Experience Overall
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>currency_rupee</span>
            <span className="font-label-md text-label-md text-text-primary">₹{doctor.consultationFee}</span>
            <span className="font-body-md text-body-md text-text-muted">Consultation fee at clinic</span>
          </div>
        </div>
        {doctor.qualifications?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {doctor.qualifications.slice(0, 3).map(q => (
              <span key={q} className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-3 py-1 rounded-full border border-secondary/20">
                {q}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col justify-end items-end border-t md:border-t-0 md:border-l border-border-light pt-4 md:pt-0 md:pl-stack-md w-full md:w-64">
        <div className="w-full mb-auto flex flex-col items-end">
          <div className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined icon-fill text-yellow-500" style={{ fontSize: '18px' }}>star</span>
            <span className="font-label-md text-label-md text-text-primary">{rating}</span>
          </div>
          <span className="font-body-md text-body-md text-text-muted">{doctor.rating?.count ?? 0} reviews</span>
        </div>
        <div className="w-full mt-4 flex flex-col gap-3">
          {doctor.isAcceptingAppointments ? (
            <div className="flex items-center gap-2 text-[#00875A] font-label-sm text-label-sm justify-center bg-[#E3FCEF] p-2 rounded">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
              Available
            </div>
          ) : (
            <div className="flex items-center gap-2 text-text-muted font-label-sm text-label-sm justify-center bg-surface-container-low p-2 rounded">
              Not accepting appointments
            </div>
          )}
          <button
            onClick={bookAppointment}
            disabled={!doctor.isAcceptingAppointments}
            className="w-full h-12 bg-primary-container text-on-primary font-label-md text-label-md rounded-full hover:bg-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Book Appointment
          </button>
          <Link
            to={`/patient/doctors/${doctor._id}`}
            className="w-full h-9 bg-surface-white border border-primary text-primary font-label-md text-label-md rounded-full hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
            View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
