import { create } from 'zustand';
import type { BookSummary } from '../../../shared/types';

interface DashboardState {
  books: BookSummary[];
  loading: boolean;
  error: string | null;
  setBooks: (books: BookSummary[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  books: [],
  loading: false,
  error: null,
  setBooks: (books) => set({ books }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
