import { useState, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';
import type { TruthFiles } from '../../shared/types';

interface UseTruthFilesReturn {
  truthFiles: TruthFiles | null;
  isLoading: boolean;
  error: string | null;
  refreshTruthFiles: (bookId: string) => Promise<void>;
  updateTruthFile: (bookId: string, fileName: string, content: string) => Promise<boolean>;
}

export function useTruthFiles() {
  const [truthFiles, setTruthFiles] = useState<TruthFiles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTruthFiles = useCallback(async (bookId: string) => {
    setIsLoading(true);
    setError(null);
    const result = await ipcRenderer.invoke<TruthFiles>('truth:list', bookId);
    if (result.success && result.data) {
      setTruthFiles(result.data);
    } else {
      setError(result.error || null);
    }
    setIsLoading(false);
  }, []);

  const updateTruthFile = useCallback(async (bookId: string, fileName: string, content: string): Promise<boolean> => {
    const result = await ipcRenderer.invoke('truth:update', bookId, fileName, content);
    if (result.success) {
      return true;
    }
    setError(result.error || null);
    return false;
  }, []);

  return { truthFiles, isLoading, error, refreshTruthFiles, updateTruthFile };
}
