import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type NVCategory = 'health' | 'relationships' | 'career' | 'freedom' | 'possessions' | 'experiences' | 'abilities' | 'time' | 'other'

interface NVEntry {
  id: string
  category: NVCategory
  what: string
  howLoseIt: string
  whyValue: string
  gratitudeAfter: string
  clarityGained: string
  gratitudeLevel: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<NVCategory, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',       emoji: '💪', color: '#ef4444' },
  relationships: { label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  career:        { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  freedom:       { label: 'Freedom',      emoji: '🦅', color: '#f59e0b' },
  possessions:   { label: 'Possessions',  emoji: '🏠', color: '#22c55e' },
  experiences:   { label: 'Experiences',  emoji: '🌍', color: '#a855f7' },
  abilities:     { label: 'Abilities',    emoji: '🧠', color: '#6366f1' },
  time:          { label: 'Time',         emoji: '⏰', color: '#f97316' },
  other:         { label: 'Other',        emoji: '✨', color: '#94a3b8' },
}

const PROMPTS = [
  'What if I lost my health tomorrow?',
  'What if this relationship ended?',
  'What if I lost my job?',
  'What if I couldn\'t do my favorite hobby?',
  'What if I lost my home?',
  'What if I could no longer travel?',
]

const STORAGE_KEY = 'negative_visualization'

export default function NegativeVisualization() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<NVEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<NVEntry, 'id' | 'createdAt'>>({
    category: 'health', what: '', howLoseIt: '', whyValue: '',
    gratitudeAfter: '', clarityGained: '', gratitudeLevel: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NVEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.what.trim()) return
    const e: NVEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, what: '', howLoseIt: '', whyValue: '', gratitudeAfter: '', clarityGained: '' }))
    setShowForm(false)
    toastSuccess('Stoic practice logged 👁️')
  }

  const avgGratitude = entries.length ? Math.round(entries.reduce((s, e) => s + e.gratitudeLevel, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-indigo-400" />
            Negative Visualization
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Stoic practice: imagine losing what you have to appreciate it more.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Practice
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{new Set(entries.map(e => e.category)).size}</div>
          <div className="text-xs text-slate-500">Areas Explored</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgGratitude}/10</div>
          <div className="text-xs text-slate-500">Avg Gratitude</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Negative Visualization Practice</h3>
          <p className="text-xs text-slate-500 italic">"Memento mori — imagine it gone, and appreciate it more deeply."</p>
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, what: p.replace('What if I lost my ', '').replace('What if I could no longer ', '').replace('?', '') }))}
                className="px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded-lg text-xs">{p}</button>
            ))}
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as NVCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [NVCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))}
            placeholder="What good thing are you imagining losing? *" className="game-input w-full" autoFocus />
          <textarea value={form.howLoseIt} onChange={e => setForm(f => ({ ...f, howLoseIt: e.target.value }))}
            placeholder="Vividly imagine how you could lose it..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whyValue} onChange={e => setForm(f => ({ ...f, whyValue: e.target.value }))}
            placeholder="Why does this matter to you so much?" className="game-input w-full text-sm" />
          <textarea value={form.gratitudeAfter} onChange={e => setForm(f => ({ ...f, gratitudeAfter: e.target.value }))}
            placeholder="What gratitude do you feel now for having it?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.clarityGained} onChange={e => setForm(f => ({ ...f, clarityGained: e.target.value }))}
            placeholder="What clarity or insight did this exercise give you?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Gratitude level after: {form.gratitudeLevel}/10</p>
            <input type="range" min={1} max={10} value={form.gratitudeLevel}
              onChange={e => setForm(f => ({ ...f, gratitudeLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save Practice</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CAT_CONFIG[e.category]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white">{e.what}</span>
                {e.gratitudeAfter && <p className="text-xs text-yellow-300 mt-0.5">🙏 {e.gratitudeAfter}</p>}
                {e.clarityGained && <p className="text-xs text-indigo-300 mt-0.5">💡 {e.clarityGained}</p>}
                <p className="text-xs text-slate-600">{c.label} · gratitude {e.gratitudeLevel}/10 · {e.date}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Imagine losing it. Then appreciate what you already have.</p>
          </div>
        )}
      </div>
    </div>
  )
}
