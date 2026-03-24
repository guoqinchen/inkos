// IPC handlers for configuration — persists via electron-store
import { ipcMain } from 'electron';
import Store from 'electron-store';
import type { GlobalConfig } from '../../shared/types.js';

interface StoreSchema {
  config: GlobalConfig;
}

const defaultConfig: GlobalConfig = {
  llm: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
  },
  models: {},
  notifications: {},
};

// electron-store is ESM — import synchronously here (main process, not sandboxed)
let store: Store<StoreSchema>;

function getStore(): Store<StoreSchema> {
  if (!store) {
    store = new Store<StoreSchema>({
      name: 'inkos-studio-config',
      defaults: { config: defaultConfig },
    });
  }
  return store;
}

export function registerConfigHandlers() {
  ipcMain.handle('config:get', async () => {
    const config = getStore().get('config');
    return { success: true, data: config };
  });

  ipcMain.handle('config:set', async (_event, newConfig: Partial<GlobalConfig>) => {
    const current = getStore().get('config');
    const merged = { ...current, ...newConfig };
    // Preserve nested objects (notifications, models) when partially updated
    if (newConfig.notifications) {
      merged.notifications = { ...current.notifications, ...newConfig.notifications };
    }
    if (newConfig.models) {
      merged.models = { ...current.models, ...newConfig.models };
    }
    getStore().set('config', merged);
    return { success: true };
  });
}
