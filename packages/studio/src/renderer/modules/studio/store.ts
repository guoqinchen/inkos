import { create } from 'zustand';
import type { WriteProgress } from '../../../shared/types';

interface StudioState {
  currentBookId: string | null;
  currentChapterId: string | null;
  streamBuffer: string;
  writeProgress: WriteProgress | null;
  isWriting: boolean;
  setCurrentBook: (bookId: string) => void;
  setCurrentChapter: (chapterId: string | null) => void;
  appendChunk: (chunk: string) => void;
  clearBuffer: () => void;
  setProgress: (progress: WriteProgress | null) => void;
  setIsWriting: (writing: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  currentBookId: null,
  currentChapterId: null,
  streamBuffer: '',
  writeProgress: null,
  isWriting: false,
  setCurrentBook: (bookId) => set({ currentBookId: bookId }),
  setCurrentChapter: (chapterId) => set({ currentChapterId: chapterId }),
  appendChunk: (chunk) =>
    set((state) => ({ streamBuffer: state.streamBuffer + chunk })),
  clearBuffer: () => set({ streamBuffer: '' }),
  setProgress: (progress) => set({ writeProgress: progress }),
  setIsWriting: (writing) => set({ isWriting: writing }),
}));
