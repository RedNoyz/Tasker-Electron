'use strict';

const nameInput = document.getElementById('task-name');
const dateInput = document.getElementById('due-date');
const timeInput = document.getElementById('due-time');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// ── Default date to today, time to now+1h ──────────────────────────────────
(function setDefaults() {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);

  const pad = n => String(n).padStart(2, '0');
  dateInput.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  timeInput.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
})();

// ── Enable submit only when name is non-empty ──────────────────────────────
nameInput.addEventListener('input', () => {
  submitBtn.disabled = nameInput.value.trim() === '';
});

// ── Submit ─────────────────────────────────────────────────────────────────
document.getElementById('task-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name    = nameInput.value.trim();
  const dueDate = `${dateInput.value} ${timeInput.value}`;

  if (!name) return;

  submitBtn.disabled = true;
  await window.tasker.createTask(name, dueDate);

  const toast = document.getElementById('toast');
  document.getElementById('toast-detail').textContent = `Due ${dueDate}`;
  toast.classList.add('show');
  setTimeout(() => window.tasker.closeTaskWin(), 900);
});

// ── Cancel / Escape ────────────────────────────────────────────────────────
cancelBtn.addEventListener('click', () => window.tasker.closeTaskWin());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.tasker.closeTaskWin();
  if (e.key === 'Enter' && !submitBtn.disabled) submitBtn.click();
});
