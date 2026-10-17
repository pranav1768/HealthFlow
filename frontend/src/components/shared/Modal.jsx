import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

/**
 * Modal — no literal markup exists in the static Stitch exports (they're
 * single-state screens), so this is built from the documented Level 3
 * elevation spec: centered overlay, 40% opacity dark backdrop, ambient
 * shadow, 8px card radius.
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${maxWidth} bg-surface-white rounded-lg shadow-2xl p-stack-md max-h-[90vh] overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between mb-stack-sm">
              {title && <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>}
              <button type="button" onClick={onClose} aria-label="Close" className="ml-auto">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
