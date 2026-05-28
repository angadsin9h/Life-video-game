import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ProcrastinationType = 'avoidance' | 'perfectionism' | 'overwhelm' | 'boredom' | 'fear' | 'distraction' | 'decision' | 'energy' | 'other'
type ProcrastinationStatus = 'ongoing' | 'broken' | 'started' | 'completed'

interface ProcrastinationEntry {
  id: string
  task: string
  procrastinationType: ProcrastinationType
  status: ProcrastinationStatus
  emotion: string
  rootFear: string
  twoMinuteAction: string
  completedAction: string
  daysProcrastinated: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<ProcrastinationType, { label: string; emoji: string; color: string }> = {
  avoidance:    { label: 'Task Avoidance',   emoji: '🚪', color: '#ef4444' },
  perfectionism: { label: 'Perfectionism',  emoji: '🔬', color: '#a855f7' },
  overwhelm:    { label: 'Overwhelm',        emoji: '🌊', color: '#3b82f6' },
  boredom:      { label: 'Boredom/Tedium',   emoji: '😴', color: '#64748b' },
  fear:         { label: 'Fear of Failure',  emoji: '😨', color: '#f97316' },
  distraction:  { label: 'Distraction',      emoji: '📱', color: '#f59e0b' },
  decision:     { label: 'Decision Paralysis', emoji: '⚖️', color: '#6366f1' },
  energy:       { label: 'Low Energy',       emoji: '🪫', color: '#22c55e' },
  other:        { label: 'Other',            emoji: '💭', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ProcrastinationStatus, { label: string; color: string }> = {
  ongoing:   { label: 'Still Avoiding', color: '#ef4444' },
  broken:    { label: 'Pattern Broken', color: '#22c55e' },
  started:   { label: 'Started!',       color: '#3b82f6' },
  completed: { label: 'Completed!',     color: '#a855f7' },
}

const STORAGE_KEY = 'procrastination_log'

export default function ProcrastinationLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ProcrastinationEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ProcrastinationEntry, 'id' | 'createdAt'>>({
    task: '', procrastinationType: 'avoidance', status: 'ongoing',
    emotion: '', rootFear: '', twoMinuteAction: '', completedAction: '',
    daysProcrastinated: 1, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ProcrastinationEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.task.trim()) return
    const e: ProcrastinationEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, task: '', emotion: '', rootFear: '', twoMinuteAction: '', completedAction: '' }))
    setShowForm(false)
    toastSuccess('Procrastination logged — awareness is step 1 ⏱️')
  }

  const broken = entries.filter(e => e.status === 'broken' || e.status === 'completed').length
  const totalDays = entries.reduce((s, e) => s + e.daysProcrastinated, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-yellow-400" />
            Procrastination Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and break procrastination patterns with radical honesty.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log It
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{broken}</div>
          <div className="text-xs text-slate-500">Patterns Broken</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{totalDays}</div>
          <div className="text-xs text-slate-500">Days Avoided</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Procrastination</h3>
          <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            placeholder="What are you avoiding? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.procrastinationType} onChange={e => setForm(f => ({ ...f, procrastinationType: e.target.value as ProcrastinationType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ProcrastinationType, typeof TYPE_CONFIG.avoidance][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProcrastinationStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ProcrastinationStatus, typeof STATUS_CONFIG.ongoing][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Feeling when you think about this task" className="game-input w-full text-sm" />
          <input value={form.rootFear} onChange={e => setForm(f => ({ ...f, rootFear: e.target.value }))}
            placeholder="Root fear or belief underneath?" className="game-input w-full text-sm" />
          <input value={form.twoMinuteAction} onChange={e => setForm(f => ({ ...f, twoMinuteAction: e.target.value }))}
            placeholder="2-minute action to break the cycle" className="game-input w-full text-sm" />
          <input value={form.completedAction} onChange={e => setForm(f => ({ ...f, completedAction: e.target.value }))}
            placeholder="What did you actually do?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Days procrastinated: {form.daysProcrastinated}</p>
            <input type="number" min={0} value={form.daysProcrastinated}
              onChange={e => setForm(f => ({ ...f, daysProcrastinated: Number(e.target.value) }))}
              className="game-input w-full text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.procrastinationType]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{e.task}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{t.label} · {e.daysProcrastinated} day(s) avoided</p>
                {e.rootFear && <p className="text-xs text-red-300/80 mt-0.5">Fear: {e.rootFear}</p>}
                {e.twoMinuteAction && <p className="text-xs text-green-300 mt-0.5">→ {e.twoMinuteAction}</p>}
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
            <p className="text-sm">Stop hiding. Log what you're avoiding.</p>
          </div>
        )}
      </div>
    </div>
  )
}
