import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import usePageTitle from '../../hooks/usePageTitle';

const UNSPLASH_DOCTOR = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80';
const TIMES = { Morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'], Afternoon: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] };

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function fmtShort(d) { return d.toLocaleDateString('en', { weekday: 'short', day: '2-digit', month: 'short' }); }

export default function DoctorProfilePage() {
  usePageTitle('Doctor Profile');
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(0); // offset from today
  const [selectedTime, setSelectedTime] = useState('');
  const [visitType, setVisitType] = useState('in_person');

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.get(`/doctors/${id}`).then(r => r.data.doctor),
  });

  const doctor = data || {};
  const user = doctor.user || {};
  const dates = Array.from({ length: 5 }, (_, i) => addDays(i));

  function handleBook() {
    if (!selectedTime) return;
    navigate('/patient/appointments/book', {
      state: { doctorId: id, doctor: { ...doctor, user } },
    });
  }

  if (isLoading) return (
    <div className="flex justify-center py-16"><span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span></div>
  );

  return (
    <div className="max-w-container-max mx-auto">
      {/* Back */}
      <div className="mb-stack-md">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:text-secondary transition-colors group">
          <span className="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-label-md text-label-md">Back to Find Doctors</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left: Profile info */}
        <div className="md:col-span-8 flex flex-col gap-stack-md">
          {/* Hero card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-stack-md flex flex-col sm:flex-row gap-stack-md items-start sm:items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-surface-white shadow-md relative">
              <img src={user.avatarUrl || UNSPLASH_DOCTOR} alt={user.name} className="w-full h-full object-cover" />
              {doctor.isVerified && (
                <div className="absolute bottom-0 right-0 bg-primary-container text-on-primary rounded-full w-8 h-8 flex items-center justify-center border-2 border-surface-white">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-headline-lg text-headline-lg text-primary">{user.name}</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-container font-label-sm text-label-sm">
                  <span className="material-symbols-outlined mr-1" style={{ fontSize: '14px' }}>favorite</span>
                  {doctor.specialization}
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-text-primary mb-4">{doctor.qualifications?.join(', ')}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-text-muted gap-2">
                  <span className="material-symbols-outlined">work</span>
                  <span className="font-label-md text-label-md">{doctor.yearsOfExperience}+ Years Experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500 icon-fill">star</span>
                  <span className="font-label-md text-label-md text-secondary font-bold">{doctor.rating?.average?.toFixed(1)}</span>
                  <span className="text-text-muted">({doctor.rating?.count}+ Reviews)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* About & Qualifications */}
          <div className="glass-card rounded-xl p-stack-md">
            <h2 className="font-title-lg text-title-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">info</span> About
            </h2>
            <p className="font-body-md text-body-md text-text-primary leading-relaxed mb-6">
              {doctor.bio || `${user.name} is an experienced ${doctor.specialization} dedicated to providing comprehensive patient care. With ${doctor.yearsOfExperience}+ years of clinical practice, they are committed to delivering personalized treatment plans and the best possible outcomes for their patients.`}
            </p>

            {/* Key stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-surface-container-lowest rounded-lg border border-border-light">
              {[
                { icon: 'work', label: 'Experience', value: `${doctor.yearsOfExperience}+ Years` },
                { icon: 'star', label: 'Rating', value: `${doctor.rating?.average?.toFixed(1) || '—'}/5.0` },
                { icon: 'group', label: 'Patients', value: `${(doctor.rating?.count || 0) * 8}+` },
                { icon: 'currency_rupee', label: 'Consult Fee', value: `₹${doctor.consultationFee}` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <span className={`material-symbols-outlined text-primary mb-1 block`}>{s.icon}</span>
                  <p className="font-label-md text-label-md text-primary font-bold">{s.value}</p>
                  <p className="font-label-sm text-label-sm text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Specialization Tags */}
            <h3 className="font-label-md text-label-md text-primary mb-3">Areas of Expertise</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {[doctor.specialization, ...(doctor.qualifications || [])].filter(Boolean).map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-surface-container-low text-text-primary font-label-sm text-label-sm border border-border-light">
                  {tag}
                </span>
              ))}
            </div>

            {/* Education */}
            <h3 className="font-label-md text-label-md text-primary mb-3">Education & Qualifications</h3>
            <div className="space-y-3 mb-6">
              {(doctor.qualifications || ['MBBS', 'MD']).map((q, i) => (
                <div key={q} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">school</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-primary">{q}</p>
                    <p className="font-body-md text-body-md text-text-muted">
                      {i === 0 ? 'Bachelor of Medicine and Surgery' : i === 1 ? 'Doctor of Medicine' : 'Post-Graduate Certification'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Services Offered */}
            <h3 className="font-label-md text-label-md text-primary mb-3">Services Offered</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {[
                'In-Person Consultation',
                'Video Consultation',
                'Follow-up Consultations',
                'Prescription Management',
                'Medical Record Review',
                'Second Opinion',
              ].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1e8e3e] text-[16px]">check_circle</span>
                  <span className="font-body-md text-body-md text-text-primary">{s}</span>
                </div>
              ))}
            </div>

            {/* Languages */}
            <h3 className="font-label-md text-label-md text-primary mb-3">Languages Spoken</h3>
            <div className="flex flex-wrap gap-2">
              {(doctor.languagesSpoken || ['English']).map(lang => (
                <span key={lang} className="px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Clinic Location */}
          <div className="glass-card rounded-xl p-stack-md">
            <h2 className="font-title-lg text-title-lg text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">location_on</span> Clinic Location
            </h2>
            <div className="border border-border-light rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-label-md text-label-md text-text-primary font-bold">
                  {doctor.clinicAddress?.line1 || 'HealthFlow Clinic'}
                </h3>
                <span className="text-primary font-bold font-label-md text-label-md">₹{doctor.consultationFee} Consultation Fee</span>
              </div>
              <p className="font-body-md text-body-md text-text-muted mb-3">
                {doctor.clinicAddress
                  ? `${doctor.clinicAddress.line1}, ${doctor.clinicAddress.city}, ${doctor.clinicAddress.state} ${doctor.clinicAddress.pincode}`
                  : 'Location details not provided.'}
              </p>
              {/* Static map placeholder */}
              <div className="w-full h-32 bg-surface-container-low rounded-lg mb-4 overflow-hidden relative flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">map</span>
                <span className="absolute bottom-2 right-2 font-label-sm text-label-sm text-text-muted bg-surface-white px-2 py-1 rounded">Map View</span>
              </div>
              <button className="px-4 py-2 bg-surface-white border border-secondary text-secondary rounded-full font-label-md text-label-md hover:bg-secondary hover:text-white transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>directions</span> Get Directions
              </button>
            </div>
          </div>
        </div>

        {/* Right: Booking widget */}
        <div className="md:col-span-4 relative">
          <div className="glass-card rounded-xl p-stack-md sticky top-24 border-t-4 border-t-primary-container">
            <h2 className="font-title-lg text-title-lg text-primary mb-6 text-center">Book an Appointment</h2>

            {/* Visit type toggle */}
            <div className="flex bg-surface-container-low p-1 rounded-full mb-6 relative">
              {[['in_person', 'Clinic Visit'], ['video', 'Video Consult']].map(([v, l]) => (
                <button key={v} onClick={() => setVisitType(v)}
                  className={`flex-1 py-2 text-center font-label-md text-label-md rounded-full transition-all ${visitType === v ? 'bg-surface-white shadow-sm text-primary' : 'text-text-muted'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Date carousel */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-label-md text-label-md text-text-primary">Select Date</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {dates.map((d, i) => (
                  <button key={i} onClick={() => setSelectedDate(i)}
                    className={`flex-shrink-0 snap-start w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all font-label-sm text-label-sm ${
                      selectedDate === i ? 'border-primary-container bg-primary-fixed text-primary font-bold' : 'border-border-light bg-surface-white text-text-primary hover:border-secondary'
                    }`}>
                    <span className="uppercase mb-1">{i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className="font-headline-md text-headline-md font-bold">{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="mb-8">
              <h3 className="font-label-md text-label-md text-text-primary mb-3">Available Slots</h3>
              <div className="space-y-4">
                {Object.entries(TIMES).map(([period, slots]) => (
                  <div key={period}>
                    <h4 className="font-label-sm text-label-sm text-text-muted mb-2 uppercase tracking-wider">{period}</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)}
                          className={`py-2 text-center rounded-md border font-body-md text-body-md text-sm transition-colors ${
                            selectedTime === t ? 'border-primary-container bg-primary-fixed text-primary font-bold' : 'border-border-light bg-surface-white text-text-primary hover:border-secondary'
                          }`}>
                          {fmt12(t)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleBook} disabled={!selectedTime}
              className="w-full h-12 bg-primary-container text-on-primary rounded-full font-label-md text-label-md flex justify-center items-center gap-2 hover:bg-primary transition-colors shadow-md group disabled:opacity-50">
              Confirm Appointment
              <span className="material-symbols-outlined ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <p className="text-center font-body-md text-sm text-text-muted mt-3">You won't be charged yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
