import { useState, useEffect } from 'react'
import { FlaskConical, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type HabitFailureReason = 'willpower' | 'environment' | 'identity' | 'trigger' | 'reward' | 'complexity' | 'timing' | 'accountability' | 'motivation' | 'other'
type HabitAutopsyStatus = 'analyzing' | 'redesigned' | 'retired' | 'restarting'

interface HabitAutopsyEntry {
  id: string
  habitName: string
  failureReason: HabitFailureReason
  status: HabitAutopsyStatus
  whatHappened: string
  rootCause: string
  redesign: string
  successConditions: string
  streakBrokenAt: number
  attempts: number
  date: string
  createdAt: string
}

const REASON_CONFIG: Record<HabitFailureReason, { label: string; emoji: string; color: string }> = {
  willpower:     { label: 'Willpower Depletion', emoji: '🪫', color: '#ef4444' },
  environment:   { label: 'Bad Environment',     emoji: '🏠', color: '#f59e0b' },
  identity:      { label: 'Identity Mismatch',   emoji: '🪞', color: '#a855f7' },
  trigger:       { label: 'Missing Trigger',     emoji: '🔔', color: '#6366f1' },
  reward:        { label: 'No Clear Reward',     emoji: '🎁', color: '#ec4899' },
  complexity:    { label: 'Too Complex',         emoji: '🧩', color: '#f97316' },
  timing:        { label: 'Wrong Timing',        emoji: '⏰', color: '#3b82f6' },
  accountability: { label: 'No Accountability',  emoji: '👥', color: '#22c55e' },
  motivation:    { label: 'Lost Motivation',     emoji: '🔥', color: '#0ea5e9' },
  other:         { label: 'Other',               emoji: '🔍', color: '#64748b' },
}

const STATUS_CONFIG: Record<HabitAutopsyStatus, { label: string; color: string }> = {
  analyzing:  { label: 'Analyzing',  color: '#f59e0b' },
  redesigned: { label: 'Redesigned', color: '#22c55e' },
  retired:    { label: 'Retired',    color: '#94a3b8' },
  restarting: { label: 'Restarting', color: '#3b82f6' },
}

const STORAGE_KEY = 'habit_autopsy'

export default function HabitAutopsy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<HabitAutopsyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<HabitAutopsyEntry, 'id' | 'createdAt'>>({
    habitName: '', failureReason: 'willpower', status: 'analyzing',
    whatHappened: '', rootCause: '', redesign: '', successConditions: '',
    streakBrokenAt: 0, attempts: 1, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HabitAutopsyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.habitName.trim()) return
    const e: HabitAutopsyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, habitName: '', whatHappened: '', rootCause: '', redesign: '', successConditions: '' }))
    setShowForm(false)
    toastSuccess('Habit autopsy complete — learn and rebuild 🔬')
  }

  const redesigned = entries.filter(e => e.status === 'redesigned').length
  const avgStreak = entries.length ? Math.round(entries.reduce((s, e) => s + e.streakBrokenAt, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FlaskConical className="w-7 h-7 text-cyan-400" />
            Habit Autopsy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Diagnose why habits fail and redesign them to stick.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Autopsy
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Analyzed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{redesigned}</div>
          <div className="text-xs text-slate-500">Redesigned</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgStreak}</div>
          <div className="text-xs text-slate-500">Avg Days Before Break</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Habit Autopsy</h3>
          <input value={form.habitName} onChange={e => setForm(f => ({ ...f, habitName: e.target.value }))}
            placeholder="Habit name *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.failureReason} onChange={e => setForm(f => ({ ...f, failureReason: e.target.value as HabitFailureReason }))} className="game-input text-sm flex-1">
              {(Object.entries(REASON_CONFIG) as [HabitFailureReason, typeof REASON_CONFIG.willpower][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as HabitAutopsyStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [HabitAutopsyStatus, typeof STATUS_CONFIG.analyzing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened? Describe the breakdown..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
            placeholder="Root cause (ask why 3 times)" className="game-input w-full h-10 resize-none text-sm" />
          <textarea value={form.redesign} onChange={e => setForm(f => ({ ...f, redesign: e.target.value }))}
            placeholder="Redesigned version — what changes?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.successConditions} onChange={e => setForm(f => ({ ...f, successConditions: e.target.value }))}
            placeholder="Success conditions — what must be true for this to work?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Streak broken at: Day {form.streakBrokenAt}</p>
              <input type="number" min={0} value={form.streakBrokenAt}
                onChange={e => setForm(f => ({ ...f, streakBrokenAt: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Attempt #</p>
              <input type="number" min={1} value={form.attempts}
                onChange={e => setForm(f => ({ ...f, attempts: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save Analysis</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = REASON_CONFIG[e.failureReason]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.habitName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">#{e.attempts} attempt · Day {e.streakBrokenAt}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{r.label}</p>
                {e.rootCause && <p className="text-xs text-slate-300 mt-0.5">Root: {e.rootCause}</p>}
                {e.redesign && <p className="text-xs text-green-300 mt-0.5">→ {e.redesign}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every broken habit is data. Analyze, redesign, restart.</p>
          </div>
        )}
      </div>
    </div>
  )
}
