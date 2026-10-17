import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransitionStore } from '../store/transitionStore';

export default function usePageTransition() {
  const navigate = useNavigate();
  const setTransitioning = useTransitionStore((s) => s.setTransitioning);

  const transitionTo = useCallback((path, delay = 450) => {
    setTransitioning(true);
    setTimeout(() => {
      navigate(path, { replace: true });
      // Keep overlay alive briefly so the new page fades in under it
      setTimeout(() => setTransitioning(false), 300);
    }, delay);
  }, [navigate, setTransitioning]);

  return { transitionTo };
}
