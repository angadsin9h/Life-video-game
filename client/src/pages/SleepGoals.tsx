import { useState, useEffect } from 'react'
import { Moon, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SleepGoalType = 'duration' | 'consistency' | 'quality' | 'schedule' | 'environment' | 'pre-sleep' | 'wake-time' | 'nap' | 'other'
type SleepGoalStatus = 'active' | 'achieved' | 'paused' | 'failed'

interface SleepGoal {
  id: string
  type: SleepGoalType
  status: SleepGoalStatus
  goal: string
  target: string
  current: string
  strategy: string
  obstacle: string
  streak: number
  successRate: number
  startDate: string
  createdAt: string
}

const TYPE_CONFIG: Record<SleepGoalType, { label: string; emoji: string; color: string }> = {
  duration:    { label: 'Duration',    emoji: '⏱️', color: '#3b82f6' },
  consistency: { label: 'Consistency', emoji: '📅', color: '#6366f1' },
  quality:     { label: 'Quality',     emoji: '⭐', color: '#f59e0b' },
  schedule:    { label: 'Schedule',    emoji: '🕐', color: '#22c55e' },
  environment: { label: 'Environment', emoji: '🏠', color: '#a855f7' },
  'pre-sleep': { label: 'Pre-Sleep',   emoji: '🌙', color: '#0ea5e9' },
  'wake-time': { label: 'Wake Time',   emoji: '☀️', color: '#f97316' },
  nap:         { label: 'Nap',         emoji: '😴', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '💤', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<SleepGoalStatus, { label: string; color: string }> = {
  active:   { label: 'Active',    color: '#3b82f6' },
  achieved: { label: 'Achieved',  color: '#22c55e' },
  paused:   { label: 'Paused',    color: '#f59e0b' },
  failed:   { label: 'Failed',    color: '#ef4444' },
}

const STORAGE_KEY = 'sleep_goals'

export default function SleepGoals() {
  const { toastSuccess } = useToast()
  const [goals, setGoals] = useState<SleepGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SleepGoal, 'id' | 'createdAt'>>({
    type: 'duration', status: 'active', goal: '', target: '', current: '',
    strategy: '', obstacle: '', streak: 0, successRate: 0,
    startDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setGoals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SleepGoal[]) => { setGoals(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goal.trim()) return
    const g: SleepGoal = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([g, ...goals])
    setForm(f => ({ ...f, goal: '', target: '', current: '', strategy: '', obstacle: '' }))
    setShowForm(false)
    toastSuccess('Sleep goal set 🌙')
  }

  const active = goals.filter(g => g.status === 'active').length
  const achieved = goals.filter(g => g.status === 'achieved').length
  const avgStreak = goals.length ? Math.round(goals.reduce((s, g) => s + g.streak, 0) / goals.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Sleep Goals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Set and track intentional sleep improvement goals.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{achieved}</div>
          <div className="text-xs text-slate-500">Achieved</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgStreak}d</div>
          <div className="text-xs text-slate-500">Avg Streak</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Sleep Goal</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SleepGoalType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [SleepGoalType, typeof TYPE_CONFIG.duration][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SleepGoalStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [SleepGoalStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="Sleep goal *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="Target (e.g. 8h, 10pm)" className="game-input flex-1 text-sm" />
            <input value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
              placeholder="Current (e.g. 6h)" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))}
            placeholder="Strategy to achieve this" className="game-input w-full text-sm" />
          <input value={form.obstacle} onChange={e => setForm(f => ({ ...f, obstacle: e.target.value }))}
            placeholder="Main obstacle?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current streak: {form.streak} days</p>
              <input type="number" value={form.streak} min={0}
                onChange={e => setForm(f => ({ ...f, streak: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Success rate: {form.successRate}%</p>
              <input type="range" min={0} max={100} step={5} value={form.successRate}
                onChange={e => setForm(f => ({ ...f, successRate: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {goals.map(g => {
          const t = TYPE_CONFIG[g.type]
          const s = STATUS_CONFIG[g.status]
          return (
            <div key={g.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl mt-0.5">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{g.goal}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  {g.target && <span className="text-xs text-green-400">→ {g.target}</span>}
                  {g.current && <span className="text-xs text-slate-500">now: {g.current}</span>}
                  {g.streak > 0 && <span className="text-xs text-orange-400">🔥 {g.streak}d</span>}
                </div>
                {g.strategy && <p className="text-xs text-slate-500 mt-0.5">{g.strategy}</p>}
                {g.successRate > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-700 rounded-full">
                      <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${g.successRate}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{g.successRate}%</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <select value={g.status} onChange={ev => save(goals.map(x => x.id === g.id ? { ...x, status: ev.target.value as SleepGoalStatus } : x))}
                  className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                  {(Object.entries(STATUS_CONFIG) as [SleepGoalStatus, typeof STATUS_CONFIG.active][]).map(([k, st]) => (
                    <option key={k} value={k}>{st.label}</option>
                  ))}
                </select>
                <button onClick={() => save(goals.filter(x => x.id !== g.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {goals.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Moon className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sleep is the foundation of everything. Set goals around it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
