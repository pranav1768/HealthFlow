import { create } from 'zustand';

export const useTransitionStore = create((set) => ({
  transitioning: false,
  setTransitioning: (val) => set({ transitioning: val }),
}));
