'use strict';

const fs       = require('fs');
const initSqlJs = require('sql.js');

class TaskerDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db     = null; // set after init()
  }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buf = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buf);
    } else {
      this.db = new SQL.Database();
    }
    this._createTables();
    this._save();
  }

  _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        due_date       TEXT,
        created_at     TEXT DEFAULT (strftime('%Y-%m-%d %H:%M', 'now', 'localtime')),
        notified       INTEGER DEFAULT 0,
        status         TEXT DEFAULT 'open',
        complete_date  TEXT,
        snooze_counter INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS settings (
        key  TEXT PRIMARY KEY,
        name TEXT
      );
    `);
  }

  _save() {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  _all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  _get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }

  _run(sql, params = []) {
    this.db.run(sql, params);
    this._save();
  }

  // ── Pad helper ────────────────────────────────────────────────────────────
  _now() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  _fmt(date) {
    const p = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  createTask(name, dueDate) {
    this._run('INSERT INTO tasks (name, due_date) VALUES (?, ?)', [name, dueDate]);
  }

  getTasks(filter = 'open') {
    if (filter === 'open') {
      return this._all("SELECT id, name, status, notified, due_date FROM tasks WHERE status = 'open' ORDER BY due_date ASC");
    } else if (filter === 'complete') {
      return this._all("SELECT id, name, status, notified, due_date FROM tasks WHERE status = 'complete' ORDER BY due_date ASC");
    } else {
      return this._all('SELECT id, name, status, notified, due_date FROM tasks ORDER BY due_date ASC');
    }
  }

  getDueTasks() {
    const now = this._now();
    return this._all(`
      SELECT id, name, due_date FROM tasks
      WHERE due_date IS NOT NULL
        AND status = 'open'
        AND notified = 0
        AND due_date <= ?
      ORDER BY due_date ASC
    `, [now]);
  }

  markNotified(taskId) {
    this._run('UPDATE tasks SET notified = 1 WHERE id = ?', [taskId]);
  }

  resetOverdueNotified() {
    const now = this._now();
    this._run(`
      UPDATE tasks SET notified = 0
      WHERE notified = 1
        AND status = 'open'
        AND due_date IS NOT NULL
        AND due_date <= ?
    `, [now]);
  }

  snoozeTask(taskId, type, newDate) {
    const row     = this._get('SELECT snooze_counter FROM tasks WHERE id = ?', [taskId]);
    const counter = ((row && row.snooze_counter) || 0) + 1;
    const now     = new Date();
    let dueDate;

    if (type === '1h') {
      dueDate = this._fmt(new Date(now.getTime() + 60 * 60 * 1000));
    } else if (type === '3h') {
      dueDate = this._fmt(new Date(now.getTime() + 3 * 60 * 60 * 1000));
    } else if (type === 'tomorrow') {
      const t = new Date(now); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0);
      dueDate = this._fmt(t);
    } else if (type === 'monday') {
      const day = now.getDay();
      const daysUntil = day === 0 ? 1 : (8 - day) % 7 || 7;
      const t = new Date(now); t.setDate(t.getDate() + daysUntil); t.setHours(9, 0, 0, 0);
      dueDate = this._fmt(t);
    } else if (type === 'custom' && newDate) {
      dueDate = newDate;
    } else {
      throw new Error('Unknown snooze type: ' + type);
    }

    this._run(
      'UPDATE tasks SET due_date = ?, notified = 0, snooze_counter = ? WHERE id = ?',
      [dueDate, counter, taskId]
    );
    return { dueDate, counter };
  }

  completeTask(taskId) {
    const date = this._now();
    this._run(
      "UPDATE tasks SET status = 'complete', complete_date = ? WHERE id = ?",
      [date, taskId]
    );
    return date;
  }

  deleteTask(taskId) {
    this._run('DELETE FROM tasks WHERE id = ?', [taskId]);
  }

  resetAllNotified() {
    this._run("UPDATE tasks SET notified = 0 WHERE status = 'open'");
  }

  close() {
    this._save();
    this.db.close();
  }
}

module.exports = TaskerDB;
