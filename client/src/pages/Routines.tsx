import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Plus, Trash2, Check, RefreshCw, Flame, X, ChevronDown, ChevronUp, Clock, Edit3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface RoutineItem {
  id: number
  routine_id: number
  habit_id: number | null
  task_name: string
  duration_minutes: number
  order_index: number
}

interface Routine {
  id: number
  name: string
  type: string
  emoji: string
  items: RoutineItem[]
  completedToday: boolean
  streak: number
}

const ROUTINE_TYPES = [
  { id: 'morning', label: 'Morning', emoji: '🌅' },
  { id: 'evening', label: 'Evening', emoji: '🌙' },
  { id: 'workout', label: 'Workout', emoji: '💪' },
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'custom', label: 'Custom', emoji: '⚡' },
]

const TYPE_COLORS: Record<string, string> = {
  morning: 'border-l-yellow-500',
  evening: 'border-l-violet-500',
  workout: 'border-l-green-500',
  work: 'border-l-blue-500',
  custom: 'border-l-pink-500',
}

const STARTER_ROUTINES = {
  morning: ['Wake up & hydrate', 'Morning stretch', 'Meditation (5 min)', 'Healthy breakfast', 'Review daily goals'],
  evening: ['Tidy workspace', 'Plan tomorrow', 'Gratitude journal', 'No screens (30 min)', 'Read before sleep'],
  workout: ['Warm up', 'Main workout', 'Cool down stretch', 'Log workout', 'Protein intake'],
  work: ['Clear inbox', 'Set top 3 priorities', 'Deep work block', 'Team check-in', 'EOD review'],
}

function RoutineCard({ routine, onComplete, onDelete, onRefresh }: {
  routine: Routine
  onComplete: (id: number) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const totalMins = routine.items.reduce((s, i) => s + i.duration_minutes, 0)
  const cc = TYPE_COLORS[routine.type] || 'border-l-slate-500'

  return (
    <div className={`game-card p-4 border-l-4 ${cc} ${routine.completedToday ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{routine.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${routine.completedToday ? 'line-through text-slate-500' : 'text-slate-100'}`}>
            {routine.name}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{totalMins}m total
            </span>
            <span className="text-xs text-slate-500">{routine.items.length} steps</span>
            {routine.streak > 0 && (
              <span className="text-xs text-orange-400 flex items-center gap-1">
                <Flame className="w-3 h-3" />{routine.streak} day streak
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {!routine.completedToday && (
            <button onClick={() => onComplete(routine.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded-xl text-xs font-semibold transition-colors">
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          )}
          {routine.completedToday && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Complete
            </span>
          )}
          <button onClick={() => onDelete(routine.id)}
            className="p-1.5 text-slate-700 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && routine.items.length > 0 && (
        <div className="mt-3 space-y-1.5 pl-2 border-l border-slate-700">
          {routine.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-4 text-right">{i + 1}.</span>
              <span className="text-sm text-slate-300 flex-1">{item.task_name}</span>
              <span className="text-xs text-slate-600">{item.duration_minutes}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Routines() {
  const { toastSuccess } = useToast()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'morning', emoji: '🌅', items: ['', '', ''] })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const res = await axios.get<Routine[]>('/api/routines')
    setRoutines(res.data)
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const handleTypeChange = (type: string) => {
    const preset = ROUTINE_TYPES.find(t => t.id === type)
    setForm(f => ({ ...f, type, emoji: preset?.emoji || '⚡' }))
  }

  const fillStarter = () => {
    const starters = STARTER_ROUTINES[form.type as keyof typeof STARTER_ROUTINES] || []
    setForm(f => ({ ...f, items: [...starters.slice(0, 5), '', '', ''].slice(0, Math.max(f.items.length, starters.length)) }))
  }

  const createRoutine = async () => {
    const validItems = form.items.filter(i => i.trim())
    if (!form.name.trim() || validItems.length === 0) return
    setSaving(true)
    try {
      await axios.post('/api/routines', {
        name: form.name,
        type: form.type,
        emoji: form.emoji,
        items: validItems.map((task_name, i) => ({ task_name, duration_minutes: 5, order_index: i })),
      })
      setForm({ name: '', type: 'morning', emoji: '🌅', items: ['', '', ''] })
      setShowCreate(false)
      await load()
      toastSuccess('Routine created!')
    } finally { setSaving(false) }
  }

  const completeRoutine = async (id: number) => {
    await axios.post(`/api/routines/${id}/complete`)
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, completedToday: true, streak: r.streak + 1 } : r))
    toastSuccess('Routine completed! 🔥')
  }

  const deleteRoutine = async (id: number) => {
    await axios.delete(`/api/routines/${id}`)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  const completed = routines.filter(r => r.completedToday).length
  const total = routines.length

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  const grouped = ROUTINE_TYPES.map(t => ({
    ...t,
    routines: routines.filter(r => r.type === t.id),
  })).filter(g => g.routines.length > 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <RefreshCw className="w-7 h-7 text-green-400" />
            Routines
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total > 0 ? `${completed}/${total} routines complete today` : 'Build your daily routines'}
          </p>
        </div>
        <button onClick={() => setShowCreate(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showCreate ? 'bg-slate-700 text-slate-300' : 'bg-green-600 hover:bg-green-500 text-white'
          }`}>
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Routine'}
        </button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="game-card p-4 border border-green-500/20">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input placeholder="Routine name…" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="game-input flex-1" autoFocus />
              <select value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                className="game-input w-16 text-center text-lg">
                {['🌅', '🌙', '💪', '💼', '⚡', '🧠', '🎯', '🔥', '⭐', '🌿'].map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ROUTINE_TYPES.map(t => (
                <button key={t.id} onClick={() => handleTypeChange(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    form.type === t.id ? 'bg-green-600/30 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
                  }`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Steps</span>
                <button onClick={fillStarter} className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Fill with starter steps
                </button>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-xs text-slate-600 mt-2.5 w-4 text-right">{i + 1}.</span>
                  <input placeholder={`Step ${i + 1}…`} value={item}
                    onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? e.target.value : x) }))}
                    className="game-input flex-1 text-sm" />
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, items: [...f.items, ''] }))}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add step
              </button>
            </div>
            <button onClick={createRoutine} disabled={saving || !form.name.trim()}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Routine'}
            </button>
          </div>
        </div>
      )}

      {/* Grouped routines */}
      {grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>{group.emoji}</span> {group.label}
              </h3>
              <div className="space-y-2">
                {group.routines.map(r => (
                  <RoutineCard key={r.id} routine={r} onComplete={completeRoutine} onDelete={deleteRoutine} onRefresh={load} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !showCreate ? (
        <div className="text-center py-16 text-slate-600">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No routines yet</p>
          <p className="text-xs mt-1">Create routines to build consistent habits</p>
        </div>
      ) : null}

      {/* Tip */}
      {routines.length > 0 && (
        <div className="game-card p-3 border border-slate-700/50">
          <p className="text-xs text-slate-600 text-center">
            💡 Consistent routines reduce decision fatigue and automate good behavior over time
          </p>
        </div>
      )}
    </div>
  )
}
