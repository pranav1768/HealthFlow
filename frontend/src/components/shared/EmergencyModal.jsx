import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const EMERGENCY_TYPES = [
  { value: 'cardiac_arrest',      label: 'Cardiac Arrest',       icon: 'favorite',          color: 'text-error bg-error-container' },
  { value: 'respiratory_failure', label: 'Respiratory Failure',  icon: 'air',               color: 'text-error bg-error-container' },
  { value: 'severe_bleeding',     label: 'Severe Bleeding',      icon: 'emergency',         color: 'text-error bg-error-container' },
  { value: 'anaphylaxis',         label: 'Anaphylaxis',          icon: 'vaccines',          color: 'text-[#f29900] bg-[#fff3e0]' },
  { value: 'stroke',              label: 'Stroke',               icon: 'psychology',        color: 'text-error bg-error-container' },
  { value: 'other',               label: 'Other Emergency',      icon: 'warning',           color: 'text-[#f29900] bg-[#fff3e0]' },
];

export default function EmergencyModal({ open, onClose }) {
  const [step, setStep] = useState(1); // 1 = select type, 2 = details, 3 = done
  const [selectedType, setSelectedType] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: (data) => api.post('/emergency/alert', data).then(r => r.data),
    onSuccess: () => setStep(3),
  });

  function handleClose() {
    onClose();
    // Reset after animation out
    setTimeout(() => { setStep(1); setSelectedType(null); setPatientName(''); setNote(''); mutation.reset(); }, 300);
  }

  function handleSend() {
    mutation.mutate({ type: selectedType, patientName, note });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-surface-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Red top bar */}
            <div className="h-1.5 w-full bg-error" />

            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-border-light">
              <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: '22px' }}>emergency</span>
              </div>
              <div>
                <h2 className="font-title-md text-title-md font-bold text-error">Emergency Alert</h2>
                <p className="font-label-sm text-label-sm text-text-muted">This will immediately notify admin staff</p>
              </div>
              <button type="button" onClick={handleClose} className="ml-auto p-1 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* ── Step 1: Select type ── */}
            {step === 1 && (
              <div className="p-6 space-y-4">
                <p className="font-label-md text-label-md text-on-surface-variant">Select emergency type</p>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedType(t.value)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 transition-all text-left ${
                        selectedType === t.value
                          ? 'border-error bg-error-container'
                          : 'border-border-light bg-surface-container-low hover:border-error/40'
                      }`}
                    >
                      <span className={`material-symbols-outlined icon-fill rounded-lg p-1.5 ${t.color}`} style={{ fontSize: '18px' }}>{t.icon}</span>
                      <span className="font-label-md text-label-md text-on-surface leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!selectedType}
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* ── Step 2: Details + confirm ── */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                {/* Selected type chip */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(1)} className="p-1 rounded-lg hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>arrow_back</span>
                  </button>
                  {(() => { const t = EMERGENCY_TYPES.find(t => t.value === selectedType); return (
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${t.color}`}>
                      <span className="material-symbols-outlined icon-fill" style={{ fontSize: '14px' }}>{t.icon}</span>
                      {t.label}
                    </span>
                  ); })()}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">Patient name <span className="text-text-muted">(optional)</span></label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      placeholder="e.g. Ravi Sharma"
                      className="w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-text-muted outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">Additional note <span className="text-text-muted">(optional)</span></label>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Brief description of the situation..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface-container-low font-body-md text-body-md text-on-surface placeholder:text-text-muted outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Error */}
                {mutation.isError && (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>error</span>
                    Failed to send alert. Try again.
                  </p>
                )}

                {/* Warning banner */}
                <div className="flex gap-2.5 px-3 py-2.5 rounded-xl bg-[#fff3e0] border border-[#f29900]/30">
                  <span className="material-symbols-outlined text-[#f29900] flex-shrink-0" style={{ fontSize: '18px' }}>warning</span>
                  <p className="font-label-sm text-label-sm text-[#b06000]">This will alert all online admin staff immediately. Only use in genuine emergencies.</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl border border-border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={mutation.isPending}
                    className="flex-1 py-3 rounded-xl bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${mutation.isPending ? 'animate-spin' : ''}`}>
                      {mutation.isPending ? 'autorenew' : 'send'}
                    </span>
                    {mutation.isPending ? 'Sending…' : 'Send Alert'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Success ── */}
            {step === 3 && (
              <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-[#e6f4ea] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[#1e8e3e] icon-fill" style={{ fontSize: '32px' }}>check_circle</span>
                </motion.div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">Alert Sent</h3>
                  <p className="font-body-md text-body-md text-text-muted mt-1">Admin staff have been notified of the emergency. Help is on the way.</p>
                </div>
                {/* Emergency numbers */}
                <div className="w-full rounded-xl bg-surface-container-low border border-border-light p-4 space-y-2 text-left">
                  <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider mb-2">Emergency Contacts</p>
                  {[
                    { label: 'Ambulance',       number: '102' },
                    { label: 'Police',           number: '100' },
                    { label: 'National Emergency', number: '112' },
                  ].map(({ label, number }) => (
                    <a key={number} href={`tel:${number}`}
                      className="flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      <span className="font-label-md text-label-md text-on-surface">{label}</span>
                      <span className="flex items-center gap-1.5 font-bold text-error">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                        {number}
                      </span>
                    </a>
                  ))}
                </div>
                <button type="button" onClick={handleClose} className="w-full py-3 rounded-xl border border-border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
