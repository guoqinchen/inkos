// IPC handlers for state operations (books, chapters, truth files)
// Note: These are stubs matching the actual StateManager API
import { ipcMain } from 'electron';

export function registerStateHandlers() {

  ipcMain.handle('book:list', async () => {
    // StateManager doesn't have listBooks - this would need to be implemented
    return { success: true, data: [] };
  });

  ipcMain.handle('book:get', async (_event, bookId: string) => {
    // Use StateManager.loadBookConfig(bookId)
    return { success: true, data: null };
  });

  ipcMain.handle('chapter:list', async (_event, bookId: string) => {
    // Use StateManager.loadChapterIndex(bookId)
    return { success: true, data: [] };
  });

  ipcMain.handle('chapter:get', async (_event, bookId: string, chapterNumber: number) => {
    // Chapters are stored as files, not in StateManager directly
    return { success: true, data: null };
  });

  ipcMain.handle('truth:list', async (_event, bookId: string) => {
    // Truth files are in story/ directory
    return { success: true, data: null };
  });

  ipcMain.handle('truth:get', async (_event, bookId: string, fileName: string) => {
    return { success: true, data: null };
  });

  ipcMain.handle('truth:update', async (_event, bookId: string, fileName: string, content: string) => {
    return { success: true };
  });
}
