import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type NumberCategory = 'health' | 'finance' | 'fitness' | 'productivity' | 'social' | 'learning' | 'personal' | 'custom'
type NumberUnit = 'number' | 'kg' | 'lbs' | 'km' | 'miles' | 'hours' | 'minutes' | 'dollars' | 'percent' | 'calories' | 'steps' | 'reps' | 'pages'

interface TrackedNumber {
  id: string
  name: string
  category: NumberCategory
  unit: NumberUnit
  currentValue: number
  targetValue: number
  startValue: number
  direction: 'up' | 'down'
  notes: string
  history: { value: number; date: string; note: string }[]
  createdAt: string
}

const CAT_CONFIG: Record<NumberCategory, { label: string; emoji: string; color: string }> = {
  health:       { label: 'Health',       emoji: '❤️', color: '#ef4444' },
  finance:      { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  fitness:      { label: 'Fitness',      emoji: '💪', color: '#22c55e' },
  productivity: { label: 'Productivity', emoji: '⚡', color: '#3b82f6' },
  social:       { label: 'Social',       emoji: '👥', color: '#ec4899' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#6366f1' },
  personal:     { label: 'Personal',     emoji: '🌱', color: '#a855f7' },
  custom:       { label: 'Custom',       emoji: '🔢', color: '#94a3b8' },
}

const STORAGE_KEY = 'life_numbers_tracker'

export default function LifeNumbersTracker() {
  const { toastSuccess } = useToast()
  const [trackers, setTrackers] = useState<TrackedNumber[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [logValue, setLogValue] = useState<Record<string, string>>({})
  const [logNote, setLogNote] = useState<Record<string, string>>({})
  const [form, setForm] = useState<Omit<TrackedNumber, 'id' | 'createdAt' | 'history'>>({
    name: '', category: 'health', unit: 'number', currentValue: 0,
    targetValue: 0, startValue: 0, direction: 'up', notes: '',
  })

  useEffect(() => {
    try { setTrackers(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: TrackedNumber[]) => { setTrackers(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const t: TrackedNumber = { id: Date.now().toString(), ...form, history: [], createdAt: new Date().toISOString() }
    save([t, ...trackers])
    setForm({ name: '', category: 'health', unit: 'number', currentValue: 0, targetValue: 0, startValue: 0, direction: 'up', notes: '' })
    setShowForm(false)
    toastSuccess('Number tracker added 📊')
  }

  const logEntry = (id: string) => {
    const val = parseFloat(logValue[id] || '')
    if (isNaN(val)) return
    const note = logNote[id] || ''
    save(trackers.map(t => t.id === id ? {
      ...t,
      currentValue: val,
      history: [{ value: val, date: new Date().toISOString().split('T')[0], note }, ...t.history.slice(0, 29)],
    } : t))
    setLogValue(prev => ({ ...prev, [id]: '' }))
    setLogNote(prev => ({ ...prev, [id]: '' }))
    toastSuccess('Value logged ✅')
  }

  const filtered = trackers.filter(t => filterCat === 'all' || t.category === filterCat)

  const getProgress = (t: TrackedNumber) => {
    const range = Math.abs(t.targetValue - t.startValue)
    if (range === 0) return 0
    const progress = t.direction === 'up'
      ? (t.currentValue - t.startValue) / range
      : (t.startValue - t.currentValue) / range
    return Math.max(0, Math.min(1, progress))
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-cyan-400" />
            Life Numbers
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track any metric that matters in your life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Track
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{trackers.length}</div>
          <div className="text-xs text-slate-500">Metrics</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">
            {trackers.filter(t => getProgress(t) >= 1).length}
          </div>
          <div className="text-xs text-slate-500">Goals Met</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">
            {trackers.reduce((s, t) => s + t.history.length, 0)}
          </div>
          <div className="text-xs text-slate-500">Log Entries</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [NumberCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Metric</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Metric name *" className="game-input flex-1" autoFocus />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as NumberCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [NumberCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as NumberUnit }))} className="game-input text-sm flex-1">
              {(['number','kg','lbs','km','miles','hours','minutes','dollars','percent','calories','steps','reps','pages'] as NumberUnit[]).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'up' | 'down' }))} className="game-input text-sm flex-1">
              <option value="up">↑ Higher is better</option>
              <option value="down">↓ Lower is better</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Start</p>
              <input type="number" value={form.startValue} onChange={e => setForm(f => ({ ...f, startValue: Number(e.target.value), currentValue: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target</p>
              <input type="number" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(t => {
          const c = CAT_CONFIG[t.category]
          const isExp = expanded === t.id
          const progress = getProgress(t)
          const pct = Math.round(progress * 100)
          return (
            <div key={t.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white text-sm">{t.name}</span>
                      <span className="text-sm font-bold text-white">{t.currentValue} <span className="text-xs text-slate-500">{t.unit}</span></span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                </div>
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-xs text-slate-500">Start: {t.startValue} {t.unit} → Target: {t.targetValue} {t.unit}</p>
                  <div className="flex gap-2">
                    <input type="number" value={logValue[t.id] || ''} onChange={e => setLogValue(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="New value" className="game-input flex-1 text-sm" />
                    <input value={logNote[t.id] || ''} onChange={e => setLogNote(prev => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Note" className="game-input flex-1 text-sm" />
                    <button onClick={() => logEntry(t.id)} className="px-3 py-1.5 bg-cyan-700/30 text-cyan-400 rounded-xl text-xs">Log</button>
                  </div>
                  {t.history.slice(0, 5).map((h, i) => (
                    <p key={i} className="text-xs text-slate-500">{h.date}: {h.value} {t.unit}{h.note && ` — ${h.note}`}</p>
                  ))}
                  <button onClick={() => save(trackers.filter(x => x.id !== t.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What gets measured, gets managed. Start tracking your numbers.</p>
          </div>
        )}
      </div>
    </div>
  )
}
