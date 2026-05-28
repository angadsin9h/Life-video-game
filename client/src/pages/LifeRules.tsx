import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LifeRule {
  id: string
  number: number
  rule: string
  category: string
  elaboration: string
  source: string
  createdAt: string
}

const CATEGORIES = [
  { name: 'Character', color: '#a855f7', emoji: '⚡' },
  { name: 'Work', color: '#3b82f6', emoji: '💼' },
  { name: 'Relationships', color: '#ec4899', emoji: '❤️' },
  { name: 'Health', color: '#22c55e', emoji: '💪' },
  { name: 'Mindset', color: '#f59e0b', emoji: '🧠' },
  { name: 'Finance', color: '#10b981', emoji: '💰' },
  { name: 'Wisdom', color: '#f97316', emoji: '📚' },
  { name: 'Spirit', color: '#6366f1', emoji: '✨' },
]

const EXAMPLES = [
  { rule: 'Never complain without proposing a solution', category: 'Character', source: 'Personal' },
  { rule: 'Do the hardest thing first', category: 'Work', source: 'Mark Twain' },
  { rule: 'Protect your energy like your most scarce resource', category: 'Health', source: 'Personal' },
  { rule: 'Never burn bridges', category: 'Relationships', source: 'Personal' },
  { rule: 'Spend less than you earn, always', category: 'Finance', source: 'Personal' },
  { rule: 'Assume positive intent', category: 'Relationships', source: 'Personal' },
  { rule: 'Progress, not perfection', category: 'Mindset', source: 'Personal' },
  { rule: 'Never miss a chance to be kind', category: 'Character', source: 'Personal' },
]

const STORAGE_KEY = 'life_rules'

export default function LifeRules() {
  const { toastSuccess } = useToast()
  const [rules, setRules] = useState<LifeRule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ rule: '', category: 'Character', elaboration: '', source: 'Personal' })
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setRules(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: LifeRule[]) => {
    const numbered = updated.map((r, i) => ({ ...r, number: i + 1 }))
    setRules(numbered)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(numbered))
  }

  const addRule = () => {
    if (!form.rule.trim()) return
    if (editId) {
      save(rules.map(r => r.id === editId ? { ...r, rule: form.rule.trim(), category: form.category, elaboration: form.elaboration.trim(), source: form.source.trim() } : r))
      setEditId(null)
    } else {
      const rule: LifeRule = {
        id: Date.now().toString(),
        number: rules.length + 1,
        rule: form.rule.trim(),
        category: form.category,
        elaboration: form.elaboration.trim(),
        source: form.source.trim(),
        createdAt: new Date().toISOString(),
      }
      save([...rules, rule])
      toastSuccess(`Rule #${rules.length + 1} added to your constitution!`)
    }
    setForm({ rule: '', category: 'Character', elaboration: '', source: 'Personal' })
    setShowForm(false)
  }

  const startEdit = (r: LifeRule) => {
    setForm({ rule: r.rule, category: r.category, elaboration: r.elaboration, source: r.source })
    setEditId(r.id)
    setShowForm(true)
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = rules.findIndex(r => r.id === id)
    if (idx + dir < 0 || idx + dir >= rules.length) return
    const updated = [...rules]
    ;[updated[idx], updated[idx + dir]] = [updated[idx + dir], updated[idx]]
    save(updated)
  }

  const del = (id: string) => save(rules.filter(r => r.id !== id))

  const catCounts = CATEGORIES.map(c => ({ ...c, count: rules.filter(r => r.category === c.name).length })).filter(c => c.count > 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-violet-400" />
            Life Rules
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Your personal constitution — rules you live by</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ rule: '', category: 'Character', elaboration: '', source: 'Personal' }) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400">{rules.length} Rules Total</span>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded text-xs ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>List</button>
            <button onClick={() => setViewMode('card')} className={`px-2 py-1 rounded text-xs ${viewMode === 'card' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}>Cards</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {catCounts.map(c => (
            <span key={c.name} className="text-xs px-2 py-0.5 rounded-full" style={{ background: c.color + '20', color: c.color }}>
              {c.emoji} {c.name} ({c.count})
            </span>
          ))}
        </div>
      </div>

      {/* Examples */}
      {rules.length === 0 && (
        <div className="game-card p-4">
          <div className="text-xs text-slate-500 mb-3">Examples — click to add:</div>
          <div className="space-y-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => { setForm({ rule: ex.rule, category: ex.category, elaboration: '', source: ex.source }); setShowForm(true) }}
                className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <span className="text-sm text-white">"{ex.rule}"</span>
                <span className="text-xs text-slate-500 ml-2">— {ex.source}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <h3 className="font-semibold text-slate-300">{editId ? 'Edit Rule' : 'New Life Rule'}</h3>
          <textarea value={form.rule} onChange={e => setForm(f => ({ ...f, rule: e.target.value }))}
            placeholder="State your rule clearly and powerfully... (e.g. 'Never complain without a solution')"
            className="game-input w-full h-20 resize-none" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="game-input w-full">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Source / Inspiration</label>
              <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                placeholder="Personal / Author..." className="game-input w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Elaboration (optional)</label>
            <textarea value={form.elaboration} onChange={e => setForm(f => ({ ...f, elaboration: e.target.value }))}
              placeholder="Explain why this rule matters to you, examples, exceptions..."
              className="game-input w-full h-16 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={addRule} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Shield className="w-4 h-4 inline mr-1.5" />{editId ? 'Update Rule' : 'Add to Constitution'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {rules.map(r => {
            const cat = CATEGORIES.find(c => c.name === r.category) || CATEGORIES[0]
            return (
              <div key={r.id} className="game-card p-4 flex items-start gap-3">
                <div className="text-xl font-bold text-slate-600 w-8 flex-shrink-0" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {r.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{r.rule}</div>
                  {r.elaboration && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.elaboration}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cat.color + '20', color: cat.color }}>{cat.emoji} {r.category}</span>
                    {r.source !== 'Personal' && <span className="text-xs text-slate-600">— {r.source}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => move(r.id, -1)} className="p-0.5 text-slate-700 hover:text-slate-400"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => move(r.id, 1)} className="p-0.5 text-slate-700 hover:text-slate-400"><ArrowDown className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(r)} className="p-1 text-slate-600 hover:text-slate-300"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(r.id)} className="p-1 text-slate-700 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'card' && (
        <div className="grid grid-cols-2 gap-3">
          {rules.map(r => {
            const cat = CATEGORIES.find(c => c.name === r.category) || CATEGORIES[0]
            return (
              <div key={r.id} className="game-card p-4" style={{ borderLeft: `3px solid ${cat.color}` }}>
                <div className="text-xs font-bold mb-1" style={{ color: cat.color }}>Rule #{r.number}</div>
                <div className="text-sm text-white font-medium leading-relaxed">"{r.rule}"</div>
                {r.source !== 'Personal' && <div className="text-xs text-slate-600 mt-2">— {r.source}</div>}
              </div>
            )
          })}
        </div>
      )}

      {rules.length === 0 && !showForm && (
        <div className="text-center py-10 text-slate-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No life rules defined yet.</p>
          <p className="text-sm">Your personal constitution guides every decision you make.</p>
        </div>
      )}
    </div>
  )
}
