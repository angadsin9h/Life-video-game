import { useState, useEffect } from 'react'
import { Smartphone, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AppCategory = 'social' | 'work' | 'entertainment' | 'games' | 'news' | 'education' | 'shopping' | 'other'

interface AppEntry {
  id: string
  date: string
  appName: string
  category: AppCategory
  minutes: number
  intentional: boolean
  notes: string
  createdAt: string
}

interface DailyGoal {
  maxMinutes: number
  intentionalMinutes: number
}

const CAT_CONFIG: Record<AppCategory, { label: string; emoji: string; color: string }> = {
  social:        { label: 'Social Media',   emoji: '📱', color: '#3b82f6' },
  work:          { label: 'Work/Productive',emoji: '💼', color: '#22c55e' },
  entertainment: { label: 'Entertainment',  emoji: '🎬', color: '#f59e0b' },
  games:         { label: 'Games',          emoji: '🎮', color: '#6366f1' },
  news:          { label: 'News',           emoji: '📰', color: '#94a3b8' },
  education:     { label: 'Education',      emoji: '📚', color: '#a855f7' },
  shopping:      { label: 'Shopping',       emoji: '🛍️', color: '#ec4899' },
  other:         { label: 'Other',          emoji: '📲', color: '#64748b' },
}

const STORAGE_KEY = 'screen_time_log'
const GOAL_KEY = 'screen_time_goal'

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function ScreenTimeLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AppEntry[]>([])
  const [goal, setGoal] = useState<DailyGoal>({ maxMinutes: 120, intentionalMinutes: 60 })
  const [showForm, setShowForm] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState<Omit<AppEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], appName: '', category: 'social',
    minutes: 30, intentional: false, notes: '',
  })
  const [goalForm, setGoalForm] = useState({ ...goal })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const g = JSON.parse(localStorage.getItem(GOAL_KEY) || 'null')
      if (g) { setGoal(g); setGoalForm(g) }
    } catch { /**/ }
  }, [])

  const save = (u: AppEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.appName.trim() || form.minutes <= 0) return
    const e: AppEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], appName: '', category: 'social', minutes: 30, intentional: false, notes: '' })
    setShowForm(false)
    toastSuccess('Screen time logged 📱')
  }

  const saveGoal = () => {
    setGoal(goalForm)
    localStorage.setItem(GOAL_KEY, JSON.stringify(goalForm))
    setShowGoal(false)
    toastSuccess('Goal updated!')
  }

  const dayEntries = entries.filter(e => e.date === selectedDate)
  const totalMinutes = dayEntries.reduce((s, e) => s + e.minutes, 0)
  const intentionalMinutes = dayEntries.filter(e => e.intentional).reduce((s, e) => s + e.minutes, 0)
  const wastefulMinutes = totalMinutes - intentionalMinutes

  const catTotals = (Object.keys(CAT_CONFIG) as AppCategory[]).map(cat => ({
    cat,
    minutes: dayEntries.filter(e => e.category === cat).reduce((s, e) => s + e.minutes, 0),
  })).filter(c => c.minutes > 0).sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Smartphone className="w-7 h-7 text-blue-400" />
            Screen Time
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and manage your digital habits.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-3">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="game-input text-sm flex-1" />
        <button onClick={() => setShowGoal(true)} className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 bg-slate-800 rounded-xl">
          Goals
        </button>
      </div>

      {/* Daily summary */}
      <div className="game-card p-4 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Daily Usage</span>
          <span className="text-xs" style={{ color: totalMinutes > goal.maxMinutes ? '#ef4444' : '#22c55e' }}>
            {formatTime(totalMinutes)} / {formatTime(goal.maxMinutes)} limit
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full mb-3">
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(100, (totalMinutes / goal.maxMinutes) * 100)}%`,
            background: totalMinutes > goal.maxMinutes ? '#ef4444' : '#3b82f6',
          }} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-green-400 font-bold">{formatTime(intentionalMinutes)}</div>
            <div className="text-xs text-slate-500">Intentional</div>
          </div>
          <div>
            <div className="text-red-400 font-bold">{formatTime(wastefulMinutes)}</div>
            <div className="text-xs text-slate-500">Mindless</div>
          </div>
        </div>
        {catTotals.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {catTotals.map(({ cat, minutes }) => {
              const c = CAT_CONFIG[cat]
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs w-4">{c.emoji}</span>
                  <span className="text-xs text-slate-500 w-24 truncate">{c.label}</span>
                  <div className="flex-1 h-1 bg-slate-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${(minutes / totalMinutes) * 100}%`, background: c.color }} />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{formatTime(minutes)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showGoal && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Daily Limits</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex-1">Max daily screen time</span>
            <input type="number" value={goalForm.maxMinutes} min={0}
              onChange={e => setGoalForm(f => ({ ...f, maxMinutes: Number(e.target.value) }))}
              className="game-input w-20 text-sm text-center" />
            <span className="text-xs text-slate-500">min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex-1">Min intentional time</span>
            <input type="number" value={goalForm.intentionalMinutes} min={0}
              onChange={e => setGoalForm(f => ({ ...f, intentionalMinutes: Number(e.target.value) }))}
              className="game-input w-20 text-sm text-center" />
            <span className="text-xs text-slate-500">min</span>
          </div>
          <div className="flex gap-2">
            <button onClick={saveGoal} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowGoal(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log App Usage</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as AppCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [AppCategory, typeof CAT_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.appName} onChange={e => setForm(f => ({ ...f, appName: e.target.value }))}
              placeholder="App or website name *" className="game-input flex-1" autoFocus />
            <div className="flex items-center gap-1">
              <input type="number" value={form.minutes} min={1}
                onChange={e => setForm(f => ({ ...f, minutes: Number(e.target.value) }))}
                className="game-input w-16 text-sm text-center" />
              <span className="text-xs text-slate-500">min</span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.intentional} onChange={e => setForm(f => ({ ...f, intentional: e.target.checked }))} className="accent-green-400" />
            This was intentional / purposeful use
          </label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (what I was doing, how it felt)" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {dayEntries.map(e => {
          const c = CAT_CONFIG[e.category]
          return (
            <div key={e.id} className="game-card p-3 flex items-center gap-3">
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{e.appName}</span>
                  {e.intentional && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">intentional</span>}
                </div>
                <p className="text-xs text-slate-500">{c.label}</p>
              </div>
              <span className="text-sm font-mono text-slate-300">{formatTime(e.minutes)}</span>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {dayEntries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Log your screen time to build digital awareness.</p>
          </div>
        )}
      </div>
    </div>
  )
}
