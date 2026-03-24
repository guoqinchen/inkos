import { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';
import type { DaemonStatus } from '../../shared/types';

interface UseDaemonReturn {
  status: DaemonStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  startDaemon: () => Promise<boolean>;
  stopDaemon: () => Promise<boolean>;
}

export function useDaemon(): UseDaemonReturn {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await ipcRenderer.invoke<DaemonStatus>('daemon:status');
    if (result.success && result.data) {
      setStatus(result.data);
    } else {
      setError(result.error || null);
    }
    setIsLoading(false);
  }, []);

  const startDaemon = useCallback(async (): Promise<boolean> => {
    const result = await ipcRenderer.invoke('daemon:up');
    if (result.success) {
      await refreshStatus();
      return true;
    }
    setError(result.error || null);
    return false;
  }, [refreshStatus]);

  const stopDaemon = useCallback(async (): Promise<boolean> => {
    const result = await ipcRenderer.invoke('daemon:down');
    if (result.success) {
      await refreshStatus();
      return true;
    }
    setError(result.error || null);
    return false;
  }, [refreshStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return { status, isLoading, error, refreshStatus, startDaemon, stopDaemon };
}
