'use strict';

// ── Parse query params ─────────────────────────────────────────────────────
const params      = new URLSearchParams(location.search);
const taskId      = Number(params.get('taskId'));
const taskName    = params.get('taskName')    ?? '';
const taskDueDate = params.get('taskDueDate') ?? '';
const pendingCount = Number(params.get('pendingCount') ?? 0);

// Track whether the user has already taken an action (snooze / complete)
let actionTaken = false;

// ── Populate UI ────────────────────────────────────────────────────────────
document.getElementById('task-name').textContent = taskName;
document.getElementById('due-label').textContent  = `Due: ${taskDueDate}`;

if (pendingCount > 0) {
  const lbl = document.getElementById('pending-label');
  lbl.textContent = `${pendingCount} more reminder${pendingCount > 1 ? 's' : ''} waiting`;
  lbl.style.color = pendingCount > 5 ? 'var(--danger)' : '';
}

// ── Default reschedule inputs ──────────────────────────────────────────────
(function setDefaults() {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('new-date').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  document.getElementById('new-time').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
})();

// ── Snooze helpers ─────────────────────────────────────────────────────────
function showToast(title, detail) {
  document.getElementById('toast-title').textContent  = title;
  document.getElementById('toast-detail').textContent = detail;
  document.getElementById('toast').classList.add('show');
}

async function doSnooze(type, newDate) {
  const result = await window.tasker.snoozeTask(taskId, type, newDate);
  actionTaken = true;
  showToast('⏰ Snoozed', `until ${result.dueDate}`);
  setTimeout(() => window.tasker.allowClose(), 900);
}

async function doComplete() {
  const result = await window.tasker.completeTask(taskId);
  actionTaken = true;
  showToast('✓ Completed', result.date);
  setTimeout(() => window.tasker.allowClose(), 900);
}

// ── Button wiring ──────────────────────────────────────────────────────────
document.getElementById('btn-snooze1h').addEventListener('click', () => doSnooze('1h'));

document.getElementById('btn-complete').addEventListener('click', () => doComplete());

document.getElementById('btn-new-date').addEventListener('click', () => {
  const d = document.getElementById('new-date').value;
  const t = document.getElementById('new-time').value;
  if (!d || !t) return;
  doSnooze('custom', `${d} ${t}`);
});

document.getElementById('snooze-select').addEventListener('change', e => {
  const type = e.target.value;
  if (!type) return;
  doSnooze(type);
  e.target.value = ''; // reset dropdown
});

// ── X-button handler: auto-snooze 1h if no action taken ───────────────────
window.tasker.onWindowClosing(async () => {
  if (!actionTaken) {
    await doSnooze('1h');
    // doSnooze calls allowClose internally
  } else {
    window.tasker.allowClose();
  }
});
