import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import usePageTitle from '../../hooks/usePageTitle';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];
const HOURS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const HOUR_24 = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const SLOT_OPTS = ['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes'];
const BUFFER_OPTS = ['None', '5 Minutes', '10 Minutes', '15 Minutes'];

function TimeOffModal({ onAdd, onClose }) {
  const [label, setLabel] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!label.trim()) return setError('Please enter a label.');
    if (!from) return setError('Please select a start date.');
    const dateStr = to && to !== from
      ? `${new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    onAdd({ id: Date.now(), label: label.trim(), dates: dateStr });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm bg-surface-white rounded-2xl shadow-2xl border border-border-light overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-border-light flex items-center justify-between">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">Add Time Off</h3>
          <button type="button" onClick={onClose}>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-error font-label-sm text-label-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>error</span>{error}
            </p>
          )}
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => { setLabel(e.target.value); setError(''); }}
              placeholder="e.g. Annual Leave, Medical Conference"
              className="w-full px-3 py-2.5 border border-outline-variant rounded-xl font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">From</label>
              <input type="date" value={from} onChange={e => { setFrom(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 border border-outline-variant rounded-xl font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">To <span className="text-text-muted">(optional)</span></label>
              <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2.5 border border-outline-variant rounded-xl font-body-md bg-surface-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border-light font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
              Add
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DoctorSchedulePage() {
  usePageTitle('Schedule');
  const [grid, setGrid] = useState(() => {
    const g = {};
    DAYS.forEach((_, di) => { g[di] = {}; HOURS.forEach((_, hi) => { g[di][hi] = di < 5; }); });
    return g;
  });
  const [enabledDays, setEnabledDays] = useState(() => {
    const e = {}; DAYS.forEach((_, i) => { e[i] = i < 5; }); return e;
  });
  const [slotDuration, setSlotDuration] = useState('30 Minutes');
  const [buffer, setBuffer] = useState('5 Minutes');
  const [timeOff, setTimeOff] = useState([
    { id: 1, label: 'Annual Leave', dates: 'Oct 12 – Oct 20' },
    { id: 2, label: 'Medical Conference', dates: 'Nov 5, 2026' },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);

  function toggleSlot(di, hi) {
    if (!enabledDays[di]) return;
    setGrid(p => ({ ...p, [di]: { ...p[di], [hi]: !p[di][hi] } }));
  }
  function toggleDay(di) { setEnabledDays(p => ({ ...p, [di]: !p[di] })); }
  function removeTimeOff(id) { setTimeOff(p => p.filter(t => t.id !== id)); }

  async function saveSchedule() {
    setSaving(true); setSaveError('');
    const availability = [];
    DAY_INDICES.forEach((dayOfWeek, di) => {
      if (!enabledDays[di]) return;
      let start = null;
      HOURS.forEach((_, hi) => {
        if (grid[di][hi] && start === null) start = hi;
        if (!grid[di][hi] && start !== null) {
          availability.push({ dayOfWeek, startTime: HOUR_24[start], endTime: HOUR_24[hi], slotDurationMinutes: 30 });
          start = null;
        }
      });
      if (start !== null) availability.push({ dayOfWeek, startTime: HOUR_24[start], endTime: '18:00', slotDurationMinutes: 30 });
    });
    try {
      await api.patch('/doctors/me/availability', { availability });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-container-max mx-auto">
      <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-1">Schedule & Availability</h1>
          <p className="font-body-lg text-body-lg text-text-muted">Manage your working hours, break times, and vacations.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {saveError && (
            <p className="font-label-sm text-label-sm text-error flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>error</span>{saveError}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()}
              className="px-6 py-2 border border-outline-variant rounded-full text-text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors">
              Discard
            </button>
            <button onClick={saveSchedule} disabled={saving}
              className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-2 disabled:opacity-60 ${saved ? 'bg-[#e6f4ea] text-[#1e8e3e]' : 'bg-primary text-on-primary hover:opacity-90'}`}>
              <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>
                {saving ? 'autorenew' : saved ? 'check_circle' : 'save'}
              </span>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left column */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Global Settings */}
          <div className="bg-surface-white rounded-lg border border-border-light p-stack-md">
            <h3 className="font-title-lg text-title-lg text-primary mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined">tune</span> Global Settings
            </h3>
            <div className="space-y-4">
              {[['Default Slot Duration', SLOT_OPTS, slotDuration, setSlotDuration], ['Buffer Between Appointments', BUFFER_OPTS, buffer, setBuffer]].map(([label, opts, val, setter]) => (
                <div key={label}>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">{label}</label>
                  <div className="relative">
                    <select value={val} onChange={e => setter(e.target.value)}
                      className="w-full bg-surface-white border border-outline-variant rounded-lg p-2.5 font-body-md appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-text-muted">expand_more</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Off */}
          <div className="bg-surface-white rounded-lg border border-border-light p-stack-md">
            <div className="flex justify-between items-center mb-stack-md">
              <h3 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">flight_takeoff</span> Time Off
              </h3>
              <button onClick={() => setShowTimeOffModal(true)}
                className="flex items-center gap-1 text-primary font-label-md text-label-md hover:opacity-80 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-sm">add</span> Add
              </button>
            </div>
            <div className="space-y-2">
              {timeOff.length === 0 && (
                <p className="font-body-md text-body-md text-text-muted text-center py-6">No time off scheduled.</p>
              )}
              {timeOff.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl border border-border-light">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{t.label}</p>
                    <p className="font-label-sm text-label-sm text-text-muted">{t.dates}</p>
                  </div>
                  <button onClick={() => removeTimeOff(t.id)} className="text-error hover:opacity-80 p-1 rounded-lg hover:bg-error-container transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Availability Grid */}
        <div className="lg:col-span-8 bg-surface-white rounded-lg border border-border-light p-stack-md overflow-hidden">
          <div className="flex justify-between items-center mb-stack-md">
            <h3 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">view_week</span> Weekly Availability
            </h3>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              <span className="font-label-sm text-label-sm text-text-muted">Available</span>
              <span className="w-3 h-3 rounded-full border border-outline-variant bg-surface-container-low inline-block" />
              <span className="font-label-sm text-label-sm text-text-muted">Unavailable</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="text-center font-label-sm text-label-sm text-text-muted">Time</div>
                {DAYS.map((day, di) => (
                  <div key={day} className="text-center">
                    <div className={`font-label-md text-label-md ${enabledDays[di] ? 'text-on-surface' : 'text-text-muted'}`}>{day}</div>
                    <label className="inline-flex items-center mt-1 cursor-pointer">
                      <input type="checkbox" checked={enabledDays[di]} onChange={() => toggleDay(di)} className="sr-only peer" />
                      <div className="relative w-9 h-5 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {HOURS.map((hour, hi) => (
                  <div key={hour} className="grid grid-cols-8 gap-2 items-center">
                    <div className="text-right pr-2 font-label-sm text-label-sm text-text-muted">{hour}</div>
                    {DAYS.map((_, di) => {
                      const enabled = enabledDays[di];
                      const sel = grid[di]?.[hi];
                      return (
                        <button key={di} type="button" disabled={!enabled} onClick={() => toggleSlot(di, hi)}
                          className={`h-9 rounded-lg border font-label-sm text-label-sm transition-all ${
                            !enabled
                              ? 'bg-surface-container-low border-outline-variant opacity-30 cursor-not-allowed'
                              : sel
                              ? 'bg-primary border-primary text-on-primary cursor-pointer hover:opacity-80'
                              : 'bg-surface-white border-outline-variant text-text-muted cursor-pointer hover:border-primary hover:bg-primary-fixed'
                          }`}>
                          {enabled && sel && '✓'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTimeOffModal && (
          <TimeOffModal
            onAdd={item => setTimeOff(p => [...p, item])}
            onClose={() => setShowTimeOffModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
