// IPC handlers for pipeline operations (write, audit, revise)
// Note: These are stubs that match the actual PipelineRunner API
import { ipcMain, BrowserWindow } from 'electron';
import type { WriteRequest, AuditRequest, ReviseRequest } from '../../shared/types';

export function registerPipelineHandlers(getMainWindow: () => BrowserWindow | null) {

  ipcMain.handle('pipeline:write', async (_event, req: WriteRequest) => {
    // TODO: Integrate with actual PipelineRunner when core package is properly imported
    // The actual API is: runner.writeNextChapter(bookId, wordCount?, temperatureOverride?)
    const win = getMainWindow();
    if (win) {
      win.webContents.send('stream:progress', { status: 'writing', elapsedMs: 0, totalChars: 0, chineseChars: 0 });
    }
    return { success: false, error: 'Pipeline not yet integrated' };
  });

  ipcMain.handle('pipeline:audit', async (_event, req: AuditRequest) => {
    // Actual API: runner.auditDraft(bookId, chapterNumber?)
    return { success: false, error: 'Pipeline not yet integrated' };
  });

  ipcMain.handle('pipeline:revise', async (_event, req: ReviseRequest) => {
    // Actual API: runner.reviseDraft(bookId, chapterNumber?, mode?)
    return { success: false, error: 'Pipeline not yet integrated' };
  });

  ipcMain.handle('pipeline:cancel', async () => {
    return { success: true };
  });
}
