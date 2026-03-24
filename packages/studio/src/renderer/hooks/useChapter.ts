import { useState, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';
import type { ChapterMeta, ChapterContent } from '../../shared/types';

interface UseChapterReturn {
  chapters: ChapterMeta[];
  isLoading: boolean;
  error: string | null;
  refreshChapters: (bookId: string) => Promise<void>;
  getChapter: (bookId: string, chapterId: string) => Promise<ChapterContent | null>;
  approveChapter: (bookId: string, chapterId: string) => Promise<boolean>;
}

export function useChapter() {
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChapters = useCallback(async (bookId: string) => {
    setIsLoading(true);
    setError(null);
    const result = await ipcRenderer.invoke<ChapterMeta[]>('chapter:list', bookId);
    if (result.success && result.data) {
      setChapters(result.data);
    } else {
      setError(result.error || null);
    }
    setIsLoading(false);
  }, []);

  const getChapter = useCallback(async (bookId: string, chapterId: string): Promise<ChapterContent | null> => {
    const result = await ipcRenderer.invoke<ChapterContent>('chapter:get', bookId, chapterId);
    if (result.success && result.data) {
      return result.data;
    }
    setError(result.error || null);
    return null;
  }, []);

  const approveChapter = useCallback(async (bookId: string, chapterId: string): Promise<boolean> => {
    const result = await ipcRenderer.invoke('chapter:approve', bookId, chapterId);
    if (result.success) {
      return true;
    }
    setError(result.error || null);
    return false;
  }, []);

  return { chapters, isLoading, error, refreshChapters, getChapter, approveChapter };
}
