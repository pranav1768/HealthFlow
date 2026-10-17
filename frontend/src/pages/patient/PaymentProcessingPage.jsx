import { useEffect, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function PaymentProcessingPage() {
  usePageTitle('Payment');
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(state?.phase || 'processing');
  const [verifiedPayment, setVerifiedPayment] = useState(null);
  const [failReason, setFailReason] = useState(state?.reason || '');

  useEffect(() => {
    if (phase !== 'verifying') return;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = state || {};
    if (!razorpay_order_id) { setPhase('failed'); setFailReason('Missing payment verification data.'); return; }
    api.post('/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature })
      .then(res => { setVerifiedPayment(res.data.payment); setPhase('success'); })
      .catch(err => { setPhase('failed'); setFailReason(err.response?.data?.message || 'Signature verification failed.'); });
  }, [phase, state]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {phase === 'processing' && <ProcessingCard key="processing" />}
        {phase === 'verifying' && <VerifyingCard key="verifying" />}
        {phase === 'success' && (
          <SuccessCard key="success"
            doctorName={state?.doctorName} dateLabel={state?.dateLabel}
            timeLabel={state?.timeLabel} payAtClinic={state?.payAtClinic}
            payment={verifiedPayment}
            onViewAppointment={() => navigate('/patient/appointments')}
          />
        )}
        {phase === 'failed' && (
          <FailedCard key="failed" reason={failReason}
            onRetry={() => navigate(-2)} onChangeMethod={() => navigate(-1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProcessingCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="bg-surface-white rounded-2xl p-8 flex flex-col items-center text-center border border-border-light shadow-2xl w-full max-w-sm overflow-hidden relative">
      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
      <h2 className="font-title-lg text-title-lg text-on-surface mb-2">Processing Payment...</h2>
      <p className="font-body-md text-body-md text-text-muted">Please don't close this window</p>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container-low">
        <motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: '80%' }} transition={{ duration: 2.5, ease: 'easeInOut' }} />
      </div>
    </motion.div>
  );
}

function VerifyingCard() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="bg-surface-white rounded-2xl p-8 flex flex-col items-center text-center border border-border-light shadow-2xl w-full max-w-sm">
      <div className="w-16 h-16 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin mb-6" />
      <h2 className="font-title-lg text-title-lg text-on-surface mb-2">Verifying Payment...</h2>
      <p className="font-body-md text-body-md text-text-muted">Confirming with our payment partner</p>
    </motion.div>
  );
}

function SuccessCard({ doctorName, dateLabel, timeLabel, payAtClinic, onViewAppointment }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-surface-white rounded-2xl border border-border-light shadow-2xl w-full max-w-sm overflow-hidden">

      {/* Top gradient bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#1e8e3e] to-[#34A853]" />

      <div className="p-8 flex flex-col items-center text-center">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-full bg-[#e6f4ea] flex items-center justify-center mb-6 relative"
        >
          {/* Outer ring pulse */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#1e8e3e]/30"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.8, repeat: 1 }}
          />
          <span className="material-symbols-outlined icon-fill text-[#1e8e3e]" style={{ fontSize: '40px' }}>check_circle</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">
            {payAtClinic ? 'Appointment Confirmed!' : 'Payment Successful!'}
          </h2>
          <p className="font-body-md text-body-md text-text-muted mb-6">
            {payAtClinic ? 'Pay at the clinic on the day of your visit.' : 'Your appointment is confirmed and payment received.'}
          </p>
        </motion.div>

        {/* Appointment details card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="w-full bg-surface-container-lowest border border-border-light rounded-xl p-4 mb-6 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#1e8e3e] flex-shrink-0" />
            <p className="font-label-sm text-label-sm text-[#1e8e3e] uppercase tracking-wider">Appointment Confirmed</p>
          </div>
          {doctorName && (
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>person</span>
              <p className="font-label-md text-label-md text-on-surface font-semibold">{doctorName}</p>
            </div>
          )}
          {dateLabel && (
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>calendar_today</span>
              <p className="font-body-md text-body-md text-on-surface">{dateLabel}{timeLabel ? `, ${timeLabel}` : ''}</p>
            </div>
          )}
          {payAtClinic && (
            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-border-light">
              <span className="material-symbols-outlined text-[#f29900]" style={{ fontSize: '16px' }}>payments</span>
              <span className="font-label-sm text-label-sm text-[#f29900]">Pay at clinic on your visit</span>
            </div>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          onClick={onViewAppointment}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full bg-primary text-on-primary rounded-xl h-12 font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span>
          View Appointment
        </motion.button>
      </div>
    </motion.div>
  );
}

function FailedCard({ reason, onRetry, onChangeMethod }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-surface-white rounded-2xl border border-border-light shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="h-2 w-full bg-error" />
      <div className="p-8 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-error" style={{ fontSize: '40px' }}>close</span>
        </motion.div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Payment Failed</h2>
        <p className="font-body-md text-body-md text-text-muted mb-6">{reason || 'Your bank declined this transaction. Please try again.'}</p>
        <div className="w-full flex flex-col gap-3">
          <button onClick={onRetry}
            className="w-full bg-primary text-on-primary rounded-xl h-12 font-label-md text-label-md hover:opacity-90 transition-opacity">
            Try Again
          </button>
          <button onClick={onChangeMethod}
            className="w-full text-text-muted font-label-md text-label-md h-10 hover:text-primary transition-colors">
            Choose Different Method
          </button>
        </div>
      </div>
    </motion.div>
  );
}
