import { useState, useEffect } from 'react'
import { Leaf, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EcoCategory = 'transport' | 'food' | 'energy' | 'waste' | 'water' | 'shopping' | 'community' | 'other'
type ActionType = 'good' | 'bad' | 'neutral'

interface EcoAction {
  id: string
  date: string
  category: EcoCategory
  action: string
  type: ActionType
  impact: number
  notes: string
  createdAt: string
}

interface EcoGoal {
  category: EcoCategory
  description: string
  active: boolean
}

const CAT_CONFIG: Record<EcoCategory, { label: string; emoji: string; color: string }> = {
  transport: { label: 'Transport',  emoji: '🚲', color: '#22c55e' },
  food:      { label: 'Food',       emoji: '🥗', color: '#84cc16' },
  energy:    { label: 'Energy',     emoji: '⚡', color: '#f59e0b' },
  waste:     { label: 'Waste',      emoji: '♻️', color: '#3b82f6' },
  water:     { label: 'Water',      emoji: '💧', color: '#0ea5e9' },
  shopping:  { label: 'Shopping',   emoji: '🛍️', color: '#a855f7' },
  community: { label: 'Community',  emoji: '🌍', color: '#ec4899' },
  other:     { label: 'Other',      emoji: '🌱', color: '#64748b' },
}

const STORAGE_KEY = 'eco_tracker'
const GOAL_KEY = 'eco_goals'

export default function EcoTracker() {
  const { toastSuccess } = useToast()
  const [actions, setActions] = useState<EcoAction[]>([])
  const [goals, setGoals] = useState<EcoGoal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState<Omit<EcoAction, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], category: 'transport',
    action: '', type: 'good', impact: 5, notes: '',
  })
  const [newGoal, setNewGoal] = useState({ category: 'transport' as EcoCategory, description: '' })

  useEffect(() => {
    try {
      setActions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setGoals(JSON.parse(localStorage.getItem(GOAL_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveActions = (u: EcoAction[]) => { setActions(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveGoals = (u: EcoGoal[]) => { setGoals(u); localStorage.setItem(GOAL_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.action.trim()) return
    const a: EcoAction = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveActions([a, ...actions])
    setForm({ date: new Date().toISOString().split('T')[0], category: 'transport', action: '', type: 'good', impact: 5, notes: '' })
    setShowForm(false)
    toastSuccess(form.type === 'good' ? 'Eco action logged 🌱' : 'Noted — awareness is step one 👀')
  }

  const addGoal = () => {
    if (!newGoal.description.trim()) return
    saveGoals([...goals, { ...newGoal, active: true }])
    setNewGoal({ category: 'transport', description: '' })
    toastSuccess('Goal added!')
  }

  const dayActions = actions.filter(a => a.date === selectedDate)
  const greenScore = actions.filter(a => a.type === 'good').length
  const totalImpact = actions.filter(a => a.type === 'good').reduce((s, a) => s + a.impact, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Leaf className="w-7 h-7 text-green-400" />
            Eco Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your environmental impact and green actions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{greenScore}</div>
          <div className="text-xs text-slate-500">Green Actions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{totalImpact}</div>
          <div className="text-xs text-slate-500">Impact Points</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{goals.filter(g => g.active).length}</div>
          <div className="text-xs text-slate-500">Goals</div>
        </div>
      </div>

      {/* Goals section */}
      {goals.filter(g => g.active).length > 0 && (
        <div className="game-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eco Goals</span>
            <button onClick={() => setShowGoals(!showGoals)} className="text-xs text-slate-500 hover:text-slate-300">
              {showGoals ? 'Hide' : 'Edit'}
            </button>
          </div>
          {goals.filter(g => g.active).map((g, i) => {
            const c = CAT_CONFIG[g.category]
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span>{c.emoji}</span>
                <span className="text-slate-400 flex-1">{g.description}</span>
                <button onClick={() => saveGoals(goals.map((x, j) => j === i ? { ...x, active: false } : x))}
                  className="text-slate-700 hover:text-red-400">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {showGoals && (
        <div className="game-card p-4 border border-green-500/20 space-y-2">
          <h3 className="text-sm font-semibold text-white">Add Eco Goal</h3>
          <div className="flex gap-2">
            <select value={newGoal.category} onChange={e => setNewGoal(f => ({ ...f, category: e.target.value as EcoCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [EcoCategory, typeof CAT_CONFIG.transport][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={newGoal.description} onChange={e => setNewGoal(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Walk instead of drive once/week" className="game-input flex-1 text-sm" />
            <button onClick={addGoal} className="px-3 py-1.5 bg-green-700 text-white rounded-xl text-sm">Add</button>
          </div>
          <button onClick={() => setShowGoals(false)} className="text-xs text-slate-500">Done</button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="game-input text-sm flex-1" />
        <button onClick={() => setShowGoals(true)} className="text-xs text-slate-500 hover:text-slate-300 px-3 py-2 bg-slate-800 rounded-xl">+ Goal</button>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Action</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as EcoCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [EcoCategory, typeof CAT_CONFIG.transport][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="What did you do? *" className="game-input w-full" autoFocus />
          <div className="flex gap-3">
            {(['good', 'neutral', 'bad'] as ActionType[]).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-1.5 rounded-xl text-xs capitalize ${
                  form.type === t
                    ? t === 'good' ? 'bg-green-700/30 text-green-400' : t === 'bad' ? 'bg-red-700/30 text-red-400' : 'bg-slate-600/30 text-slate-300'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                {t === 'good' ? '🌱 Good' : t === 'bad' ? '⚠️ Impact' : '😐 Neutral'}
              </button>
            ))}
          </div>
          {form.type !== 'neutral' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Impact: {form.impact}/10</span>
              <input type="range" min={1} max={10} value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
                className="flex-1 h-1 accent-green-400" />
            </div>
          )}
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {dayActions.map(a => {
          const c = CAT_CONFIG[a.category]
          return (
            <div key={a.id} className="game-card p-3 flex items-center gap-3"
              style={{ borderLeft: `3px solid ${a.type === 'good' ? '#22c55e' : a.type === 'bad' ? '#ef4444' : '#94a3b8'}` }}>
              <span className="text-xl">{c.emoji}</span>
              <div className="flex-1">
                <span className="text-sm text-white">{a.action}</span>
                <p className="text-xs text-slate-500">{c.label}{a.type !== 'neutral' && ` · Impact ${a.impact}/10`}</p>
              </div>
              <span className="text-xl">{a.type === 'good' ? '🌱' : a.type === 'bad' ? '⚠️' : '😐'}</span>
              <button onClick={() => saveActions(actions.filter(x => x.id !== a.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {dayActions.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Leaf className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your environmental choices — every action counts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
