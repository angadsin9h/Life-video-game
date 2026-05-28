import { useState, useEffect } from 'react'
import { Feather, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StoicPrinciple = 'dichotomy' | 'memento-mori' | 'amor-fati' | 'premeditatio' | 'sympatheia' | 'logos' | 'virtue' | 'tranquility' | 'other'
type StoicEntryType = 'reflection' | 'obstacle' | 'gratitude' | 'practice' | 'quote' | 'journal'

interface StoicEntry {
  id: string
  principle: StoicPrinciple
  entryType: StoicEntryType
  title: string
  content: string
  stoicResponse: string
  lesson: string
  clarity: number
  date: string
  createdAt: string
}

const PRINCIPLE_CONFIG: Record<StoicPrinciple, { label: string; emoji: string; color: string; description: string }> = {
  dichotomy:    { label: 'Dichotomy of Control', emoji: '⚖️', color: '#6366f1', description: 'What is and isn\'t in our control' },
  'memento-mori': { label: 'Memento Mori',       emoji: '⏳', color: '#94a3b8', description: 'Remember you are mortal' },
  'amor-fati':  { label: 'Amor Fati',            emoji: '🔥', color: '#f59e0b', description: 'Love of fate — embrace all that happens' },
  premeditatio: { label: 'Premeditatio Malorum', emoji: '🛡️', color: '#3b82f6', description: 'Premeditate adversity' },
  sympatheia:   { label: 'Sympatheia',            emoji: '🌍', color: '#22c55e', description: 'Interconnectedness of all things' },
  logos:        { label: 'Logos / Reason',        emoji: '🧠', color: '#a855f7', description: 'Living according to reason' },
  virtue:       { label: 'Virtue',                emoji: '⚡', color: '#ec4899', description: 'The only true good' },
  tranquility:  { label: 'Tranquility',           emoji: '🌊', color: '#0ea5e9', description: 'Ataraxia — inner peace' },
  other:        { label: 'Other',                 emoji: '📜', color: '#64748b', description: '' },
}

const ENTRY_CONFIG: Record<StoicEntryType, { label: string; color: string }> = {
  reflection: { label: 'Reflection',  color: '#6366f1' },
  obstacle:   { label: 'Obstacle',    color: '#ef4444' },
  gratitude:  { label: 'Gratitude',   color: '#22c55e' },
  practice:   { label: 'Practice',    color: '#f59e0b' },
  quote:      { label: 'Quote',       color: '#a855f7' },
  journal:    { label: 'Journal',     color: '#3b82f6' },
}

const STOIC_PROMPTS = [
  'What can I control today? What must I release?',
  'How would Marcus Aurelius handle this situation?',
  'What would this look like from the view of 10 years?',
  'Is this obstacle the way? How can I use it?',
  'Am I acting virtuously right now?',
  'What would I regret on my deathbed if left undone?',
]

const STORAGE_KEY = 'stoic_practice'

export default function StoicPractice() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<StoicEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<StoicEntry, 'id' | 'createdAt'>>({
    principle: 'dichotomy', entryType: 'reflection', title: '', content: '',
    stoicResponse: '', lesson: '', clarity: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: StoicEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const e: StoicEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', content: '', stoicResponse: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Stoic practice recorded 📜')
  }

  const avgClarity = entries.length ? Math.round(entries.reduce((s, e) => s + e.clarity, 0) / entries.length) : 0
  const principleCount = [...new Set(entries.map(e => e.principle))].length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Feather className="w-7 h-7 text-indigo-400" />
            Stoic Practice
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Apply ancient wisdom to modern life challenges.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Record
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{principleCount}</div>
          <div className="text-xs text-slate-500">Principles</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgClarity}/10</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      <div className="game-card p-3 space-y-1">
        <p className="text-xs text-slate-500 font-semibold">Today's Prompt</p>
        <p className="text-sm text-indigo-300 italic">
          "{STOIC_PROMPTS[new Date().getDay() % STOIC_PROMPTS.length]}"
        </p>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Stoic Entry</h3>
          <div className="flex gap-2">
            <select value={form.principle} onChange={e => setForm(f => ({ ...f, principle: e.target.value as StoicPrinciple }))} className="game-input text-sm flex-1">
              {(Object.entries(PRINCIPLE_CONFIG) as [StoicPrinciple, typeof PRINCIPLE_CONFIG.dichotomy][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value as StoicEntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(ENTRY_CONFIG) as [StoicEntryType, typeof ENTRY_CONFIG.reflection][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (optional)" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="What happened / what are you reflecting on? *" className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.stoicResponse} onChange={e => setForm(f => ({ ...f, stoicResponse: e.target.value }))}
            placeholder="The stoic response / reframe..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Key lesson or virtue applied" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Mental clarity after: {form.clarity}/10</p>
            <input type="range" min={1} max={10} value={form.clarity}
              onChange={e => setForm(f => ({ ...f, clarity: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Record</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PRINCIPLE_CONFIG[e.principle]
          const t = ENTRY_CONFIG[e.entryType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{p.label}</span>
                  <span className="text-xs text-yellow-400">✨ {e.clarity}/10</span>
                </div>
                {e.title && <p className="text-xs font-medium text-white mt-1">{e.title}</p>}
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{e.content}</p>
                {e.stoicResponse && <p className="text-xs text-indigo-300 mt-0.5">→ {e.stoicResponse}</p>}
                {e.lesson && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.lesson}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Feather className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The obstacle is the way. Start your stoic practice.</p>
          </div>
        )}
      </div>
    </div>
  )
}
