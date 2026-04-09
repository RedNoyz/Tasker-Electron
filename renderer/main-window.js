'use strict';

// ── Version label ──────────────────────────────────────────────────────────
window.tasker.getVersion().then(v => {
  document.getElementById('version-label').textContent = `v${v}`;
});

// ── Audio setup ────────────────────────────────────────────────────────────
const audio = document.getElementById('notif-sound');
window.tasker.getAudioURL().then(url => { audio.src = url; });
window.tasker.onPlaySound(() => {
  audio.currentTime = 0;
  audio.play().catch(() => {}); // ignore if no file present
});

// ── Button wiring ──────────────────────────────────────────────────────────
document.getElementById('about-btn').addEventListener('click', () => window.tasker.showAbout());

document.getElementById('btn-widget').addEventListener('click', () => window.tasker.toggleWidget());

document.getElementById('btn-hide').addEventListener('click', () => window.tasker.hideMain());

document.getElementById('btn-new-task').addEventListener('click', () => window.tasker.openTaskWin());

document.getElementById('btn-task-list').addEventListener('click', () => window.tasker.openTaskList());

const updateBtn = document.getElementById('btn-update');
updateBtn.addEventListener('click', () => {
  updateBtn.disabled = true;
  updateBtn.textContent = 'Checking…';
  window.tasker.checkUpdate();
});

window.tasker.onUpdateStatus(status => {
  updateBtn.disabled = false;
  if (status === 'downloading') {
    updateBtn.textContent = 'Downloading…';
    updateBtn.disabled = true;
  } else if (status === 'latest') {
    updateBtn.textContent = 'Up to date ✓';
    setTimeout(() => { updateBtn.textContent = 'Check for Update'; }, 2000);
  } else if (status === 'error') {
    updateBtn.textContent = 'Update failed';
    setTimeout(() => { updateBtn.textContent = 'Check for Update'; }, 2000);
  }
});

// ── Widget mode toggle ─────────────────────────────────────────────────────
window.tasker.onWidgetMode(enabled => {
  document.body.classList.toggle('widget', enabled);
});

// Widget bar buttons
document.getElementById('wb-back').addEventListener('click',      () => window.tasker.toggleWidget());
document.getElementById('wb-new-task').addEventListener('click',  () => window.tasker.openTaskWin());
document.getElementById('wb-task-list').addEventListener('click', () => window.tasker.openTaskList());
document.getElementById('wb-quit').addEventListener('click',      () => window.tasker.quit());
