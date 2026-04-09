'use strict';

let currentFilter  = 'open';
let tasks          = [];
let selectedIds    = new Set();
let sortCol        = null;
let sortDir        = 'asc';

const tbody      = document.getElementById('task-body');
const countLabel = document.getElementById('task-count');

// ── Load & render ──────────────────────────────────────────────────────────
async function loadTasks() {
  tasks = await window.tasker.listTasks(currentFilter);
  selectedIds.clear();
  renderTable();
}

function renderTable() {
  let sorted = [...tasks];
  if (sortCol) {
    sorted.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (sortCol === 'id') { va = Number(va); vb = Number(vb); }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No tasks found.</td></tr>`;
    countLabel.textContent = '0 tasks';
    return;
  }

  countLabel.textContent = `${sorted.length} task${sorted.length !== 1 ? 's' : ''}`;

  tbody.innerHTML = sorted.map(t => {
    const sel      = selectedIds.has(t.id) ? ' selected' : '';
    const badge    = `<span class="badge ${t.status}">${t.status}</span>`;
    const notified = t.notified ? 'Yes' : 'No';
    return `<tr data-id="${t.id}" class="${sel}">
      <td class="id">${t.id}</td>
      <td class="name">${escHtml(t.name)}</td>
      <td class="status center">${badge}</td>
      <td class="notif center">${notified}</td>
      <td class="due">${t.due_date ?? '—'}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', e => onRowClick(row, e));
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Row selection ──────────────────────────────────────────────────────────
function onRowClick(row, e) {
  const id = Number(row.dataset.id);
  if (e.ctrlKey || e.metaKey) {
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  } else if (e.shiftKey && selectedIds.size > 0) {
    // range select
    const allRows = [...tbody.querySelectorAll('tr')];
    const clickIdx = allRows.indexOf(row);
    const lastSel  = allRows.findIndex(r => selectedIds.has(Number(r.dataset.id)));
    const [from, to] = [Math.min(clickIdx, lastSel), Math.max(clickIdx, lastSel)];
    allRows.slice(from, to + 1).forEach(r => selectedIds.add(Number(r.dataset.id)));
  } else {
    selectedIds.clear();
    selectedIds.add(id);
  }
  renderTable();
}

// Ctrl+A select all
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    tasks.forEach(t => selectedIds.add(t.id));
    renderTable();
  }
});

// Click outside table clears selection
document.querySelector('.table-wrap').addEventListener('click', e => {
  if (e.target === e.currentTarget || e.target.tagName === 'TABLE') {
    selectedIds.clear();
    renderTable();
  }
});

// ── Sorting ────────────────────────────────────────────────────────────────
document.querySelectorAll('thead th[data-col]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (!th.classList.contains('sortable')) return;
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }
    document.querySelectorAll('thead th').forEach(h => h.classList.remove('asc','desc'));
    th.classList.add(sortDir);
    renderTable();
  });
});

// ── Filter buttons ─────────────────────────────────────────────────────────
function setFilter(f) {
  currentFilter = f;
  document.getElementById('filter-open').classList.toggle('primary',     f === 'open');
  document.getElementById('filter-complete').classList.toggle('primary', f === 'complete');
  document.getElementById('filter-all').classList.toggle('primary',      f === 'all');
  loadTasks();
}

document.getElementById('filter-open').addEventListener('click',     () => setFilter('open'));
document.getElementById('filter-complete').addEventListener('click', () => setFilter('complete'));
document.getElementById('filter-all').addEventListener('click',      () => setFilter('all'));
document.getElementById('btn-refresh').addEventListener('click',     () => loadTasks());

// ── Mark done ──────────────────────────────────────────────────────────────
document.getElementById('btn-done').addEventListener('click', async () => {
  if (selectedIds.size === 0) { alert('Please select a task first.'); return; }
  for (const id of selectedIds) await window.tasker.completeTask(id);
  await loadTasks();
});

// ── Delete ─────────────────────────────────────────────────────────────────
document.getElementById('btn-delete').addEventListener('click', async () => {
  if (selectedIds.size === 0) { alert('Please select a task first.'); return; }
  if (!confirm(`Delete ${selectedIds.size} task(s)? This cannot be undone.`)) return;
  for (const id of selectedIds) await window.tasker.deleteTask(id);
  await loadTasks();
});

// ── Initial load ───────────────────────────────────────────────────────────
loadTasks();
