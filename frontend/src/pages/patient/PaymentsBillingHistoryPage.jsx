import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { ListSkeleton } from '../../components/shared/SkeletonLoaders';
import StatusPill from '../../components/shared/StatusPill';
import usePageTitle from '../../hooks/usePageTitle';

const METHOD_ICONS = { upi: 'account_balance_wallet', card: 'credit_card', netbanking: 'account_balance', wallet: 'account_balance_wallet', pay_at_clinic: 'local_hospital' };

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupees(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function PaymentsBillingHistoryPage() {
  usePageTitle('Payments & Billing');
  const [activeTab, setActiveTab] = useState('methods'); // 'methods' | 'history'
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payment-history', statusFilter, from, to],
    queryFn: () =>
      api.get('/payments/history', { params: { status: statusFilter || undefined, from: from || undefined, to: to || undefined } })
        .then(r => r.data),
    enabled: activeTab === 'history',
  });

  const payments = data?.payments || [];
  const filtered = search
    ? payments.filter(p => (p.appointment?.doctor?.user?.name || '').toLowerCase().includes(search.toLowerCase()))
    : payments;

  if (isLoading) return <ListSkeleton rows={4} />;
  return (
    <div className="max-w-container-max mx-auto">
      {/* Header + pill toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md mb-stack-lg">
        <div>
          <h1 className="font-headline-md text-headline-md text-text-primary mb-1">Payments & Billing</h1>
          <p className="font-body-md text-body-md text-text-muted">Manage your payment methods and view past transactions.</p>
        </div>

        {/* Pill toggle matching the Stitch CSS toggle pattern (React state version) */}
        <div className="flex p-1 bg-surface-container-low rounded-full relative">
          <div
            className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-primary-container rounded-full transition-transform duration-300"
            style={{ transform: activeTab === 'history' ? 'translateX(100%)' : 'translateX(0)' }}
          />
          {['methods', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 px-5 py-2 rounded-full font-label-md text-label-md transition-colors capitalize ${activeTab === tab ? 'text-on-primary' : 'text-on-surface-variant'}`}
            >
              {tab === 'methods' ? 'Payment Methods' : 'Transaction History'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'methods' && (
        <motion.div
          key="methods"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {/* Saved card chips matching billing_history export */}
            {[
              { icon: 'credit_card', title: '•••• •••• •••• 4242', sub: 'Visa ending in 4242', meta: 'Expires 12/25', isDefault: true },
              { icon: 'credit_card', title: '•••• •••• •••• 8812', sub: 'Mastercard ending in 8812', meta: 'Expires 08/26', isDefault: false },
              { icon: 'account_balance_wallet', title: 'jane.doe@okaxis', sub: 'Google Pay UPI', meta: 'Added 2 months ago', isDefault: false },
            ].map((card, i) => (
              <div key={i} className="bg-surface-white border border-border-light rounded-lg p-6 card-hover flex flex-col">
                <div className="flex justify-between items-start mb-stack-md">
                  <div className="bg-surface-container-low p-2 rounded-md">
                    <span className="material-symbols-outlined text-primary-container text-2xl">{card.icon}</span>
                  </div>
                  <button className="text-text-muted hover:text-error transition-colors" aria-label="Remove">
                    <span className="material-symbols-outlined text-lg">delete_outline</span>
                  </button>
                </div>
                <div className="flex-1">
                  <h3 className="font-title-lg text-title-lg text-text-primary mb-1">{card.title}</h3>
                  <p className="font-body-md text-body-md text-text-muted">{card.sub}</p>
                </div>
                <div className="mt-stack-md pt-stack-sm border-t border-border-light flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-text-muted">{card.meta}</span>
                  {card.isDefault ? (
                    <span className="bg-[#e4e1e8] text-[#1b1b20] px-3 py-1 rounded-full font-label-sm text-label-sm">Default</span>
                  ) : (
                    <button className="text-secondary font-label-md text-label-md hover:underline">Set as default</button>
                  )}
                </div>
              </div>
            ))}

            {/* Add new method — dashed card */}
            <button className="border-2 border-dashed border-outline-variant hover:border-primary-container rounded-lg p-6 flex flex-col items-center justify-center text-text-muted hover:text-primary-container transition-colors min-h-[200px] bg-surface-container-lowest hover:bg-surface-bright">
              <span className="material-symbols-outlined text-3xl mb-2">add_circle</span>
              <span className="font-label-md text-label-md">Add New Payment Method</span>
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Filter bar */}
          <div className="bg-surface-white border border-border-light rounded-lg p-4 mb-gutter flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-full text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  placeholder="Search transactions..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 pl-4 pr-10 py-2 bg-surface border border-outline-variant rounded-full text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="flex-1 sm:w-36 px-3 py-2 bg-surface border border-outline-variant rounded-full text-body-md focus:outline-none focus:border-secondary transition-all text-text-muted" />
              <span className="text-text-muted font-body-md">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="flex-1 sm:w-36 px-3 py-2 bg-surface border border-outline-variant rounded-full text-body-md focus:outline-none focus:border-secondary transition-all text-text-muted" />
            </div>
          </div>

          {/* Transaction table */}
          <div className="bg-surface-white border border-border-light rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-light">
                    {['Date', 'Description', 'Method', 'Amount', 'Status', 'Action'].map((h, i) => (
                      <th key={h} className={`p-4 font-label-md text-label-md text-on-surface-variant font-semibold ${i === 3 ? 'text-right' : i === 5 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-border-light">
                  {isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center"><span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-text-muted">No transactions found.</td></tr>
                  ) : (
                    filtered.map((payment, i) => {
                      const doctorName = payment.appointment?.doctor?.user?.name || 'Consultation';
                      const methodIcon = METHOD_ICONS[payment.method] || 'payments';
                      return (
                        <motion.tr
                          key={payment._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-surface-bright transition-colors group"
                        >
                          <td className="p-4 text-text-primary whitespace-nowrap">{formatDate(payment.createdAt)}</td>
                          <td className="p-4 text-text-primary">
                            <div className="font-medium">Consultation</div>
                            <div className="text-text-muted text-sm mt-0.5">{doctorName}</div>
                          </td>
                          <td className="p-4 text-text-muted whitespace-nowrap">
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">{methodIcon}</span>
                              {payment.method || 'Online'}
                            </span>
                          </td>
                          <td className="p-4 text-text-primary font-medium text-right whitespace-nowrap">
                            {formatRupees(payment.amount)}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <StatusPill status={payment.status} />
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button className="text-text-muted hover:text-primary-container p-1 rounded-full hover:bg-surface-container-high transition-colors" title="Download Receipt">
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
