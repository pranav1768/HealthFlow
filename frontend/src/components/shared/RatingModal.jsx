import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

function StarButton({ filled, hovered, onClick, onEnter, onLeave }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="p-1 transition-transform hover:scale-110"
    >
      <span
        className={`material-symbols-outlined transition-colors ${filled || hovered ? 'icon-fill text-[#f29900]' : 'text-outline-variant'}`}
        style={{ fontSize: '32px' }}
      >
        star
      </span>
    </button>
  );
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RatingModal({ open, onClose, appointment }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const queryClient = useQueryClient();

  const doctorName = appointment?.doctor?.user?.name || 'Doctor';
  const dateStr = appointment?.date
    ? new Date(appointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const mutation = useMutation({
    mutationFn: () => api.post(`/appointments/${appointment._id}/rate`, { score, review }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['patient-appointments']);
      onClose();
    },
  });

  function handleClose() {
    if (mutation.isPending) return;
    setScore(0); setHover(0); setReview(''); mutation.reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm bg-surface-white rounded-2xl shadow-2xl border border-border-light overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary to-secondary" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">Rate Your Visit</h3>
                  <p className="font-label-sm text-label-sm text-text-muted mt-0.5">
                    {doctorName} · {dateStr}
                  </p>
                </div>
                <button type="button" onClick={handleClose} className="p-1 rounded-lg hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>close</span>
                </button>
              </div>

              {/* Stars */}
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <StarButton
                      key={n}
                      filled={n <= score}
                      hovered={n <= hover && n > score}
                      onClick={() => setScore(n)}
                      onEnter={() => setHover(n)}
                      onLeave={() => setHover(0)}
                    />
                  ))}
                </div>
                <p className={`font-label-md text-label-md transition-colors ${score ? 'text-[#f29900] font-semibold' : 'text-text-muted'}`}>
                  {score ? LABELS[score] : 'Tap to rate'}
                </p>
              </div>

              {/* Review textarea */}
              <div className="mb-5">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                  Write a review <span className="text-text-muted">(optional)</span>
                </label>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Share your experience with this doctor..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
                <p className="text-right font-label-sm text-label-sm text-text-muted mt-1">{review.length}/500</p>
              </div>

              {mutation.isError && (
                <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>error</span>
                  {mutation.error?.response?.data?.message || 'Failed to submit. Try again.'}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={!score || mutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span className={`material-symbols-outlined text-[18px] ${mutation.isPending ? 'animate-spin' : ''}`}>
                    {mutation.isPending ? 'autorenew' : 'star'}
                  </span>
                  {mutation.isPending ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
