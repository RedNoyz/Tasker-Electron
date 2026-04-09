'use strict';

const {
  app, BrowserWindow, Tray, Menu, globalShortcut,
  ipcMain, shell, dialog, nativeImage, protocol, net
} = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const TaskerDB = require('./src/database');

// ── Single instance lock ───────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

// ── Constants ──────────────────────────────────────────────────────────────
const APP_VERSION = '0.6.0';
const GITHUB_API_URL = 'https://api.github.com/repos/RedNoyz/Tasker/releases/latest';

// ── State ──────────────────────────────────────────────────────────────────
let mainWindow   = null;
let taskWindow   = null;
let taskListWin  = null;
let tray         = null;
let db           = null;
let isWidgetMode = false;

const reminderQueue   = [];   // { taskId, taskName, taskDueDate }
let   reminderOpen    = false;
const reminderWindows = [];   // active BrowserWindow instances

// ── Helpers ────────────────────────────────────────────────────────────────
function assetPath(...parts) {
  return path.join(__dirname, 'assets', ...parts);
}

function assetFileURL(filename) {
  return pathToFileURL(assetPath(filename)).href;
}

// Register custom scheme so renderer can load assets safely
protocol.registerSchemesAsPrivileged([
  { scheme: 'tasker-asset', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

// ── Window factories ───────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    resizable: false,
    title: 'Tasker',
    icon: assetPath('favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile(path.join('renderer', 'main-window.html'));
  mainWindow.setMenu(null);

  // Closing main window hides it to tray instead of quitting
  mainWindow.on('close', e => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function openTaskWindow() {
  if (taskWindow && !taskWindow.isDestroyed()) {
    taskWindow.show();
    taskWindow.focus();
    return;
  }
  taskWindow = new BrowserWindow({
    width: 930,
    height: 220,
    resizable: false,
    title: 'Tasker – Add Task',
    icon: assetPath('favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  taskWindow.loadFile(path.join('renderer', 'task-window.html'));
  taskWindow.setMenu(null);
  taskWindow.center();
  taskWindow.on('closed', () => { taskWindow = null; });
}

function openTaskListWindow() {
  if (taskListWin && !taskListWin.isDestroyed()) {
    taskListWin.show();
    taskListWin.focus();
    return;
  }
  taskListWin = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: true,
    title: 'Tasker – Task List',
    icon: assetPath('favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  taskListWin.loadFile(path.join('renderer', 'task-list.html'));
  taskListWin.setMenu(null);
  taskListWin.on('closed', () => { taskListWin = null; });
}

function openReminderWindow(taskId, taskName, taskDueDate, pendingCount) {
  reminderOpen = true;

  const win = new BrowserWindow({
    width: 720,
    height: 240,
    useContentSize: true,
    resizable: false,
    title: 'Tasker – Reminder',
    icon: assetPath('favicon.ico'),
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.loadFile(path.join('renderer', 'reminder.html'), {
    query: {
      taskId:       String(taskId),
      taskName,
      taskDueDate,
      pendingCount: String(pendingCount),
    }
  });
  win.setMenu(null);
  win.center();

  reminderWindows.push(win);

  // When user presses X: ask renderer if an action was taken;
  // if not the renderer will auto-snooze then confirm close.
  win.on('close', e => {
    if (!win._allowClose) {
      e.preventDefault();
      win.webContents.send('window-closing');
    }
  });

  win.on('closed', () => {
    const i = reminderWindows.indexOf(win);
    if (i !== -1) reminderWindows.splice(i, 1);
    reminderOpen = reminderWindows.some(w => !w.isDestroyed());
    checkReminderQueue();
  });
}

function checkReminderQueue() {
  const alive = reminderWindows.filter(w => !w.isDestroyed());
  reminderOpen = alive.length > 0;
  if (!reminderOpen && reminderQueue.length > 0) {
    const { taskId, taskName, taskDueDate } = reminderQueue.shift();
    openReminderWindow(taskId, taskName, taskDueDate, reminderQueue.length);
  }
}

// ── System tray ────────────────────────────────────────────────────────────
function setupTray() {
  const icon = nativeImage.createFromPath(assetPath('favicon.ico'));
  tray = new Tray(icon);
  tray.setToolTip('Tasker');

  const menu = Menu.buildFromTemplate([
    { label: '📂 Open Main Window', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: '📃 Show Task List',   click: () => openTaskListWindow() },
    { type: 'separator' },
    { label: 'ℹ️  About',           click: () => showAbout() },
    { type: 'separator' },
    { label: '❌ Exit',              click: () => quitApp() },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── About dialog ───────────────────────────────────────────────────────────
function showAbout() {
  const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  dialog.showMessageBox(parent, {
    type: 'info',
    title: 'About Tasker',
    message: `Tasker  v${APP_VERSION}`,
    detail: [
      `© ${new Date().getFullYear()} RedNoyz`,
      'Licensed under the MIT License',
      '',
      'This app helps you manage and get reminders for your tasks.',
    ].join('\n'),
    buttons: ['OK', 'GitHub'],
    icon: assetPath('favicon.ico'),
  }).then(({ response }) => {
    if (response === 1) shell.openExternal('https://github.com/RedNoyz/Tasker/releases/latest');
  });
}

// ── Update check ───────────────────────────────────────────────────────────
async function checkForUpdates() {
  try {
    const resp = await fetch(GITHUB_API_URL, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    const remote = (data.tag_name || '').replace(/^v/, '');
    if (!remote) return null;

    const toTuple = v => v.split('.').map(Number);
    const [lA, lB, lC] = toTuple(APP_VERSION);
    const [rA, rB, rC] = toTuple(remote);
    const isNewer = rA > lA || (rA === lA && rB > lB) || (rA === lA && rB === lB && rC > lC);
    return isNewer ? remote : null;
  } catch {
    return null;
  }
}

// ── Background workers ─────────────────────────────────────────────────────
function startPolling() {
  let soundQueued = false;

  // Due-task checker – every 10 s
  setInterval(() => {
    const dueTasks = db.getDueTasks();
    if (dueTasks.length > 0) soundQueued = true;

    for (const task of dueTasks) {
      db.markNotified(task.id);
      reminderQueue.push({ taskId: task.id, taskName: task.name, taskDueDate: task.due_date });
    }

    if (soundQueued && !reminderOpen) {
      soundQueued = false;
      // Play sound in a hidden off-screen window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('play-sound');
      }
    }

    checkReminderQueue();
  }, 10_000);

  // Notified-reset worker – every 30 s
  setInterval(() => {
    if (!reminderOpen) db.resetOverdueNotified();
  }, 30_000);
}

// ── Widget mode ────────────────────────────────────────────────────────────
function enterWidgetMode() {
  isWidgetMode = true;
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setContentSize(260, 50);
  mainWindow.webContents.send('widget-mode', true);
}

function exitWidgetMode() {
  isWidgetMode = false;
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setContentSize(500, 300);
  mainWindow.center();
  mainWindow.webContents.send('widget-mode', false);
}

// ── Quit ───────────────────────────────────────────────────────────────────
function quitApp() {
  db.resetAllNotified();
  app.isQuitting = true;
  if (tray) tray.destroy();
  app.quit();
}

// ── IPC handlers ───────────────────────────────────────────────────────────
function setupIPC() {
  // ── Tasks ────────────────────────────────────────────────────────────────
  ipcMain.handle('task:create', (_e, { name, dueDate }) => {
    db.createTask(name, dueDate);
    return { ok: true };
  });

  ipcMain.handle('task:list', (_e, { filter }) => {
    return db.getTasks(filter);
  });

  ipcMain.handle('task:complete', (_e, { taskId }) => {
    const date = db.completeTask(taskId);
    return { ok: true, date };
  });

  ipcMain.handle('task:delete', (_e, { taskId }) => {
    db.deleteTask(taskId);
    return { ok: true };
  });

  ipcMain.handle('task:snooze', (_e, { taskId, type, newDate }) => {
    const result = db.snoozeTask(taskId, type, newDate);
    return { ok: true, ...result };
  });

  // ── Windows ──────────────────────────────────────────────────────────────
  ipcMain.on('window:show-main',       () => { mainWindow.show(); mainWindow.focus(); });
  ipcMain.on('window:hide-main',       () => { mainWindow.hide(); });
  ipcMain.on('window:open-task',       () => openTaskWindow());
  ipcMain.on('window:close-task',      e  => BrowserWindow.fromWebContents(e.sender)?.close());
  ipcMain.on('window:open-task-list',  () => openTaskListWindow());
  ipcMain.on('window:close-task-list', e  => BrowserWindow.fromWebContents(e.sender)?.close());

  ipcMain.on('window:toggle-widget', () => {
    isWidgetMode ? exitWidgetMode() : enterWidgetMode();
  });

  // Reminder-specific: called by renderer once action/auto-snooze is done
  ipcMain.on('reminder:allow-close', e => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) { win._allowClose = true; win.close(); }
  });

  // ── App ──────────────────────────────────────────────────────────────────
  ipcMain.handle('app:version',      () => APP_VERSION);
  ipcMain.handle('app:check-update', () => checkForUpdates());
  ipcMain.on('app:show-about',       () => showAbout());
  ipcMain.on('app:quit',             () => quitApp());

  ipcMain.handle('app:audio-url', () => assetFileURL('notification_sound.wav'));
}

// ── App lifecycle ──────────────────────────────────────────────────────────
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  // Serve local assets via tasker-asset:// scheme
  protocol.handle('tasker-asset', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ''));
    return net.fetch(pathToFileURL(path.join(__dirname, 'assets', rel)).href);
  });

  db = new TaskerDB(path.join(app.getPath('userData'), 'tasks.db'));
  await db.init();

  setupIPC();
  createMainWindow();
  setupTray();

  globalShortcut.register('Ctrl+Shift+Space', () => openTaskWindow());

  startPolling();

  // Startup update check
  const newVersion = await checkForUpdates();
  if (newVersion) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Update Available',
      message: `Tasker v${newVersion} is available`,
      detail: 'Do you want to open the releases page?',
      buttons: ['Yes', 'No'],
    });
    if (response === 0) shell.openExternal('https://github.com/RedNoyz/Tasker/releases/latest');
  }
});

app.on('window-all-closed', e => e.preventDefault()); // stay alive in tray

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (db) db.close();
});
