const METHOD_CONFIG = {
  upi: { icon: 'qr_code_scanner', label: 'UPI' },
  card: { icon: 'credit_card', label: 'Credit / Debit Card' },
  netbanking: { icon: 'account_balance', label: 'Net Banking' },
  wallet: { icon: 'account_balance_wallet', label: 'Wallet' },
  pay_at_clinic: { icon: 'local_hospital', label: 'Pay at Clinic' },
};

/**
 * PaymentMethodCard — radio row per method. Selected state matches the
 * export exactly: border-2 border-primary-container + bg-[#f4f5fa].
 * The `card` method additionally expands inline card-detail inputs when
 * selected (per the export's vanilla-JS toggle behavior, reproduced here
 * as a conditional render).
 */
export default function PaymentMethodCard({ method, isSelected, onSelect, children }) {
  const config = METHOD_CONFIG[method];
  if (!config) return null;

  if (isSelected) {
    return (
      <div className="border-2 border-primary-container bg-[#f4f5fa] rounded-lg overflow-hidden transition-all duration-200">
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <div className="flex items-center gap-4">
            <input
              type="radio"
              name="payment_method"
              value={method}
              checked
              onChange={() => onSelect(method)}
              className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
            />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface-white rounded flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-primary">{config.icon}</span>
              </div>
              <span className="font-label-md text-label-md text-text-primary">{config.label}</span>
            </div>
          </div>
        </label>
        {children && <div className="px-4 pb-4 pt-2 border-t border-light mx-4">{children}</div>}
      </div>
    );
  }

  return (
    <label className="flex items-center justify-between p-4 bg-surface-white border border-light rounded-lg cursor-pointer card-hover transition-colors duration-200">
      <div className="flex items-center gap-4">
        <input
          type="radio"
          name="payment_method"
          value={method}
          onChange={() => onSelect(method)}
          className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-container-low rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">{config.icon}</span>
          </div>
          <span className="font-label-md text-label-md text-text-primary">{config.label}</span>
        </div>
      </div>
    </label>
  );
}
