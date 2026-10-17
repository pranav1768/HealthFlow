import { AnimatePresence, motion } from 'framer-motion';
import { useTransitionStore } from '../store/transitionStore';

export default function PageTransitionOverlay() {
  const transitioning = useTransitionStore((s) => s.transitioning);

  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          key="page-transition"
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0c1776 0%, #1a56db 50%, #0c1776 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {/* Animated HealthFlow logo */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-white icon-fill" style={{ fontSize: '32px' }}>
                health_and_safety
              </span>
            </div>
            <span className="text-white font-bold text-2xl tracking-wide">HealthFlow</span>
            {/* Loading dots */}
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/60"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
