/**
 * OrderSummaryCard — exact structure from the payment_method_selection
 * export: sticky positioning, left accent bar, dashed-divider fee
 * breakdown, trust badges footer.
 *
 * doctorName/doctorAvatar/date/time describe the appointment being paid for.
 * breakdown: { consultationFee, platformFee, gst } in rupees (display units).
 * onPay receives no args — caller already knows the selected method/amount.
 */
export default function OrderSummaryCard({
  doctorName,
  doctorAvatar,
  dateLabel,
  timeLabel,
  breakdown,
  onPay,
  onCancel,
  isSubmitting,
}) {
  const total = breakdown.consultationFee + breakdown.platformFee + breakdown.gst;
  const isLoading = breakdown.consultationFee === 0;

  const fmt = (n) => isLoading ? '—' : `₹${n}`;

  return (
    <div className="bg-surface-white border border-light rounded-lg p-6 sticky top-24 shadow-sm relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container" />

      <h3 className="font-title-lg text-title-lg text-text-primary mb-6 border-b border-light pb-4">
        Order Summary
      </h3>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex-shrink-0 mt-1">
            {doctorAvatar ? (
              <img className="w-full h-full object-cover" src={doctorAvatar} alt={doctorName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-label-md text-label-md text-text-primary">Consultation with {doctorName}</p>
            <p className="font-label-sm text-label-sm text-text-muted mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {dateLabel} • {timeLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 py-4 border-t border-b border-light border-dashed mb-6">
        <div className="flex justify-between font-body-md text-body-md text-text-muted">
          <span>Consultation Fee</span>
          <span>{fmt(breakdown.consultationFee)}</span>
        </div>
        <div className="flex justify-between font-body-md text-body-md text-text-muted">
          <span>Platform Fee</span>
          <span>{fmt(breakdown.platformFee)}</span>
        </div>
        <div className="flex justify-between font-body-md text-body-md text-text-muted">
          <span>GST/Tax (18%)</span>
          <span>{fmt(breakdown.gst)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="font-title-lg text-title-lg text-text-primary">Total Amount</span>
        <span className="font-headline-md text-headline-md font-bold text-primary-container">
          {isLoading ? '—' : `₹${total}`}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onPay}
          disabled={isSubmitting}
          className="w-full h-12 bg-primary-container text-surface-white rounded-full font-label-md text-label-md hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined icon-fill text-[18px]">lock</span>
          {isSubmitting ? 'Processing…' : isLoading ? 'Loading…' : `Proceed to Pay ₹${total}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-text-muted font-label-md text-label-md hover:text-primary transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center pt-4 border-t border-light">
        <p className="font-label-sm text-label-sm text-text-muted flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-[16px] text-primary">security</span>
          100% Secure Payments
        </p>
        <div className="flex gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="h-6 w-12 bg-surface-variant rounded flex items-center justify-center text-[10px] font-bold text-text-muted">
            RAZORPAY
          </div>
          <div className="h-6 w-12 bg-surface-variant rounded flex items-center justify-center text-[10px] font-bold text-text-muted">
            VISA
          </div>
          <div className="h-6 w-12 bg-surface-variant rounded flex items-center justify-center text-[10px] font-bold text-text-muted">
            MC
          </div>
        </div>
      </div>
    </div>
  );
}
