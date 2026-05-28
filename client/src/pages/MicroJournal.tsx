import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MicroTag = 'insight' | 'gratitude' | 'win' | 'lesson' | 'idea' | 'question' | 'observation' | 'quote' | 'intention' | 'other'
type MicroMood = 'excellent' | 'good' | 'neutral' | 'low' | 'struggling'

interface MicroEntry {
  id: string
  tag: MicroTag
  mood: MicroMood
  text: string
  energy: number
  date: string
  time: string
  createdAt: string
}

const TAG_CONFIG: Record<MicroTag, { label: string; emoji: string; color: string }> = {
  insight:     { label: 'Insight',     emoji: '💡', color: '#f59e0b' },
  gratitude:   { label: 'Gratitude',   emoji: '✨', color: '#22c55e' },
  win:         { label: 'Win',         emoji: '🏆', color: '#f97316' },
  lesson:      { label: 'Lesson',      emoji: '📖', color: '#6366f1' },
  idea:        { label: 'Idea',        emoji: '🚀', color: '#3b82f6' },
  question:    { label: 'Question',    emoji: '❓', color: '#a855f7' },
  observation: { label: 'Observation', emoji: '👁️', color: '#0ea5e9' },
  quote:       { label: 'Quote',       emoji: '💬', color: '#ec4899' },
  intention:   { label: 'Intention',   emoji: '🎯', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '📝', color: '#94a3b8' },
}

const MOOD_CONFIG: Record<MicroMood, { label: string; emoji: string; color: string }> = {
  excellent:  { label: 'Excellent',  emoji: '🌟', color: '#22c55e' },
  good:       { label: 'Good',       emoji: '😊', color: '#84cc16' },
  neutral:    { label: 'Neutral',    emoji: '😐', color: '#94a3b8' },
  low:        { label: 'Low',        emoji: '😔', color: '#f59e0b' },
  struggling: { label: 'Struggling', emoji: '😞', color: '#ef4444' },
}

const STORAGE_KEY = 'micro_journal'

function getNow() {
  const now = new Date()
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
  }
}

export default function MicroJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MicroEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterTag, setFilterTag] = useState<MicroTag | 'all'>('all')
  const { date: today, time: nowTime } = getNow()
  const [form, setForm] = useState<Omit<MicroEntry, 'id' | 'createdAt'>>({
    tag: 'insight', mood: 'good', text: '', energy: 7,
    date: today, time: nowTime,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MicroEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.text.trim()) return
    const e: MicroEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    const fresh = getNow()
    setForm(f => ({ ...f, text: '', date: fresh.date, time: fresh.time }))
    setShowForm(false)
    toastSuccess('Captured ✍️')
  }

  const todayCount = entries.filter(e => e.date === today).length
  const filtered = filterTag === 'all' ? entries : entries.filter(e => e.tag === filterTag)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <StickyNote className="w-7 h-7 text-lime-400" />
            Micro Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Quick captures throughout the day — thoughts, wins, insights.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-lime-700 hover:bg-lime-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Capture
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-lime-400">{todayCount}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.filter(e => e.tag === 'insight' || e.tag === 'win').length}</div>
          <div className="text-xs text-slate-500">Wins & Insights</div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilterTag('all')}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${filterTag === 'all' ? 'bg-lime-700 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(TAG_CONFIG) as [MicroTag, typeof TAG_CONFIG.insight][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterTag(k)}
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${filterTag === k ? 'text-white' : 'bg-slate-800 text-slate-400'}`}
            style={filterTag === k ? { background: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-lime-500/20 space-y-3">
          <div className="flex gap-2">
            <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value as MicroTag }))} className="game-input text-sm flex-1">
              {(Object.entries(TAG_CONFIG) as [MicroTag, typeof TAG_CONFIG.insight][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value as MicroMood }))} className="game-input text-sm flex-1">
              {(Object.entries(MOOD_CONFIG) as [MicroMood, typeof MOOD_CONFIG.good][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="What's on your mind right now? *" className="game-input w-full h-16 resize-none text-sm" autoFocus />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy: {form.energy}/10</p>
              <input type="range" min={1} max={10} value={form.energy}
                onChange={e => setForm(f => ({ ...f, energy: Number(e.target.value) }))}
                className="w-full h-1 accent-lime-400" />
            </div>
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="game-input text-sm w-24" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-lime-700 hover:bg-lime-600 text-white rounded-xl text-sm font-semibold">Capture</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TAG_CONFIG[e.tag]
          const m = MOOD_CONFIG[e.mood]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-2" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-lg">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-xs">{m.emoji}</span>
                  <span className="text-xs text-slate-600">{e.time} · {e.date}</span>
                  <span className="text-xs text-lime-400">⚡{e.energy}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{e.text}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Capture your thoughts throughout the day. Small entries, big clarity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
