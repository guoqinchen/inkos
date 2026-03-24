// Typed IPC API wrapper for renderer process
// In production, this connects to preload via contextBridge

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

export const ipcRenderer = {
  invoke: async <T = unknown>(channel: string, ...args: unknown[]): Promise<IPCResponse<T>> => {
    // In development, return empty response
    // In production, connects to preload via contextBridge
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.invoke(channel, ...args);
    }
    console.log('[IPC] invoke:', channel, args);
    return { success: false, error: 'Not connected to main process' };
  },
  on: (channel: string, callback: (data: unknown) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.on(channel, callback);
    }
  },
  removeListener: (channel: string, callback: (data: unknown) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.removeListener(channel, callback);
    }
  },
};
