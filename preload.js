'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tasker', {
  // ── Tasks ────────────────────────────────────────────────────────────────
  createTask:   (name, dueDate)        => ipcRenderer.invoke('task:create',   { name, dueDate }),
  listTasks:    (filter = 'open')      => ipcRenderer.invoke('task:list',     { filter }),
  completeTask: (taskId)               => ipcRenderer.invoke('task:complete', { taskId }),
  deleteTask:   (taskId)               => ipcRenderer.invoke('task:delete',   { taskId }),
  snoozeTask:   (taskId, type, newDate)=> ipcRenderer.invoke('task:snooze',   { taskId, type, newDate }),

  // ── Windows ──────────────────────────────────────────────────────────────
  showMain:      () => ipcRenderer.send('window:show-main'),
  hideMain:      () => ipcRenderer.send('window:hide-main'),
  openTaskWin:   () => ipcRenderer.send('window:open-task'),
  closeTaskWin:  () => ipcRenderer.send('window:close-task'),
  openTaskList:  () => ipcRenderer.send('window:open-task-list'),
  closeTaskList: () => ipcRenderer.send('window:close-task-list'),
  toggleWidget:  () => ipcRenderer.send('window:toggle-widget'),

  // Reminder: tell main process it's safe to close the window
  allowClose: () => ipcRenderer.send('reminder:allow-close'),

  // Main tells reminder window to check if action was taken (X button pressed)
  onWindowClosing: (cb) => ipcRenderer.on('window-closing', cb),

  // Main tells main-window renderer to switch widget layout
  onWidgetMode: (cb) => ipcRenderer.on('widget-mode', (_e, enabled) => cb(enabled)),

  // Sound trigger from main -> main-window renderer
  onPlaySound: (cb) => ipcRenderer.on('play-sound', cb),

  // ── App ──────────────────────────────────────────────────────────────────
  getVersion:   () => ipcRenderer.invoke('app:version'),
  checkUpdate:  () => ipcRenderer.invoke('app:check-update'),
  showAbout:    () => ipcRenderer.send('app:show-about'),
  quit:         () => ipcRenderer.send('app:quit'),
  getAudioURL:  () => ipcRenderer.invoke('app:audio-url'),
});
