const express = require('express');
const router = express.Router();
const db = require('../db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'friend',
    emoji TEXT DEFAULT '👤',
    notes TEXT,
    birthday TEXT,
    last_contact TEXT,
    contact_frequency INTEGER DEFAULT 30,
    importance INTEGER DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS relationship_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relationship_id INTEGER NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type TEXT DEFAULT 'talk',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`).run();

function getDaysOverdue(lastContact, frequency) {
  if (!lastContact) return frequency;
  const daysSince = Math.floor((Date.now() - new Date(lastContact + 'T12:00:00').getTime()) / 86400000);
  return daysSince - frequency;
}

// GET / - all relationships with status
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM relationships ORDER BY importance DESC, name ASC').all();
    const today = new Date().toISOString().split('T')[0];
    const result = rows.map(r => {
      const lastInteraction = db.prepare('SELECT date FROM relationship_interactions WHERE relationship_id = ? ORDER BY date DESC LIMIT 1').get(r.id);
      const lastContact = lastInteraction?.date || r.last_contact;
      const overdueDays = getDaysOverdue(lastContact, r.contact_frequency);
      const daysSince = lastContact ? Math.floor((Date.now() - new Date(lastContact + 'T12:00:00').getTime()) / 86400000) : null;
      const isBirthdayUpcoming = r.birthday ? (() => {
        const [, month, day] = r.birthday.split('-');
        const thisYear = new Date().getFullYear();
        const bday = new Date(`${thisYear}-${month}-${day}T12:00:00`);
        if (bday < new Date()) bday.setFullYear(thisYear + 1);
        const daysUntil = Math.ceil((bday - Date.now()) / 86400000);
        return daysUntil <= 30 ? daysUntil : null;
      })() : null;
      return { ...r, lastContact, overdueDays, daysSince, isBirthdayUpcoming };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create relationship
router.post('/', (req, res) => {
  try {
    const { name, category = 'friend', emoji = '👤', notes, birthday, contact_frequency = 30, importance = 3 } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = db.prepare(`
      INSERT INTO relationships (name, category, emoji, notes, birthday, contact_frequency, importance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, emoji, notes || null, birthday || null, contact_frequency, importance);
    res.json(db.prepare('SELECT * FROM relationships WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const r = db.prepare('SELECT * FROM relationships WHERE id = ?').get(id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    const { name, category, emoji, notes, birthday, contact_frequency, importance } = req.body;
    db.prepare(`UPDATE relationships SET name=?, category=?, emoji=?, notes=?, birthday=?, contact_frequency=?, importance=? WHERE id=?`)
      .run(name ?? r.name, category ?? r.category, emoji ?? r.emoji, notes ?? r.notes, birthday ?? r.birthday, contact_frequency ?? r.contact_frequency, importance ?? r.importance, id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM relationship_interactions WHERE relationship_id = ?').run(req.params.id);
    db.prepare('DELETE FROM relationships WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/interact - log interaction
router.post('/:id/interact', (req, res) => {
  try {
    const { date, type = 'talk', notes } = req.body;
    const today = date || new Date().toISOString().split('T')[0];
    db.prepare('INSERT INTO relationship_interactions (relationship_id, date, type, notes) VALUES (?, ?, ?, ?)').run(req.params.id, today, type, notes || null);
    // Update last_contact
    db.prepare('UPDATE relationships SET last_contact = ? WHERE id = ?').run(today, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/history
router.get('/:id/history', (req, res) => {
  try {
    const interactions = db.prepare('SELECT * FROM relationship_interactions WHERE relationship_id = ? ORDER BY date DESC LIMIT 20').all(req.params.id);
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
