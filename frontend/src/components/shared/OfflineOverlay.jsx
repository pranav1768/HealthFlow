import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [retrying, setRetrying] = useState(false);
  const [dots, setDots] = useState('');

  // Track online / offline events
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => { setIsOffline(false); setRetrying(false); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  // Animated ellipsis while retrying
  useEffect(() => {
    if (!retrying) { setDots(''); return; }
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, [retrying]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    // Ping a tiny public resource that's already cached/known
    try {
      await fetch(window.location.origin + '/favicon.png', {
        method: 'HEAD', cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      setIsOffline(false);
      setRetrying(false);
    } catch {
      // Still offline — stop spinner, let user try again
      setRetrying(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-surface/95 backdrop-blur-sm"
          aria-live="assertive"
          role="alert"
        >
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.94, y: 20  }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-4 w-full max-w-sm rounded-2xl border border-border-light bg-surface-white shadow-2xl overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%] animate-[shimmer_2s_linear_infinite]" />

            <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">

              {/* Icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-border-light flex items-center justify-center">
                  {/* Wifi off SVG — inline, zero deps */}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    className="text-on-surface-variant">
                    <line x1="2" y1="2" x2="22" y2="22"/>
                    <path d="M8.5 16.5a5 5 0 0 1 7 0"/>
                    <path d="M2 8.82a15 15 0 0 1 4.17-2.65"/>
                    <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/>
                    <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/>
                    <path d="M5 12.5a10 10 0 0 1 5.17-2.39"/>
                    <line x1="12" y1="20" x2="12.01" y2="20"/>
                  </svg>
                </div>
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  No Internet Connection
                </h2>
                <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                  It seems you're offline. Check your connection and try again — your session will resume automatically.
                </p>
              </div>

              {/* Tips */}
              <div className="w-full rounded-xl bg-surface-container-low border border-border-light p-4 text-left space-y-2">
                {[
                  { icon: 'wifi',         text: 'Check your Wi-Fi or mobile data' },
                  { icon: 'router',       text: 'Restart your router if needed'   },
                  { icon: 'flight',    text: 'Turn off airplane mode'  },
                ].map(({ icon, text }) => (
                  <div key={icon} className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-text-muted flex-shrink-0" style={{ fontSize: '16px' }}>{icon}</span>
                    <span className="font-body-md text-body-md text-text-muted">{text}</span>
                  </div>
                ))}
              </div>

              {/* Retry button */}
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${retrying ? 'animate-spin' : ''}`}
                >
                  {retrying ? 'autorenew' : 'refresh'}
                </span>
                {retrying ? `Checking${dots}` : 'Try Again'}
              </button>

              {/* Auto-reconnect hint */}
              <p className="font-label-sm text-label-sm text-text-muted">
                We'll reconnect automatically when you're back online.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
