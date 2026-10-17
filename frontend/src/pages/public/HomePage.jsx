import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePageTitle from '../../hooks/usePageTitle';

// Hero slides — replacing expired lh3.googleusercontent URLs with Unsplash
const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&q=80',
    alt: 'Medical consultation',
  },
  {
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1600&q=80',
    alt: 'Clinical professionals',
  },
  {
    img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&q=80',
    alt: 'Digital health records',
  },
];

const SPECIALTIES = [
  { icon: 'favorite', label: 'Cardiology', desc: 'Expert diagnostic and therapeutic services for complex heart conditions.', count: '14 Specialists Available' },
  { icon: 'psychology', label: 'Neurology', desc: 'Comprehensive care for neurological disorders and brain health management.', count: '8 Specialists Available' },
  { icon: 'child_care', label: 'Pediatrics', desc: 'Dedicated pediatric care ensuring the healthy growth of your little ones.', count: '12 Specialists Available' },
  { icon: 'visibility', label: 'Ophthalmology', desc: 'Advanced vision care and surgical solutions for ocular health.', count: '6 Specialists Available' },
  { icon: 'dentistry', label: 'Dentistry', desc: 'Modern dental procedures for restorative and aesthetic oral health.', count: '10 Specialists Available' },
  { icon: 'biotech', label: 'Diagnostics', desc: 'State-of-the-art laboratory testing and precise diagnostic imaging.', count: '24/7 Lab Access' },
  { icon: 'medical_services', label: 'Endocrinology', desc: 'Specialized care for hormonal imbalances and metabolic disorders.', count: '7 Specialists Available' },
  { icon: 'air', label: 'Pulmonology', desc: 'Expert diagnosis and treatment for respiratory and lung-related conditions.', count: '5 Specialists Available' },
  { icon: 'water_drop', label: 'Nephrology', desc: 'Comprehensive management of kidney health and renal diseases.', count: '4 Specialists Available' },
  { icon: 'biotech', label: 'Oncology', desc: 'Advanced cancer care focusing on personalized treatment and support.', count: '9 Specialists Available' },
  { icon: 'psychology', label: 'Psychiatry', desc: 'Compassionate mental health services and psychiatric evaluations.', count: '11 Specialists Available' },
  { icon: 'sports_martial_arts', label: 'Rheumatology', desc: 'Specialized treatment for autoimmune and inflammatory joint conditions.', count: '6 Specialists Available' },
];

const DOCTORS = [
  { name: 'Dr. Elena Rodriguez', spec: 'Cardiologist', exp: '12 yrs exp', rating: '4.9', desc: 'Specializes in echocardiography and heart failure management.', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. James Wilson', spec: 'Neurologist', exp: '15 yrs exp', rating: '4.8', desc: 'Focus on neurological disorders and rehabilitation medicine.', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. Sarah Chen', spec: 'Pediatrician', exp: '8 yrs exp', rating: '5.0', desc: 'Comprehensive care for infants, children, and adolescents.', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. Michael Torres', spec: 'Ophthalmologist', exp: '10 yrs exp', rating: '4.7', desc: 'Specializes in advanced laser eye surgery and retinal health.', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. Sophia Patel', spec: 'Dermatologist', exp: '7 yrs exp', rating: '4.9', desc: 'Expert in clinical dermatology and aesthetic skin treatments.', img: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. David Miller', spec: 'Orthopedic Surgeon', exp: '20 yrs exp', rating: '4.8', desc: 'Specializes in joint replacement and sports medicine rehabilitation.', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. Robert Vance', spec: 'Endocrinologist', exp: '14 yrs exp', rating: '4.9', desc: 'Specialized care for hormonal imbalances and metabolic health.', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=300&fit=crop&crop=faces&q=80' },
  { name: 'Dr. Linda Grey', spec: 'Pulmonologist', exp: '11 yrs exp', rating: '4.8', desc: 'Expert diagnosis and treatment for respiratory and lung conditions.', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop&crop=faces&q=80' },
];

const FAQS = [
  { q: 'How do I book an appointment?', a: "You can book an appointment by clicking 'Book Your Appointment Today' in the hero section or by selecting a specialist and clicking 'Book Visit'." },
  { q: 'Is my medical data secure?', a: 'Yes, HealthFlow uses enterprise-grade encryption and complies with all healthcare data protection regulations to ensure your medical records remain private and secure.' },
  { q: 'Can I consult a doctor via video?', a: "Absolutely. Many of our specialists offer secure video consultations. Look for the 'Video Consult' option when booking your appointment." },
  { q: 'What specialties are available?', a: 'We offer a wide range of specialties including Cardiology, Neurology, Pediatrics, Ophthalmology, Dentistry, and comprehensive Diagnostic services.' },
  { q: 'How do I access my prescriptions?', a: "After your consultation, all prescriptions and medical records are automatically uploaded to your secure patient portal, accessible via the 'My Appointments' link." },
];

const TESTIMONIALS = [
  { initials: 'RM', name: 'Robert Miller', role: 'Cardiology Patient', text: '"The cardiology team at HealthFlow provided exceptional care. Their digital platform made tracking my recovery progress so much easier than traditional methods."' },
  { initials: 'SL', name: 'Sarah Lewis', role: 'Pediatrics Parent', text: '"As a busy parent, the video consult feature is a lifesaver. I got expert pediatric advice for my daughter without having to leave the house."' },
  { initials: 'DK', name: 'David Kim', role: 'Neurology Patient', text: '"The neurology specialists here are world-class. They took the time to explain my diagnosis and the treatment plan was incredibly thorough."' },
  { initials: 'AJ', name: 'Amanda Johnson', role: 'Ophthalmology Patient', text: '"Booking was seamless. I found a top-rated ophthalmologist near me and had my appointment confirmed within minutes. Highly recommend!"' },
  { initials: 'MP', name: 'Marcus Peterson', role: 'Diagnostics Patient', text: '"The diagnostic lab results were delivered directly to my app. No more waiting for phone calls or picking up physical reports. True digital efficiency."' },
];

// ─── Hero Carousel ──────────────────────────────────────────────────────────
function HeroCarousel() {
  const [current, setCurrent] = useState(1); // matches the Stitch export "active" on slide index 1
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const goTo = useCallback((idx) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
  }, []);

  function startInterval() {
    intervalRef.current = setInterval(next, 3000);
  }

  useEffect(() => {
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, [next]);

  function handleDotClick(idx) {
    clearInterval(intervalRef.current);
    goTo(idx);
    startInterval();
  }

  return (
    <header className="relative h-screen w-full overflow-hidden bg-primary">
      {/* Slides */}
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 w-full h-full transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img
            src={slide.img}
            alt={slide.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="max-w-2xl text-surface-white">
          <h1 className="font-display-lg text-display-lg mb-4 leading-tight" style={{ fontSize: 'clamp(32px, 6vw, 48px)' }}>
            Clinical Integrity,<br />Digitally Delivered.
          </h1>
          <p className="font-body-lg text-body-lg mb-8 opacity-90 max-w-lg">
            Experience the next generation of healthcare management. Connect with top-tier specialists and manage your medical journey with precision and ease.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/patient/find-doctors')}
              className="px-8 py-4 rounded-full bg-primary text-white font-label-md hover:scale-105 transition-transform"
            >
              Consult Top Doctors
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-full border-2 border-surface-white text-surface-white font-label-md hover:bg-white hover:text-primary transition-all"
            >
              Book Your Appointment Today
            </button>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            className={`w-12 h-1 rounded-full bg-white transition-opacity ${i === current ? 'opacity-100' : 'opacity-30'}`}
          />
        ))}
      </div>
    </header>
  );
}

// ─── Glass Nav ─────────────────────────────────────────────────────────────
function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  const [city, setCity] = useState('Mumbai');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const navigate = useNavigate();
  const cityRef = useRef(null);

  const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCityPicker(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 w-full z-[100] transition-all duration-300"
      style={{
        backdropFilter: scrolled ? 'none' : 'blur(12px)',
        backgroundColor: scrolled ? 'rgba(12,23,118,0.97)' : 'rgba(255,255,255,0.15)',
        borderBottom: scrolled ? 'none' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: scrolled ? '0 2px 20px rgba(12,23,118,0.25)' : 'none',
      }}
    >
      <div className="flex justify-between items-center h-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full gap-4">

        {/* Brand */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <span className="font-headline-md text-headline-md font-bold text-surface-white cursor-pointer" onClick={() => navigate('/')}>
            HealthFlow
          </span>

          {/* Location picker */}
          <div ref={cityRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowCityPicker(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-surface-white icon-fill" style={{ fontSize: '16px' }}>location_on</span>
              <span className="font-label-md text-label-md text-surface-white">{city}</span>
              <span className="material-symbols-outlined text-surface-white/70 transition-transform duration-200"
                style={{ fontSize: '16px', transform: showCityPicker ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </button>

            {/* City dropdown */}
            {showCityPicker && (
              <div className="absolute top-10 left-0 z-50 w-52 bg-surface-white rounded-xl shadow-2xl border border-border-light overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light">
                  <p className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Select City</p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {CITIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCity(c); setShowCityPicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors text-left ${c === city ? 'text-primary font-bold' : 'text-on-surface'}`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-outline">{c === city ? 'location_on' : 'circle'}</span>
                      <span className="font-body-md text-body-md">{c}</span>
                      {c === city && <span className="ml-auto material-symbols-outlined text-primary text-[16px]">check</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex gap-5 items-center flex-1 justify-center">
          {[
            { label: 'Find Doctors', path: '/login' },
            { label: 'Video Consult', path: '/login' },
            { label: 'Surgeries', path: '/login' },
            { label: 'Medicines', path: '/login' },
          ].map(({ label, path }) => (
            <span
              key={label}
              onClick={() => navigate(path)}
              className="font-body-md text-body-md text-surface-white opacity-90 hover:text-secondary-fixed hover:opacity-100 transition-all cursor-pointer whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-full bg-secondary text-on-secondary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
            Login / Signup
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Specialty Carousel ─────────────────────────────────────────────────────
function SpecialtyCarousel() {
  const trackRef = useRef(null);
  const [specIdx, setSpecIdx] = useState(0);
  const intervalRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : 1;
  const maxIdx = SPECIALTIES.length - visibleCount;

  function scrollTo(idx) {
    setSpecIdx(idx);
    if (!trackRef.current) return;
    const track = trackRef.current;
    const slide = track.firstElementChild;
    if (!slide) return;
    const gap = 24;
    track.scrollTo({ left: idx * (slide.offsetWidth + gap), behavior: 'smooth' });
  }

  function startAuto() {
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setSpecIdx(prev => {
          const next = prev >= maxIdx ? 0 : prev + 1;
          scrollTo(next);
          return next;
        });
      }
    }, 4000);
  }

  useEffect(() => {
    startAuto();
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  return (
    <section className="mb-stack-lg overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Explore Medical Specialties</h2>
          <p className="text-text-muted font-body-md">Advanced care across multiple clinical domains</p>
        </div>
        <button className="text-secondary font-label-md flex items-center gap-1 hover:gap-2 transition-all">
          View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-gutter overflow-x-auto snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {SPECIALTIES.map((s, i) => (
          <div key={i} className="snap-center flex-shrink-0" style={{ flex: '0 0 100%', maxWidth: 'calc(33.333% - 16px)' }}
            // Min 100% on mobile, 33.333% on md+
          >
            <div className="h-full bg-surface-white border border-border-light rounded-xl p-8 flex flex-col justify-between group transition-all duration-300 hover:shadow-[0px_4px_12px_rgba(40,50,140,0.08)] hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">{s.icon}</span>
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-primary mb-2">{s.label}</h3>
                <p className="text-text-muted font-body-md mb-6">{s.desc}</p>
                <span className="text-secondary font-label-md">{s.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => { scrollTo(i); clearInterval(intervalRef.current); startAuto(); }}
            className={`h-2.5 rounded-full transition-all duration-300 ${specIdx === i ? 'bg-secondary w-6' : 'bg-outline-variant w-2.5'}`}
          />
        ))}
      </div>
    </section>
  );
}

// ─── How It Works ───────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section className="mb-stack-lg py-stack-lg bg-surface-container-lowest rounded-3xl px-8 md:px-16 border border-border-light">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Your Path to Better Health</h2>
        <p className="text-text-muted font-body-md">Streamlined healthcare in three simple steps</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-border-light z-0" />
        {[
          { icon: 'search', color: 'bg-primary text-on-primary', step: '1. Search & Select', desc: 'Browse through our curated list of verified specialists based on your needs and location.' },
          { icon: 'event_available', color: 'bg-secondary text-on-secondary', step: '2. Book Appointment', desc: 'Choose a time slot that works for you, either for an in-person visit or a secure video call.' },
          { icon: 'verified_user', color: 'bg-primary-container text-on-primary-container', step: '3. Get Quality Care', desc: 'Meet your doctor and access your records, prescriptions, and follow-ups all in one place.' },
        ].map((s, i) => (
          <div key={i} className="relative z-10 text-center">
            <div className={`w-20 h-20 rounded-full ${s.color} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
              <span className="material-symbols-outlined text-4xl">{s.icon}</span>
            </div>
            <h4 className="font-title-lg text-title-lg text-primary mb-3">{s.step}</h4>
            <p className="text-text-muted font-body-md">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Doctors ───────────────────────────────────────────────────────
function FeaturedDoctors() {
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function autoScroll() {
      if (isPaused) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 304, behavior: 'smooth' }); // card width 280 + gap 24
      }
    }

    const id = setInterval(autoScroll, 3000);
    return () => clearInterval(id);
  }, [isPaused]);

  function scrollManual(dir) {
    trackRef.current?.scrollBy({ left: dir * 304, behavior: 'smooth' });
  }

  return (
    <section className="mb-stack-lg">
      <div className="mb-8">
        <h2 className="font-headline-lg text-headline-lg text-primary">Consult Our Featured Specialists</h2>
        <p className="text-on-surface-variant font-body-md">Connect with top-tier medical professionals across multiple clinical domains.</p>
      </div>
      <div className="relative group">
        <div
          ref={trackRef}
          className="flex gap-gutter overflow-x-auto pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {DOCTORS.map((doc, i) => (
            <div key={i} className="bg-surface-white border border-border-light rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex-shrink-0" style={{ minWidth: '280px' }}>
              <div className="h-56 overflow-hidden bg-surface-container-low">
                <img src={doc.img} alt={doc.name} className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-label-md text-primary">{doc.name}</h4>
                    <p className="text-label-sm text-secondary">{doc.spec} • {doc.exp}</p>
                  </div>
                  <div className="flex items-center gap-1 text-on-secondary-container bg-secondary-container/20 px-2 py-1 rounded text-xs font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-xs icon-fill">star</span>
                    {doc.rating}
                  </div>
                </div>
                <p className="text-label-sm text-text-muted mb-4">{doc.desc}</p>
                <button
                  onClick={() => navigate('/patient/find-doctors')}
                  className="w-full py-2 rounded-lg border border-primary text-primary font-label-md hover:bg-primary hover:text-white transition-all"
                >
                  Book Visit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Prev/Next arrows */}
        <button onClick={() => scrollManual(-1)}
          className="absolute left-0 top-24 -translate-y-1/2 w-10 h-10 bg-surface-white rounded-full shadow-lg flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10 -ml-4">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button onClick={() => scrollManual(1)}
          className="absolute right-0 top-24 -translate-y-1/2 w-10 h-10 bg-surface-white rounded-full shadow-lg flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10 -mr-4">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  const contentRefs = useRef([]);

  function toggle(i) {
    setOpenIdx(prev => prev === i ? null : i);
  }

  return (
    <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg mb-stack-lg">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Frequently Asked Questions</h2>
        <p className="text-text-muted font-body-md">Find answers to common questions about our clinical services</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className={`border rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'border-secondary' : 'border-surface-dim'}`}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-low transition-colors"
              >
                <span className="font-title-lg text-primary">{faq.q}</span>
                <span className="material-symbols-outlined transition-transform duration-300 flex-shrink-0 ml-4"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>
              <div
                ref={el => contentRefs.current[i] = el}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? (contentRefs.current[i]?.scrollHeight || 200) + 'px' : '0px' }}
              >
                <div className="p-6 pt-0 text-text-muted font-body-md">{faq.a}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg mb-stack-lg overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Patient Testimonials</h2>
        <p className="text-text-muted font-body-md">Real stories from patients who trust HealthFlow for their clinical needs.</p>
      </div>
      <div
        className="flex gap-gutter overflow-x-auto pb-8 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="flex-none snap-center" style={{ width: 'min(400px, 85vw)' }}>
            <div className="bg-surface-container-lowest border border-border-light rounded-lg p-8 h-full flex flex-col shadow-sm">
              <div className="flex gap-1 mb-4 text-secondary">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="material-symbols-outlined text-sm icon-fill">star</span>
                ))}
              </div>
              <p className="font-body-md italic text-on-surface mb-6 flex-grow">{t.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-label-md text-primary">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
                <span className="bg-secondary-container/10 text-secondary text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Verified
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full py-stack-lg px-margin-mobile md:px-margin-desktop bg-primary text-on-primary">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="md:col-span-1">
          <span className="font-headline-md text-headline-md font-bold text-on-primary block mb-4">HealthFlow</span>
          <p className="text-on-primary-container opacity-80 text-body-md mb-6">
            Providing world-class medical solutions with clinical integrity and digital efficiency.
          </p>
          <div className="flex gap-4">
            {['public', 'groups', 'support_agent'].map(icon => (
              <span key={icon} className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed">{icon}</span>
            ))}
          </div>
        </div>
        <div>
          <h5 className="font-label-md mb-4 text-secondary-fixed">For Patients</h5>
          <ul className="space-y-2 opacity-80">
            {['Find Doctors', 'Video Consult', 'Medicines', 'My Appointments'].map(l => (
              <li key={l}><a href="#" className="hover:text-secondary-fixed transition-colors font-body-md">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-label-md mb-4 text-secondary-fixed">Quick Links</h5>
          <ul className="space-y-2 opacity-80">
            {['About Us', 'Careers', 'Contact Us', 'Privacy Policy'].map(l => (
              <li key={l}><a href="#" className="hover:text-secondary-fixed transition-colors font-body-md">{l}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-label-md mb-4 text-secondary-fixed">Newsletter</h5>
          <p className="text-label-sm opacity-80 mb-4">Get health tips and news delivered weekly.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email"
              className="bg-primary-container/30 border border-on-primary-container/20 rounded-lg px-4 py-2 w-full text-sm text-surface-white placeholder-on-primary-container/60 focus:outline-none focus:border-secondary-fixed"
            />
            <button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-sm flex-shrink-0">Join</button>
          </div>
        </div>
      </div>
      <div className="max-w-container-max mx-auto mt-16 pt-8 border-t border-on-primary-container/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-60">
        <span>© 2026 HealthFlow. All rights reserved.</span>
        <div className="flex gap-8">
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function HomePage() {
  usePageTitle('Home');
  return (
    <motion.div
      className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <GlassNav />
      <HeroCarousel />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg w-full">
        <SpecialtyCarousel />
        <HowItWorks />
        <FeaturedDoctors />
      </main>
      <FAQ />
      <Testimonials />
      <Footer />
    </motion.div>
  );
}
