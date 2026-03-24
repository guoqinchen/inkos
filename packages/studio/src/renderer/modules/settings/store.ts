import { create } from 'zustand';
import type { GlobalConfig } from '../../../shared/types';

interface SettingsState {
  config: GlobalConfig | null;
  setConfig: (config: GlobalConfig) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
