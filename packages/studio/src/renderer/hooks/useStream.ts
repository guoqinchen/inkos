import { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';

interface StreamProgress {
  elapsedMs: number;
  totalChars: number;
  chineseChars: number;
  status: 'writing' | 'settling' | 'complete' | 'error';
}

interface UseStreamReturn {
  chunks: string[];
  progress: StreamProgress | null;
  isStreaming: boolean;
  error: string | null;
  startStream: (bookId: string, options?: { guidance?: string; pov?: string }) => void;
  stopStream: () => void;
}

export function useStream(): UseStreamReturn {
  const [chunks, setChunks] = useState<string[]>([]);
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleChunk = (data: unknown) => {
      const d = data as { chunk: string };
      setChunks((prev) => [...prev, d.chunk]);
    };

    const handleProgress = (data: unknown) => {
      setProgress(data as StreamProgress);
    };

    const handleComplete = () => {
      setIsStreaming(false);
    };

    const handleError = (data: unknown) => {
      const d = data as { error: string };
      setError(d.error);
      setIsStreaming(false);
    };

    ipcRenderer.on('stream:chunk', handleChunk as (data: unknown) => void);
    ipcRenderer.on('stream:progress', handleProgress as (data: unknown) => void);
    ipcRenderer.on('stream:complete', handleComplete);
    ipcRenderer.on('stream:error', handleError as (data: unknown) => void);

    return () => {
      ipcRenderer.removeListener('stream:chunk', handleChunk as (data: unknown) => void);
      ipcRenderer.removeListener('stream:progress', handleProgress as (data: unknown) => void);
      ipcRenderer.removeListener('stream:complete', handleComplete);
      ipcRenderer.removeListener('stream:error', handleError as (data: unknown) => void);
    };
  }, []);

  const startStream = useCallback((bookId: string, options?: { guidance?: string; pov?: string }) => {
    setChunks([]);
    setProgress(null);
    setError(null);
    setIsStreaming(true);
    ipcRenderer.invoke('pipeline:write', { bookId, ...options });
  }, []);

  const stopStream = useCallback(() => {
    ipcRenderer.invoke('pipeline:cancel');
    setIsStreaming(false);
  }, []);

  return { chunks, progress, isStreaming, error, startStream, stopStream };
}
