import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TimeRelationship = 'past' | 'present' | 'future' | 'eternal' | 'cyclical' | 'linear' | 'elastic' | 'wasted' | 'savored' | 'invested'
type TimeQuality = 'squandering' | 'passing' | 'using' | 'spending' | 'investing' | 'transcending'

interface TimePhilosophyEntry {
  id: string
  relationship: TimeRelationship
  quality: TimeQuality
  philosophicalInquiry: string
  howYouRelateToTime: string
  timeWastedRecently: string
  timeWellUsed: string
  mortalityAwareness: string
  timeDesign: string
  legacyOfTime: string
  presenceScore: number
  date: string
  createdAt: string
}

const RELATIONSHIP_CONFIG: Record<TimeRelationship, { label: string; emoji: string; color: string }> = {
  past:      { label: 'Past',       emoji: '⏮️', color: '#94a3b8' },
  present:   { label: 'Present',    emoji: '⏺️', color: '#22c55e' },
  future:    { label: 'Future',     emoji: '⏭️', color: '#3b82f6' },
  eternal:   { label: 'Eternal',    emoji: '♾️', color: '#a855f7' },
  cyclical:  { label: 'Cyclical',   emoji: '🔄', color: '#f59e0b' },
  linear:    { label: 'Linear',     emoji: '→', color: '#6366f1' },
  elastic:   { label: 'Elastic',    emoji: '🌊', color: '#ec4899' },
  wasted:    { label: 'Wasted',     emoji: '💨', color: '#ef4444' },
  savored:   { label: 'Savored',    emoji: '☕', color: '#f97316' },
  invested:  { label: 'Invested',   emoji: '📈', color: '#10b981' },
}

const QUALITY_CONFIG: Record<TimeQuality, { label: string; color: string }> = {
  squandering: { label: 'Squandering', color: '#ef4444' },
  passing:     { label: 'Passing',     color: '#f97316' },
  using:       { label: 'Using',       color: '#f59e0b' },
  spending:    { label: 'Spending',    color: '#3b82f6' },
  investing:   { label: 'Investing',   color: '#22c55e' },
  transcending: { label: 'Transcending', color: '#a855f7' },
}

const STORAGE_KEY = 'time_philosophy_log'

export default function TimePhilosophy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<TimePhilosophyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<TimePhilosophyEntry, 'id' | 'createdAt'>>({
    relationship: 'present', quality: 'investing', philosophicalInquiry: '',
    howYouRelateToTime: '', timeWastedRecently: '', timeWellUsed: '',
    mortalityAwareness: '', timeDesign: '', legacyOfTime: '', presenceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: TimePhilosophyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.philosophicalInquiry.trim()) return
    const e: TimePhilosophyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, philosophicalInquiry: '', howYouRelateToTime: '', timeWastedRecently: '', timeWellUsed: '', mortalityAwareness: '', timeDesign: '', legacyOfTime: '' }))
    setShowForm(false)
    toastSuccess('Time philosophy logged — time is the only truly non-renewable resource ⏰')
  }

  const transcending = entries.filter(e => e.quality === 'transcending' || e.quality === 'investing').length
  const avgPresence = entries.length ? Math.round(entries.reduce((s, e) => s + e.presenceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-slate-400" />
            Time Philosophy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Reflect on your relationship with time and how you spend your days.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Reflect
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reflections</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-slate-300">{transcending}</div>
          <div className="text-xs text-slate-500">Investing+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-slate-400">{avgPresence}/10</div>
          <div className="text-xs text-slate-500">Avg Presence</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-slate-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Time Reflection</h3>
          <div className="flex gap-2">
            <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value as TimeRelationship }))} className="game-input text-sm flex-1">
              {(Object.entries(RELATIONSHIP_CONFIG) as [TimeRelationship, typeof RELATIONSHIP_CONFIG.present][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as TimeQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [TimeQuality, typeof QUALITY_CONFIG.investing][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          <input value={form.philosophicalInquiry} onChange={e => setForm(f => ({ ...f, philosophicalInquiry: e.target.value }))}
            placeholder="Your philosophical inquiry about time *" className="game-input w-full text-sm" autoFocus />
          <input value={form.howYouRelateToTime} onChange={e => setForm(f => ({ ...f, howYouRelateToTime: e.target.value }))}
            placeholder="How do you currently relate to time?" className="game-input w-full text-sm" />
          <input value={form.timeWastedRecently} onChange={e => setForm(f => ({ ...f, timeWastedRecently: e.target.value }))}
            placeholder="Time wasted recently you regret" className="game-input w-full text-sm" />
          <input value={form.timeWellUsed} onChange={e => setForm(f => ({ ...f, timeWellUsed: e.target.value }))}
            placeholder="Time spent that felt truly meaningful" className="game-input w-full text-sm" />
          <input value={form.mortalityAwareness} onChange={e => setForm(f => ({ ...f, mortalityAwareness: e.target.value }))}
            placeholder="How does mortality awareness shift your time use?" className="game-input w-full text-sm" />
          <input value={form.timeDesign} onChange={e => setForm(f => ({ ...f, timeDesign: e.target.value }))}
            placeholder="How are you designing your time going forward?" className="game-input w-full text-sm" />
          <input value={form.legacyOfTime} onChange={e => setForm(f => ({ ...f, legacyOfTime: e.target.value }))}
            placeholder="What will your use of time leave behind?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Presence in your moments: {form.presenceScore}/10</p>
            <input type="range" min={1} max={10} value={form.presenceScore}
              onChange={e => setForm(f => ({ ...f, presenceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-slate-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = RELATIONSHIP_CONFIG[e.relationship]
          const q = QUALITY_CONFIG[e.quality]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{r.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-slate-400">⏰ {e.presenceScore}/10</span>
                </div>
                {e.philosophicalInquiry && <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">"{e.philosophicalInquiry}"</p>}
                {e.timeDesign && <p className="text-xs text-cyan-300/70 mt-0.5">→ {e.timeDesign}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The way you spend your days is the way you spend your life.</p>
          </div>
        )}
      </div>
    </div>
  )
}
