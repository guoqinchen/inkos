// IPC handlers for project initialization
import { ipcMain, dialog } from 'electron';
import * as path from 'node:path';

let projectRoot: string | null = null;

export function registerInitHandlers() {
  ipcMain.handle('init:project-root', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select InkOS Project Directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No directory selected' };
    }

    projectRoot = result.filePaths[0];
    return { success: true, path: projectRoot };
  });

  ipcMain.handle('init:get-project-root', () => {
    return projectRoot;
  });
}

export function getProjectRoot(): string | null {
  return projectRoot;
}
