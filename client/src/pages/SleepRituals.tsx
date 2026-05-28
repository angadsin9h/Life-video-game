import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2, Check, ArrowUp, ArrowDown, Star, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── Types ──────────────────────────────────────────────────────────────────

type RitualCategory = 'Physical' | 'Mental' | 'Environmental'

interface RitualItem {
  id: string
  name: string
  category: RitualCategory
  targetTime: string   // e.g. "9:30 PM"
  duration: number     // minutes
  order: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const RITUALS_KEY = 'sleep_rituals_items'

const CATEGORIES: { name: RitualCategory; color: string; bg: string }[] = [
  { name: 'Physical',      color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
  { name: 'Mental',        color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  { name: 'Environmental', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
]

const PRESETS: Omit<RitualItem, 'id' | 'order'>[] = [
  { name: 'No screens 1hr before bed',     category: 'Environmental', targetTime: '9:00 PM', duration: 60 },
  { name: 'Dim lights',                    category: 'Environmental', targetTime: '9:30 PM', duration: 10 },
  { name: 'Herbal tea',                    category: 'Physical',      targetTime: '9:00 PM', duration: 10 },
  { name: 'Read fiction 20min',            category: 'Mental',        targetTime: '9:30 PM', duration: 20 },
  { name: 'Journal gratitude',             category: 'Mental',        targetTime: '10:00 PM', duration: 10 },
  { name: 'Meditate 10min',               category: 'Mental',        targetTime: '9:45 PM', duration: 10 },
  { name: "Tomorrow's top 3 intentions",  category: 'Mental',        targetTime: '10:15 PM', duration: 5 },
]

const DEFAULT_FORM = {
  name: '',
  category: 'Mental' as RitualCategory,
  targetTime: '9:30 PM',
  duration: 15,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function dailyKey(date: string): string {
  return `sleep_rituals_${date}`
}

function getLast7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()
}

function loadRituals(): RitualItem[] {
  try {
    const raw = localStorage.getItem(RITUALS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadCompletions(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(dailyKey(date))
    const arr: string[] = raw ? JSON.parse(raw) : []
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function saveCompletions(date: string, completed: Set<string>): void {
  localStorage.setItem(dailyKey(date), JSON.stringify(Array.from(completed)))
}

// ── Sleep Gauge ────────────────────────────────────────────────────────────

function SleepGauge({ pct }: { pct: number }) {
  const halfCirc = Math.PI * 50
  const color = pct >= 0.8 ? '#22c55e' : pct >= 0.5 ? '#8b5cf6' : '#f59e0b'

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-44 h-28">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${halfCirc * pct} ${halfCirc}`}
          className="transition-all duration-700"
        />
        <text x="60" y="58" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700"
          style={{ fontFamily: 'Orbitron, monospace' }}>
          {Math.round(pct * 100)}%
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#64748b" fontSize="8">
          COMPLETION
        </text>
      </svg>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SleepRituals() {
  const { toastSuccess } = useToast()
  const today = todayKey()

  const [rituals, setRituals]         = useState<RitualItem[]>([])
  const [completed, setCompleted]     = useState<Set<string>>(new Set())
  const [showForm, setShowForm]       = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [form, setForm]               = useState(DEFAULT_FORM)
  const [activeTab, setActiveTab]     = useState<'tonight' | 'manage'>('tonight')

  // ── Load ──

  useEffect(() => {
    setRituals(loadRituals())
    setCompleted(loadCompletions(today))
  }, [today])

  // ── Persist rituals ──

  const saveRituals = (updated: RitualItem[]) => {
    const sorted = [...updated].sort((a, b) => a.order - b.order)
    setRituals(sorted)
    localStorage.setItem(RITUALS_KEY, JSON.stringify(sorted))
  }

  // ── Ritual CRUD ──

  const addRitual = () => {
    if (!form.name.trim()) return
    const next: RitualItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      targetTime: form.targetTime,
      duration: form.duration,
      order: rituals.length,
    }
    saveRituals([...rituals, next])
    setForm(DEFAULT_FORM)
    setShowForm(false)
    toastSuccess('Ritual added!', form.name)
  }

  const addPreset = (preset: Omit<RitualItem, 'id' | 'order'>) => {
    if (rituals.some(r => r.name === preset.name)) {
      toastSuccess('Already added!', preset.name)
      return
    }
    const next: RitualItem = {
      ...preset,
      id: Date.now().toString(),
      order: rituals.length,
    }
    saveRituals([...rituals, next])
    toastSuccess('Preset added!', preset.name)
  }

  const deleteRitual = (id: string) => {
    const updated = rituals
      .filter(r => r.id !== id)
      .map((r, i) => ({ ...r, order: i }))
    saveRituals(updated)
    const next = new Set(completed)
    next.delete(id)
    setCompleted(next)
    saveCompletions(today, next)
  }

  const moveRitual = (id: string, dir: 'up' | 'down') => {
    const idx = rituals.findIndex(r => r.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === rituals.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const next = [...rituals]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    saveRituals(next.map((r, i) => ({ ...r, order: i })))
  }

  // ── Daily Check-off ──

  const toggleComplete = (id: string) => {
    const next = new Set(completed)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
      const ritual = rituals.find(r => r.id === id)
      if (ritual) {
        const allDone = rituals.every(r => next.has(r.id))
        if (allDone && rituals.length > 0) {
          toastSuccess('Perfect night!', 'All rituals complete!')
        } else {
          toastSuccess('Ritual complete!', ritual.name)
        }
      }
    }
    setCompleted(next)
    saveCompletions(today, next)
  }

  // ── Stats ──

  const validCompleted = rituals.filter(r => completed.has(r.id)).length
  const completionPct = rituals.length === 0 ? 0 : validCompleted / rituals.length

  const avgLast7 = (() => {
    if (rituals.length === 0) return 0
    const dates = getLast7Dates()
    const totals = dates.map(d => {
      const c = loadCompletions(d)
      const valid = rituals.filter(r => c.has(r.id)).length
      return valid / rituals.length
    })
    return totals.reduce((a, b) => a + b, 0) / totals.length
  })()

  // ── Category info ──

  const getCategoryInfo = (cat: RitualCategory) =>
    CATEGORIES.find(c => c.name === cat) ?? CATEGORIES[0]

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Sleep Rituals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Wind down intentionally every night</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setActiveTab('manage') }}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Score gauge + quick stats */}
      <div className="game-card p-5 flex flex-col items-center gap-4 border border-indigo-500/20 bg-indigo-900/5">
        <SleepGauge pct={completionPct} />

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct * 100}%`,
                backgroundColor: completionPct >= 0.8 ? '#22c55e' : completionPct >= 0.5 ? '#8b5cf6' : '#f59e0b',
              }}
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-indigo-400"
              style={{ fontFamily: 'Orbitron, monospace' }}>
              {validCompleted}/{rituals.length}
            </div>
            <div className="text-xs text-slate-500">Tonight</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400"
              style={{ fontFamily: 'Orbitron, monospace' }}>
              {Math.round(completionPct * 100)}%
            </div>
            <div className="text-xs text-slate-500">Completion</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-400"
              style={{ fontFamily: 'Orbitron, monospace' }}>
              {Math.round(avgLast7 * 100)}%
            </div>
            <div className="text-xs text-slate-500">7-day avg</div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
        {(['tonight', 'manage'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
            {tab === 'tonight' ? "Tonight's Checklist" : 'Manage Rituals'}
          </button>
        ))}
      </div>

      {/* ── TONIGHT tab ── */}
      {activeTab === 'tonight' && (
        <div className="space-y-3">
          {rituals.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Moon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="mb-1">No rituals yet.</p>
              <p className="text-sm">Switch to "Manage Rituals" to add some.</p>
            </div>
          ) : (
            rituals.map(ritual => {
              const done = completed.has(ritual.id)
              const cat = getCategoryInfo(ritual.category)
              return (
                <button
                  key={ritual.id}
                  onClick={() => toggleComplete(ritual.id)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    done
                      ? 'bg-indigo-900/20 border-indigo-500/40 opacity-80'
                      : 'game-card hover:border-indigo-500/30'
                  }`}>
                  {/* Checkbox */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    done
                      ? 'bg-indigo-500 border-indigo-400'
                      : 'border-slate-600 bg-slate-800'
                  }`}>
                    {done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {ritual.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${cat.bg} ${cat.color}`}>
                        {ritual.category}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-slate-600">
                        <Clock className="w-3 h-3" />
                        {ritual.targetTime}
                      </span>
                      <span className="text-xs text-slate-600">{ritual.duration}min</span>
                    </div>
                  </div>

                  {done && <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                </button>
              )
            })
          )}

          {rituals.length > 0 && completionPct === 1 && (
            <div className="text-center py-4 text-indigo-300 font-semibold text-sm flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              All rituals complete. Sleep well!
              <Star className="w-4 h-4 text-amber-400" />
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE tab ── */}
      {activeTab === 'manage' && (
        <div className="space-y-4">

          {/* Preset rituals */}
          <div>
            <button
              onClick={() => setShowPresets(p => !p)}
              className="w-full p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-sm text-left flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Quick-add preset rituals
              </span>
              <Plus className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-45' : ''}`} />
            </button>

            {showPresets && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                {PRESETS.map((preset, i) => {
                  const alreadyAdded = rituals.some(r => r.name === preset.name)
                  const cat = getCategoryInfo(preset.category)
                  return (
                    <button
                      key={i}
                      onClick={() => addPreset(preset)}
                      disabled={alreadyAdded}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        alreadyAdded
                          ? 'opacity-40 cursor-default border-slate-700 bg-slate-800'
                          : 'border-slate-700 bg-slate-800 hover:border-indigo-500/40 hover:bg-slate-700'
                      }`}>
                      <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${cat.bg} ${cat.color}`}>
                        {preset.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200">{preset.name}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {preset.targetTime} · {preset.duration}min
                        </div>
                      </div>
                      {alreadyAdded
                        ? <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <Plus className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Add form */}
          {showForm && (
            <div className="game-card p-5 space-y-4 border border-indigo-500/20">
              <h3 className="font-semibold text-slate-300">New Ritual</h3>

              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addRitual()}
                placeholder="e.g. Read fiction for 20 min"
                className="game-input w-full"
                autoFocus
              />

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setForm(f => ({ ...f, category: cat.name }))}
                      className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                        form.category === cat.name
                          ? `${cat.bg} ${cat.color}`
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Time</label>
                  <input
                    value={form.targetTime}
                    onChange={e => setForm(f => ({ ...f, targetTime: e.target.value }))}
                    placeholder="9:30 PM"
                    className="game-input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 10 }))}
                    className="game-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addRitual}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors">
                  Add Ritual
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }}
                  className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500/40 text-slate-500 hover:text-slate-300 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Create custom ritual
            </button>
          )}

          {/* Ritual list with reorder */}
          {rituals.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <Moon className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No rituals yet. Add one above or use presets.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 px-1">Use arrows to reorder</p>
              {rituals.map((ritual, idx) => {
                const cat = getCategoryInfo(ritual.category)
                const done = completed.has(ritual.id)
                return (
                  <div key={ritual.id}
                    className={`game-card p-3 flex items-center gap-3 ${done ? 'border-indigo-500/20' : ''}`}>

                    {/* Order arrows */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => moveRitual(ritual.id, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveRitual(ritual.id, 'down')}
                        disabled={idx === rituals.length - 1}
                        className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Done indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-indigo-400' : 'bg-slate-700'}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {ritual.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${cat.bg} ${cat.color}`}>
                          {ritual.category}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          {ritual.targetTime}
                        </span>
                        <span className="text-xs text-slate-600">{ritual.duration}min</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRitual(ritual.id)}
                      className="p-1.5 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 7-day mini chart */}
      <div className="game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-400">Last 7 Nights</span>
          <span className="text-xs text-slate-600 ml-auto">avg {Math.round(avgLast7 * 100)}%</span>
        </div>
        <div className="flex gap-1.5">
          {getLast7Dates().map(date => {
            const c = loadCompletions(date)
            const dayPct = rituals.length === 0
              ? 0
              : rituals.filter(r => c.has(r.id)).length / rituals.length
            const isToday = date === today
            const label = new Date(date + 'T12:00:00')
              .toLocaleDateString('en-US', { weekday: 'narrow' })
            const barH = Math.max(4, Math.round(dayPct * 44))
            const barColor = isToday
              ? '#6366f1'
              : dayPct >= 0.8
              ? '#22c55e'
              : dayPct >= 0.5
              ? '#8b5cf6'
              : dayPct > 0
              ? '#f59e0b'
              : '#1e293b'

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{ height: barH, backgroundColor: barColor }}
                  />
                </div>
                <span className={`text-[9px] ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
