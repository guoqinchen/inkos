import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project init
  initProjectRoot: (projectRoot: string) => ipcRenderer.invoke('init:project-root', projectRoot),

  // Book operations
  listBooks: () => ipcRenderer.invoke('book:list'),
  createBook: (data: unknown) => ipcRenderer.invoke('book:create', data),
  getBook: (bookId: string) => ipcRenderer.invoke('book:get', bookId),
  deleteBook: (bookId: string) => ipcRenderer.invoke('book:delete', bookId),

  // Chapter operations
  listChapters: (bookId: string) => ipcRenderer.invoke('chapter:list', bookId),
  getChapter: (bookId: string, chapterId: string) => ipcRenderer.invoke('chapter:get', bookId, chapterId),
  approveChapter: (bookId: string, chapterId: string) => ipcRenderer.invoke('chapter:approve', bookId, chapterId),

  // Truth files
  listTruthFiles: (bookId: string) => ipcRenderer.invoke('truth:list', bookId),
  getTruthFile: (bookId: string, name: string) => ipcRenderer.invoke('truth:get', bookId, name),
  updateTruthFile: (bookId: string, name: string, content: string) =>
    ipcRenderer.invoke('truth:update', bookId, name, content),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: unknown) => ipcRenderer.invoke('config:set', config),

  // Daemon
  getDaemonStatus: () => ipcRenderer.invoke('daemon:status'),
  daemonUp: () => ipcRenderer.invoke('daemon:up'),
  daemonDown: () => ipcRenderer.invoke('daemon:down'),

  // Analytics
  getAnalytics: (bookId: string) => ipcRenderer.invoke('analytics:get', bookId),

  // Pipeline
  writeChapter: (data: unknown) => ipcRenderer.invoke('pipeline:write', data),
  auditChapter: (data: unknown) => ipcRenderer.invoke('pipeline:audit', data),
  reviseChapter: (data: unknown) => ipcRenderer.invoke('pipeline:revise', data),
  cancelPipeline: () => ipcRenderer.invoke('pipeline:cancel'),

  // WebSocket
  connectWs: (bookId: string) => ipcRenderer.invoke('ws:connect', bookId),

  // Stream events (one-way from main to renderer)
  onStreamChunk: (callback: (chunk: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on('stream:chunk', handler);
    return () => ipcRenderer.removeListener('stream:chunk', handler);
  },
  onStreamProgress: (callback: (progress: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: unknown) => callback(progress);
    ipcRenderer.on('stream:progress', handler);
    return () => ipcRenderer.removeListener('stream:progress', handler);
  },
  onStreamComplete: (callback: (result: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: unknown) => callback(result);
    ipcRenderer.on('stream:complete', handler);
    return () => ipcRenderer.removeListener('stream:complete', handler);
  },
  onStreamError: (callback: (error: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: unknown) => callback(error);
    ipcRenderer.on('stream:error', handler);
    return () => ipcRenderer.removeListener('stream:error', handler);
  },
});

// Type declaration for the renderer process
export interface ElectronAPI {
  initProjectRoot: (projectRoot: string) => Promise<{ success: boolean }>;
  listBooks: () => Promise<unknown[]>;
  createBook: (data: unknown) => Promise<{ bookId: string }>;
  getBook: (bookId: string) => Promise<unknown | null>;
  deleteBook: (bookId: string) => Promise<{ success: boolean }>;
  listChapters: (bookId: string) => Promise<unknown[]>;
  getChapter: (bookId: string, chapterId: string) => Promise<unknown | null>;
  approveChapter: (bookId: string, chapterId: string) => Promise<{ success: boolean }>;
  listTruthFiles: (bookId: string) => Promise<unknown | null>;
  getTruthFile: (bookId: string, name: string) => Promise<unknown | null>;
  updateTruthFile: (bookId: string, name: string, content: string) => Promise<{ success: boolean }>;
  getConfig: () => Promise<unknown | null>;
  setConfig: (config: unknown) => Promise<{ success: boolean }>;
  getDaemonStatus: () => Promise<unknown>;
  daemonUp: () => Promise<{ success: boolean }>;
  daemonDown: () => Promise<{ success: boolean }>;
  getAnalytics: (bookId: string) => Promise<unknown | null>;
  writeChapter: (data: unknown) => Promise<unknown | null>;
  auditChapter: (data: unknown) => Promise<unknown | null>;
  reviseChapter: (data: unknown) => Promise<unknown | null>;
  cancelPipeline: () => Promise<{ success: boolean }>;
  connectWs: (bookId: string) => Promise<{ port: number }>;
  onStreamChunk: (callback: (chunk: string) => void) => () => void;
  onStreamProgress: (callback: (progress: unknown) => void) => () => void;
  onStreamComplete: (callback: (result: unknown) => void) => () => void;
  onStreamError: (callback: (error: unknown) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
