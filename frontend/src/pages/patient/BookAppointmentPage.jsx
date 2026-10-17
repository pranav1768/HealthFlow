import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import usePageTitle from '../../hooks/usePageTitle';

const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function BookAppointmentPage() {
  usePageTitle('Book Appointment');
  const { state } = useLocation();
  const navigate = useNavigate();
  const { doctorId, doctor } = state || {};
  const doctorName = doctor?.user?.name || 'Doctor';
  const fee = doctor?.consultationFee ?? 0;

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('in_person');

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/appointments', payload).then(r => r.data),
    onSuccess: (data) => {
      navigate('/patient/payments/select', {
        state: {
          appointmentId: data.appointment._id,
          doctorName,
          dateLabel: fmtDate(selectedDate),
          timeLabel: fmt12(selectedTime),
        },
      });
    },
  });

  function handleBook() {
    if (!selectedTime) return;
    const [sh, sm] = selectedTime.split(':').map(Number);
    const end = `${sh}:${String(sm + 30).padStart(2, '0')}`;
    mutation.mutate({
      doctorId,
      date: selectedDate.toISOString(),
      startTime: selectedTime,
      endTime: end,
      reasonForVisit: reason,
      type,
    });
  }

  if (!doctorId) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center py-16">
        <p className="font-body-lg text-body-lg text-text-muted">No doctor selected.</p>
        <button onClick={() => navigate('/patient/find-doctors')}
          className="mt-4 px-6 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md">
          Find a Doctor
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-primary mb-4">
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
        <h2 className="font-headline-md text-headline-md text-text-primary">Book Appointment</h2>
        <p className="font-body-md text-body-md text-text-muted mt-1">with {doctorName} • ₹{fee} consultation fee</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 space-y-stack-md">
          {/* Date picker */}
          <div className="bg-surface-white rounded-lg border border-light p-6">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Select Date</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {dates.map((d, i) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                return (
                  <button key={i} onClick={() => setSelectedDate(d)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg border-2 transition-all font-label-md text-label-md ${
                      isSelected ? 'border-primary-container bg-[#f4f5fa] text-primary font-bold' : 'border-light bg-surface-white text-on-surface hover:border-secondary'
                    }`}>
                    <span className="text-xs font-label-sm">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-xs font-label-sm">{d.toLocaleDateString('en', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="bg-surface-white rounded-lg border border-light p-6">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Select Time</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {TIMES.map(t => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`py-2 px-3 rounded-lg border-2 font-label-md text-label-md transition-all ${
                    selectedTime === t ? 'border-primary-container bg-[#f4f5fa] text-primary font-bold' : 'border-light bg-surface-white text-on-surface hover:border-secondary'
                  }`}>
                  {fmt12(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Visit type + reason */}
          <div className="bg-surface-white rounded-lg border border-light p-6 space-y-4">
            <h3 className="font-title-lg text-title-lg text-on-surface">Visit Details</h3>
            <div className="flex gap-3">
              {[['in_person', 'In-Person', 'local_hospital'], ['video', 'Video Consult', 'video_camera_front']].map(([v, l, icon]) => (
                <button key={v} onClick={() => setType(v)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-label-md text-label-md transition-all ${
                    type === v ? 'border-primary-container bg-[#f4f5fa] text-primary' : 'border-light text-on-surface hover:border-secondary'
                  }`}>
                  <span className="material-symbols-outlined text-[18px]">{icon}</span> {l}
                </button>
              ))}
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-text-primary mb-2">Reason for Visit (optional)</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg font-body-md resize-none focus:outline-none focus:border-secondary"
                placeholder="Describe your symptoms or reason…" />
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-surface-white rounded-lg border border-light p-6 sticky top-24">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4 border-b border-light pb-3">Booking Summary</h3>
            <div className="space-y-3 mb-6">
              {[
                ['Doctor', doctorName],
                ['Date', fmtDate(selectedDate)],
                ['Time', selectedTime ? fmt12(selectedTime) : '—'],
                ['Type', type === 'in_person' ? 'In-Person' : 'Video Consult'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between font-body-md text-body-md">
                  <span className="text-text-muted">{k}</span>
                  <span className="text-on-surface font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-label-md text-label-md border-t border-dashed border-light pt-3">
                <span className="text-text-primary">Consultation Fee</span>
                <span className="text-primary font-bold">₹{fee}</span>
              </div>
            </div>
            {mutation.isError && (
              <p className="text-error font-body-md text-body-md mb-3">{mutation.error?.response?.data?.message || 'Booking failed.'}</p>
            )}
            <button onClick={handleBook} disabled={!selectedTime || mutation.isPending}
              className="w-full h-12 bg-primary-container text-on-primary rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined icon-fill text-[18px]">lock</span>
              {mutation.isPending ? 'Booking…' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
