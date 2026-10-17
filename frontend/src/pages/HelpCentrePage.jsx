import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = {
  patient: [
    {
      q: 'How do I book an appointment?',
      a: 'Go to Find Doctors, search by specialty or name, open a doctor\'s profile, pick an available time slot, and complete payment. You\'ll get a confirmation immediately.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept all major UPI apps (GPay, PhonePe, Paytm), debit/credit cards, net banking, and Pay at Clinic for in-person visits.',
    },
    {
      q: 'Can I cancel or reschedule an appointment?',
      a: 'Yes. Go to My Appointments, find the appointment, and tap Cancel. Refunds for prepaid appointments are processed within 5–7 business days.',
    },
    {
      q: 'How do I access my medical records?',
      a: 'All records uploaded by your doctor after a consultation appear under Medical Records. You can filter by type and download files directly.',
    },
    {
      q: 'Is my health data safe?',
      a: 'All records are stored on Supabase with end-to-end encryption. Files are served via signed URLs that expire after 1 hour — no permanent public links.',
    },
    {
      q: 'What does "Pay at Clinic" mean?',
      a: 'You can choose to pay directly at the clinic during your visit instead of paying online. The appointment is confirmed but payment is settled in person.',
    },
  ],
  doctor: [
    {
      q: 'How do I manage my availability?',
      a: 'Go to Schedule. You can set your weekly working hours and block specific dates for time-off. Changes take effect immediately for new bookings.',
    },
    {
      q: 'How do I upload medical records for a patient?',
      a: 'On the Appointments page, find a completed appointment and use the Upload Records option. Records are tagged to that patient and visible to them instantly.',
    },
    {
      q: 'Can I write notes or prescriptions on the platform?',
      a: 'Yes. From any completed appointment you can add a clinical note with diagnosis, medications, and follow-up instructions.',
    },
    {
      q: 'How does the Emergency Alert work?',
      a: 'Press the Emergency Alert button in the sidebar, select the emergency type, add optional notes, and confirm. All online admin staff are notified instantly via the platform.',
    },
    {
      q: 'When do I receive payment?',
      a: 'Payments are processed via Razorpay. Settlements are transferred to your registered bank account per Razorpay\'s standard payout cycle (typically T+2 days).',
    },
    {
      q: 'How do I update my profile and clinic info?',
      a: 'Go to Settings. You can update your specialization, qualifications, consultation fee, clinic address, and profile photo.',
    },
  ],
  admin: [
    {
      q: 'How do I verify a new doctor?',
      a: 'Go to User Management, filter by Doctor role, find the doctor, and click Verify. Unverified doctors cannot accept appointments.',
    },
    {
      q: 'How do I deactivate a user account?',
      a: 'In User Management, find the user and click Deactivate. Deactivated users cannot log in until reactivated.',
    },
    {
      q: 'Where can I see platform revenue?',
      a: 'The Analytics page shows total revenue, appointment volume, and role-wise breakdowns with charts.',
    },
    {
      q: 'What does the Emergency Alert notification mean?',
      a: 'A doctor has triggered a critical alert from the platform. Check the notification panel for details including the doctor name, type of emergency, and any notes they added.',
    },
  ],
};

const CATEGORIES = [
  { id: 'patient', icon: 'person',              label: 'Patient' },
  { id: 'doctor',  icon: 'local_hospital',        label: 'Doctor'  },
  { id: 'admin',   icon: 'admin_panel_settings', label: 'Admin'   },
];

const QUICK_LINKS = [
  { icon: 'calendar_today',         label: 'Book an Appointment',  desc: 'Step-by-step booking guide',    category: 'patient', faqIndex: 0 },
  { icon: 'account_balance_wallet', label: 'Payments & Refunds',   desc: 'How billing works',             category: 'patient', faqIndex: 1 },
  { icon: 'description',            label: 'Medical Records',      desc: 'Uploading and downloading',     category: 'patient', faqIndex: 3 },
  { icon: 'security',               label: 'Privacy & Security',   desc: 'How your data is protected',    category: 'patient', faqIndex: 4 },
  { icon: 'emergency',              label: 'Emergency Alerts',     desc: 'For doctors in critical cases', category: 'doctor',  faqIndex: 3 },
  { icon: 'settings',               label: 'Account Settings',     desc: 'Profile, password and more',    category: 'doctor',  faqIndex: 5 },
];

function FAQItem({ q, a, autoOpen = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  return (
    <div className="border border-border-light rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-surface-white hover:bg-surface-container-low transition-colors text-left"
      >
        <span className="font-label-md text-label-md text-on-surface">{q}</span>
        <span
          className="material-symbols-outlined text-text-muted flex-shrink-0 transition-transform duration-200"
          style={{ fontSize: '20px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-border-light bg-surface-container-lowest">
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCentrePage() {
  usePageTitle('Help Centre');
  const { role } = useAuth();
  const defaultCategory = role === 'doctor' ? 'doctor' : role === 'admin' ? 'admin' : 'patient';
  const [category, setCategory] = useState(defaultCategory);
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  function handleQuickLink({ category: cat, faqIndex }) {
    setSearch('');
    setCategory(cat);
    setOpenIndex(faqIndex);
    setTimeout(() => {
      document.getElementById('faq-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  const faqs = FAQS[category] || [];
  const filtered = search
    ? faqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: '28px' }}>help</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Help Centre</h1>
        <p className="font-body-lg text-body-lg text-text-muted">Find answers to common questions about HealthFlow.</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: '20px' }}>search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search for answers..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border-light bg-surface-white font-body-lg text-body-lg text-on-surface placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '18px' }}>close</span>
          </button>
        )}
      </div>

      {/* Quick links — filtered to current role */}
      {!search && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {QUICK_LINKS.filter(l => l.category === defaultCategory || (role === 'admin')).map((link) => (
            <div
              key={link.label}
              className="flex items-start gap-3 p-4 rounded-xl border border-border-light bg-surface-white hover:bg-surface-container-low hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => handleQuickLink(link)}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '17px' }}>{link.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface leading-tight">{link.label}</p>
                <p className="font-label-sm text-label-sm text-text-muted mt-0.5 leading-tight">{link.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category tabs — only show for admin who manages all roles */}
      {!search && role === 'admin' && (
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCategory(c.id); setOpenIndex(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                category === c.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-white border border-border-light text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* FAQ list */}
      <div id="faq-list" className="space-y-2 mb-12">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-outline-variant">search_off</span>
            <p className="font-body-lg text-body-lg text-text-muted mt-3">No results for "{search}"</p>
            <button type="button" onClick={() => setSearch('')} className="mt-3 font-label-md text-label-md text-primary hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          filtered.map((faq, i) => (
            <FAQItem
              key={`${category}-${i}`}
              q={faq.q}
              a={faq.a}
              autoOpen={!search && i === openIndex}
            />
          ))
        )}
      </div>

      {/* Contact card */}
      <div className="rounded-2xl border border-border-light bg-surface-container-lowest p-6 text-center">
        <span className="material-symbols-outlined text-primary text-4xl mb-3 block">support_agent</span>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-1">Still need help?</h3>
        <p className="font-body-md text-body-md text-text-muted mb-5">Our support team is available Mon–Sat, 9 AM to 6 PM IST.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@healthflow.app"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
            Email Support
          </a>
          <a
            href="tel:+911800000000"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border-light bg-surface-white text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
            1800 000 0000
          </a>
        </div>
      </div>
    </div>
  );
}
