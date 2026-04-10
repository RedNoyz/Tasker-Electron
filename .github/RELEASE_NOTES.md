# Tasker v1.0.0

> A lightweight Windows desktop task manager with due-date reminders that actually get your attention.

Full rewrite of the original Python/Tkinter app — rebuilt from scratch with Electron and a modern dark UI.

---

## ✨ Highlights

| | Feature | Details |
|---|---|---|
| 📝 | **Quick task entry** | Global hotkey `Ctrl+Shift+Space` opens a compact form from anywhere |
| ⏰ | **Smart reminders** | Always-on-top popup with notification sound when a task is due |
| 💤 | **Flexible snooze** | 1h · 3h · Tomorrow 9 AM · Next Monday 9 AM · Custom date/time |
| 🔄 | **Auto-updater** | Downloads and installs updates in the background — no manual downloads |
| 🪟 | **Widget mode** | Tiny always-on-top button bar for quick access |
| 🔔 | **System tray** | Runs silently — closing the window hides to tray, not quit |
| 📃 | **Task list** | Sortable, filterable view of all open and completed tasks |
| 💾 | **Local-only storage** | SQLite database on your machine — no cloud, no accounts |

---

## 🎯 How it works

```
Add a task ──► Forget about it ──► Reminder pops up ──► Snooze or Complete
    │                                     │
    │  Ctrl+Shift+Space                   │  Close without acting?
    │  or "New Task" button               │  Auto-snooze 1 hour
    ▼                                     ▼
  Set name + due date/time          Multiple reminders queue up
                                    and show one at a time
```

---

## 💻 Installation

1. Download **`Tasker-Setup.exe`** from the assets below
2. Run it — Windows SmartScreen may warn: click *More info* → *Run anyway*
3. Choose install location → finish setup

The app launches automatically and minimizes to your system tray.

> **Future updates** will be delivered automatically through the built-in updater — no need to come back here.

---

## 🆕 What's new in v1.0.0

- 🏗️ Complete rewrite from Python/Tkinter → **Electron + vanilla JS**
- 🎨 Modern **dark theme** with consistent styling across all windows
- 🔄 **Auto-updater** via `electron-updater` (replaces manual "open releases page" flow)
- 🍞 Styled **toast notifications** instead of native OS popups
- 📐 Proper **window sizing** using content dimensions
- 📋 GitHub Actions **CI/CD** builds and uploads the installer automatically

---

## 🛠️ Tech

Built with **Electron 34** · **sql.js** · **electron-updater** · vanilla JS/HTML/CSS

---

Found a bug or have an idea? [Open an issue](https://github.com/RedNoyz/Tasker/issues)
