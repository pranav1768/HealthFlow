const VARIANTS = {
  // Appointment statuses
  upcoming: 'bg-[#14BEF0]/10 text-[#006783]',
  confirmed: 'bg-[#14BEF0]/10 text-[#006783]',
  completed: 'bg-surface-variant text-on-surface-variant',
  cancelled: 'bg-error-container text-on-error-container',
  no_show: 'bg-error-container text-on-error-container',
  pending_payment: 'bg-[#fef7e0] text-[#f29900]',

  // Payment statuses
  paid: 'bg-[#e6f4ea] text-[#1e8e3e]',
  pending: 'bg-[#fef7e0] text-[#f29900]',
  failed: 'bg-error-container text-on-error-container',
  refunded: 'bg-surface-variant text-on-surface-variant',
  created: 'bg-[#fef7e0] text-[#f29900]',

  default: 'bg-[#e4e1e8] text-[#1b1b20]',
};

const LABELS = {
  upcoming: 'Upcoming',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
  created: 'Created',
};

export default function StatusPill({ status, label }) {
  const key = (status || '').toLowerCase();
  const classes = VARIANTS[key] || VARIANTS.default;
  const text = label || LABELS[key] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
      {text}
    </span>
  );
}
