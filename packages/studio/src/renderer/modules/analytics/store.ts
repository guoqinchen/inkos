import { create } from 'zustand';
import type { AnalyticsData } from '../../../shared/types';

interface AnalyticsState {
  data: AnalyticsData | null;
  setData: (data: AnalyticsData | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
