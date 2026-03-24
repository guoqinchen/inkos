import { create } from 'zustand';
import type { DaemonStatus } from '../../../shared/types';

interface MonitorState {
  daemonStatus: DaemonStatus | null;
  setDaemonStatus: (status: DaemonStatus | null) => void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  daemonStatus: null,
  setDaemonStatus: (status) => set({ daemonStatus: status }),
}));
