import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelapseArea = 'diet' | 'alcohol' | 'social-media' | 'smoking' | 'gambling' | 'spending' | 'exercise' | 'sleep' | 'work' | 'relationship' | 'other'
type RelapseType = 'full' | 'partial' | 'close-call' | 'recovered'

interface RelapseEntry {
  id: string
  area: RelapseArea
  type: RelapseType
  trigger: string
  what: string
  feelings: string
  whatHelped: string
  lesson: string
  daysSober: number
  willingness: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<RelapseArea, { label: string; emoji: string; color: string }> = {
  diet:          { label: 'Diet',         emoji: '🥗', color: '#22c55e' },
  alcohol:       { label: 'Alcohol',      emoji: '🍺', color: '#f59e0b' },
  'social-media':{ label: 'Social Media', emoji: '📱', color: '#3b82f6' },
  smoking:       { label: 'Smoking',      emoji: '🚬', color: '#6366f1' },
  gambling:      { label: 'Gambling',     emoji: '🎰', color: '#ef4444' },
  spending:      { label: 'Spending',     emoji: '💸', color: '#f97316' },
  exercise:      { label: 'Exercise',     emoji: '💪', color: '#ec4899' },
  sleep:         { label: 'Sleep',        emoji: '😴', color: '#a855f7' },
  work:          { label: 'Work',         emoji: '💼', color: '#94a3b8' },
  relationship:  { label: 'Relationship', emoji: '❤️', color: '#84cc16' },
  other:         { label: 'Other',        emoji: '🔄', color: '#0ea5e9' },
}

const TYPE_CONFIG: Record<RelapseType, { label: string; color: string }> = {
  full:        { label: 'Full Relapse',  color: '#ef4444' },
  partial:     { label: 'Partial',       color: '#f97316' },
  'close-call':{ label: 'Close Call',   color: '#f59e0b' },
  recovered:   { label: 'Recovered',    color: '#22c55e' },
}

const STORAGE_KEY = 'relapse_log'

export default function RelapseLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<RelapseEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<RelapseEntry, 'id' | 'createdAt'>>({
    area: 'diet', type: 'partial', trigger: '', what: '', feelings: '',
    whatHelped: '', lesson: '', daysSober: 0, willingness: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: RelapseEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.what.trim()) return
    const e: RelapseEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, trigger: '', what: '', feelings: '', whatHelped: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Relapse logged — keep going 💪')
  }

  const recovered = entries.filter(e => e.type === 'recovered').length
  const closeCalls = entries.filter(e => e.type === 'close-call').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-blue-400" />
            Relapse Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track setbacks honestly. Every relapse is data for your comeback.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{closeCalls}</div>
          <div className="text-xs text-slate-500">Close Calls</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{recovered}</div>
          <div className="text-xs text-slate-500">Recovered</div>
        </div>
      </div>

      <div className="game-card p-3 border-l-4 border-blue-500">
        <p className="text-xs text-slate-400">💙 A relapse doesn't erase your progress. It's one point in your data. What matters is what you do next. You are not your setbacks.</p>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Entry</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as RelapseArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [RelapseArea, typeof AREA_CONFIG.diet][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as RelapseType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [RelapseType, typeof TYPE_CONFIG.full][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-12 resize-none" autoFocus />
          <input value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
            placeholder="What triggered this?" className="game-input w-full text-sm" />
          <input value={form.feelings} onChange={e => setForm(f => ({ ...f, feelings: e.target.value }))}
            placeholder="How were you feeling before/during/after?" className="game-input w-full text-sm" />
          <input value={form.whatHelped} onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
            placeholder="What helped you recover / regain control?" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Key lesson or strategy going forward" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Days before: {form.daysSober}</p>
              <input type="number" value={form.daysSober} min={0}
                onChange={e => setForm(f => ({ ...f, daysSober: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Willingness: {form.willingness}/10</p>
              <input type="range" min={1} max={10} value={form.willingness}
                onChange={e => setForm(f => ({ ...f, willingness: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = TYPE_CONFIG[e.type]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{a.label} · {e.date}</span>
                  {e.daysSober > 0 && <span className="text-xs text-slate-500">After {e.daysSober}d</span>}
                </div>
                <p className="text-xs text-slate-300 mt-1">{e.what}</p>
                {e.lesson && <p className="text-xs text-green-300 mt-0.5">→ {e.lesson}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your setbacks. They are not failures — they are learning.</p>
          </div>
        )}
      </div>
    </div>
  )
}
