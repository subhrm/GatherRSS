import { app, BrowserWindow, ipcMain } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initDb } from './db'
import { importOpml } from './opml'
import {
  addFeed,
  refreshAllFeeds,
  getFeeds,
  getGroups,
  getArticles,
  getArticleContent,
  markArticleRead,
  markArticleSaved,
  deleteFeed
} from './feed-service'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  initDb();
  createWindow();

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('opml-import', async () => {
    if (!win) return { success: false, message: 'Window not found' };
    return await importOpml(win);
  });

  ipcMain.handle('add-feed', async (_event, url) => {
    return await addFeed(url);
  });

  ipcMain.handle('refresh-feeds', async () => {
    return await refreshAllFeeds();
  });

  ipcMain.handle('get-feeds', () => getFeeds());
  ipcMain.handle('get-groups', () => getGroups());
  // @ts-ignore
  ipcMain.handle('get-articles', (_e, { feedId, groupId, filter, searchQuery }) => getArticles(feedId, groupId, filter, searchQuery));
  ipcMain.handle('get-article-content', (_e, id) => getArticleContent(id));
  ipcMain.handle('mark-read', (_e, { id, isRead }) => markArticleRead(id, isRead));
  ipcMain.handle('mark-saved', (_e, { id, isSaved }) => markArticleSaved(id, isSaved));
  ipcMain.handle('delete-feed', (_e, id) => deleteFeed(id));

  // Group Management
  // @ts-ignore
  ipcMain.handle('create-group', (_e, name) => import('./feed-service').then(m => m.createGroup(name)));
  // @ts-ignore
  ipcMain.handle('rename-group', (_e, { id, name }) => import('./feed-service').then(m => m.renameGroup(id, name)));
  // @ts-ignore
  ipcMain.handle('delete-group', (_e, id) => import('./feed-service').then(m => m.deleteGroup(id)));
  // @ts-ignore
  ipcMain.handle('move-feed-to-group', (_e, { feedId, groupId }) => import('./feed-service').then(m => m.moveFeedToGroup(feedId, groupId)));

  // Background Polling (Simple interval for now)
  setInterval(() => {
    console.log('Background polling...');
    refreshAllFeeds();
  }, 15 * 60 * 1000); // 15 minutes
})
