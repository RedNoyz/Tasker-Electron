# Tasker

A lightweight Windows desktop task manager with due-date reminders that actually get your attention.

## ✨ Features

- **📝 Quick task entry** — global hotkey `Ctrl+Shift+Space` opens a compact task form from anywhere
- **⏰ Smart reminders** — when a task is due, a popup appears with a notification sound and stays on top until you act on it
- **💤 Flexible snoozing** — 1 hour, 3 hours, tomorrow 9 AM, next Monday 9 AM, or pick any custom date/time
- **📃 Task list** — sortable, filterable view of all your open and completed tasks
- **🪟 Widget mode** — collapse the main window into a tiny always-on-top button bar
- **🔔 System tray** — runs quietly in the background, closing the window hides to tray instead of quitting
- **🔄 Auto-update check** — notifies you when a new version is available on GitHub
- **💾 Local storage** — all data stays on your machine in a SQLite database, no cloud, no accounts

## 🎯 How it works

1. **Add a task** — press `Ctrl+Shift+Space` (or click *New Task*) and enter what needs doing plus a due date and time
2. **Forget about it** — Tasker runs in the system tray and polls for due tasks every 10 seconds
3. **When the time comes** — a reminder window pops up with the task name, due time, and four actions:
   - **Snooze 1h** — quick one-click postponement
   - **Snooze…** dropdown — 3h / Tomorrow 9am / Next Monday 9am
   - **New Date** — pick any custom reschedule time
   - **Complete** — mark it done
4. **Closing without acting** auto-snoozes for 1 hour, so reminders never get accidentally dismissed
5. **Multiple due tasks** queue up — they show one at a time so you can deal with each calmly

## 💻 Installation

1. Download `Tasker-Setup.exe` from the assets below
2. Run it (Windows SmartScreen may warn — click *More info* → *Run anyway*)
3. Choose an install location and finish the setup

The app will launch automatically and minimize to your system tray.

## 🛠️ Tech

Built with **Electron**, **sql.js**, and vanilla JS. Same feature set as the original Python/Tkinter Tasker, rewritten for better performance and a modern UI.

---

Found a bug or have an idea? [Open an issue](https://github.com/RedNoyz/Tasker/issues).
