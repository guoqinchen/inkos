import { useState, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';
import type { GlobalConfig } from '../../shared/types';

interface UseConfigReturn {
  config: GlobalConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (config: Partial<GlobalConfig>) => Promise<boolean>;
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await ipcRenderer.invoke<GlobalConfig>('config:get');
    if (result.success && result.data) {
      setConfig(result.data);
    } else {
      setError(result.error || null);
    }
    setIsLoading(false);
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<GlobalConfig>): Promise<boolean> => {
    const result = await ipcRenderer.invoke('config:set', newConfig);
    if (result.success) {
      await refreshConfig();
      return true;
    }
    setError(result.error || null);
    return false;
  }, [refreshConfig]);

  return { config, isLoading, error, refreshConfig, updateConfig };
}
