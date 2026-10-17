import { useState, useEffect, useCallback } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentMethodCard from '../../components/payment/PaymentMethodCard';
import OrderSummaryCard from '../../components/payment/OrderSummaryCard';
import api from '../../services/api';

const METHODS = ['upi', 'card', 'netbanking', 'wallet', 'pay_at_clinic'];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentMethodSelectionPage() {
  usePageTitle('Payment');
  const { state } = useLocation();
  const navigate = useNavigate();

  // `state` must be passed via router: { appointmentId, doctorName, dateLabel, timeLabel }
  const { appointmentId, doctorName = 'Doctor', dateLabel = '', timeLabel = '' } = state || {};

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const PLATFORM_FEE = 20;
  const GST_RATE = 0.18;

  // Fetch appointment on mount to compute real fee breakdown immediately
  const [breakdown, setBreakdown] = useState({ consultationFee: 0, platformFee: 0, gst: 0 });

  useEffect(() => {
    if (!appointmentId) return;
    api.get(`/appointments/${appointmentId}`).then(r => {
      const fee = r.data?.appointment?.consultationFeeSnapshot || 0;
      const gst = Math.round((fee + PLATFORM_FEE) * GST_RATE);
      setBreakdown({ consultationFee: fee, platformFee: PLATFORM_FEE, gst });
    }).catch(() => {});
  }, [appointmentId]);

  const handlePay = useCallback(async () => {
    if (!appointmentId) {
      setServerError('No appointment selected. Please book an appointment first.');
      return;
    }
    setIsSubmitting(true);
    setServerError('');

    // Pay at clinic — confirm directly without Razorpay
    if (selectedMethod === 'pay_at_clinic') {
      try {
        await api.patch(`/appointments/${appointmentId}/status`, { status: 'confirmed' });
        navigate('/patient/payments/processing', {
          state: { phase: 'success', doctorName, dateLabel, timeLabel, payAtClinic: true },
        });
      } catch (err) {
        setServerError(err.response?.data?.message || 'Failed to confirm appointment.');
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setServerError('Payment gateway failed to load. Please check your internet connection and try again.');
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create Razorpay order server-side (amount computed there, never on client).
      let orderData;
      try {
        const { data } = await api.post('/payments/create-order', { appointmentId });
        orderData = data;
      } catch (err) {
        setServerError(err.response?.data?.message || 'Could not create payment order. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in backend/.env and restart the server.');
        setIsSubmitting(false);
        return;
      }

      const { orderId, amount, keyId, breakdown: bkd } = orderData;
      if (!keyId) {
        setServerError('Razorpay Key ID is missing. Set RAZORPAY_KEY_ID in backend/.env and restart the server.');
        setIsSubmitting(false);
        return;
      }
      if (bkd) setBreakdown({
        consultationFee: bkd.consultationFee / 100,
        platformFee: bkd.platformFee / 100,
        gst: bkd.gst / 100,
      });

      // Step 2: Navigate to processing screen in "redirecting" state.
      navigate('/patient/payments/processing', {
        state: { phase: 'processing', orderId, amount, keyId, appointmentId, doctorName, dateLabel, timeLabel, selectedMethod },
      });

      // Step 3: Open Razorpay Checkout.
      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: 'HealthFlow',
        description: `Consultation with ${doctorName}`,
        // RAZORPAY_KEY_ID is safe here (public identifier).
        // RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are backend-only — never sent to frontend.
        order_id: orderId,
        theme: { color: '#28328c' }, // primary-container indigo per design system
        handler: async (response) => {
          navigate('/patient/payments/processing', {
            state: {
              phase: 'verifying',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              doctorName, dateLabel, timeLabel,
            },
          });
        },
        modal: {
          ondismiss: () => {
            navigate(-1);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        navigate('/patient/payments/processing', {
          state: {
            phase: 'failed',
            reason: response.error?.description || 'Payment failed.',
            doctorName, dateLabel, timeLabel,
          },
        });
      });
      rzp.open();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setIsSubmitting(false);
    }
  }, [appointmentId, selectedMethod, doctorName, dateLabel, timeLabel, navigate]);

  if (!appointmentId) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-64">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">calendar_today</span>
        <p className="font-title-lg text-title-lg text-text-muted">No appointment selected.</p>
        <button
          onClick={() => navigate('/patient/find-doctors')}
          className="mt-4 px-6 py-2 bg-primary-container text-on-primary rounded-full font-label-md text-label-md"
        >
          Find a Doctor
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto">
      <div className="mb-stack-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary mb-4"
        >
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>
        <h2 className="font-headline-md text-headline-md text-text-primary mb-1">Payment Method</h2>
        <p className="font-body-md text-body-md text-text-muted">Choose how you'd like to pay</p>
      </div>

      {serverError && (
        <div className="mb-4 p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Payment method selection */}
        <div className="lg:col-span-8 flex flex-col gap-stack-md">
          <section>
            <h3 className="font-title-lg text-title-lg text-text-primary mb-stack-sm">Other Payment Methods</h3>
            <div className="flex flex-col gap-3">
              {METHODS.map(method => (
                <PaymentMethodCard
                  key={method}
                  method={method}
                  isSelected={selectedMethod === method}
                  onSelect={setSelectedMethod}
                >
                  {/* Card form expands inline when card is selected */}
                  {method === 'card' && selectedMethod === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="md:col-span-2">
                        <label className="block font-label-sm text-label-sm text-text-primary mb-1">Card Number</label>
                        <div className="relative">
                          <input
                            className="w-full h-10 px-3 bg-surface-white border border-outline-variant rounded-lg input-ring font-body-md text-text-primary pl-10"
                            placeholder="0000 0000 0000 0000"
                          />
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">credit_card</span>
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm text-text-primary mb-1">Expiry Date</label>
                        <input className="w-full h-10 px-3 bg-surface-white border border-outline-variant rounded-lg input-ring font-body-md text-text-primary" placeholder="MM/YY" />
                      </div>
                      <div>
                        <label className="block font-label-sm text-label-sm text-text-primary mb-1">CVV</label>
                        <input className="w-full h-10 px-3 bg-surface-white border border-outline-variant rounded-lg input-ring font-body-md text-text-primary" placeholder="•••" type="password" />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <input className="rounded border-outline-variant" id="save_card" type="checkbox" />
                        <label className="font-label-sm text-label-sm text-text-muted" htmlFor="save_card">
                          Save this card for future payments
                        </label>
                      </div>
                    </div>
                  )}
                </PaymentMethodCard>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Order summary sidebar */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <OrderSummaryCard
            doctorName={doctorName}
            dateLabel={dateLabel}
            timeLabel={timeLabel}
            breakdown={breakdown}
            onPay={handlePay}
            onCancel={() => navigate(-1)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
