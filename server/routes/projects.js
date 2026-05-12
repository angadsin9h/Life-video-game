const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    category TEXT DEFAULT 'work',
    color TEXT DEFAULT '#8b5cf6',
    emoji TEXT DEFAULT '🚀',
    start_date TEXT,
    target_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS project_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS project_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

// GET / - all projects
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    if (status) { q += ' AND status = ?'; params.push(status); }
    q += ' ORDER BY created_at DESC';
    const projects = db.prepare(q).all(...params);
    const result = projects.map(p => {
      const tasks = db.prepare('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY order_index').all(p.id);
      const updates = db.prepare('SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC LIMIT 3').all(p.id);
      const doneCount = tasks.filter(t => t.done).length;
      return { ...p, tasks, updates, progress: tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0 };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create project
router.post('/', (req, res) => {
  try {
    const { name, description, category = 'work', color = '#8b5cf6', emoji = '🚀', start_date, target_date, tasks = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = db.prepare(`
      INSERT INTO projects (name, description, category, color, emoji, start_date, target_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || null, category, color, emoji, start_date || null, target_date || null);
    const id = result.lastInsertRowid;
    tasks.forEach((t, i) => {
      db.prepare('INSERT INTO project_tasks (project_id, title, order_index) VALUES (?, ?, ?)').run(id, t, i);
    });
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    const projectTasks = db.prepare('SELECT * FROM project_tasks WHERE project_id = ? ORDER BY order_index').all(id);
    res.json({ ...project, tasks: projectTasks, updates: [], progress: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id - update project
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, category, color, emoji, target_date } = req.body;
    const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const completedAt = status === 'completed' ? new Date().toISOString() : (p.completed_at || null);
    db.prepare(`UPDATE projects SET name=?, description=?, status=?, category=?, color=?, emoji=?, target_date=?, completed_at=? WHERE id=?`)
      .run(name ?? p.name, description ?? p.description, status ?? p.status, category ?? p.category, color ?? p.color, emoji ?? p.emoji, target_date ?? p.target_date, completedAt, id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM project_tasks WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM project_updates WHERE project_id = ?').run(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/tasks - add task
router.post('/:id/tasks', (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const count = db.prepare('SELECT COUNT(*) as cnt FROM project_tasks WHERE project_id = ?').get(req.params.id).cnt;
    const result = db.prepare('INSERT INTO project_tasks (project_id, title, order_index) VALUES (?, ?, ?)').run(req.params.id, title, count);
    res.json(db.prepare('SELECT * FROM project_tasks WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:taskId
router.patch('/tasks/:taskId', (req, res) => {
  try {
    const { done } = req.body;
    db.prepare('UPDATE project_tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, req.params.taskId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:taskId
router.delete('/tasks/:taskId', (req, res) => {
  try {
    db.prepare('DELETE FROM project_tasks WHERE id = ?').run(req.params.taskId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/updates - add update
router.post('/:id/updates', (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const result = db.prepare('INSERT INTO project_updates (project_id, content) VALUES (?, ?)').run(req.params.id, content);
    res.json(db.prepare('SELECT * FROM project_updates WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
