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

document.getElementById('btn-update').addEventListener('click', async () => {
  const btn = document.getElementById('btn-update');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  const ver = await window.tasker.checkUpdate();
  btn.disabled = false;
  btn.textContent = 'Check for Update';
  if (ver) {
    if (confirm(`Tasker v${ver} is available. Open the releases page?`)) {
      // Main process will open browser via shell
      window.tasker.showAbout(); // re-use about dialog which has GitHub link
    }
  } else {
    alert('You have the latest version.');
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
