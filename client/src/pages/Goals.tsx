import { useEffect, useState } from 'react'
import axios from 'axios'
import { Plus, CheckCircle2, Circle, Trash2, Target } from 'lucide-react'

interface Goal {
  id: number
  title: string
  description: string | null
  category: string
  target_date: string | null
  completed: number
  created_at: string
}

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth']
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = { health: 'border-green-500/50', mind: 'border-cyan-500/50', work: 'border-violet-500/50', social: 'border-yellow-500/50', growth: 'border-red-500/50' }

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [catFilter, setCatFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', category: 'health', target_date: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => axios.get<Goal[]>('/api/goals').then(r => setGoals(r.data)).catch(console.error)
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await axios.post('/api/goals', form)
      setForm({ title: '', description: '', category: 'health', target_date: '' })
      setShowForm(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const toggleComplete = async (goal: Goal) => {
    await axios.put(`/api/goals/${goal.id}`, { completed: !goal.completed })
    load()
  }

  const deleteGoal = async (id: number) => {
    await axios.delete(`/api/goals/${id}`)
    load()
  }

  const filtered = goals.filter(g => {
    if (filter === 'active' && g.completed) return false
    if (filter === 'completed' && !g.completed) return false
    if (catFilter !== 'all' && g.category !== catFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Goals</h1>
          <p className="text-slate-400 mt-1">Track your life objectives</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="game-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-3 border-violet-500/30 glowing-border">
          <h2 className="font-semibold text-slate-200">New Goal</h2>
          <input type="text" className="game-input w-full" placeholder="Goal title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input type="text" className="game-input w-full" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="game-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="date" className="game-input" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={submitting || !form.title.trim()} className="game-btn-primary flex-1">
              {submitting ? 'Saving...' : 'Add Goal'}
            </button>
            <button onClick={() => setShowForm(false)} className="game-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {['all', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${catFilter === c ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>
            {c === 'all' ? 'All' : `${CAT_ICONS[c]} ${c}`}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No goals yet. Add your first goal to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <div key={goal.id} className={`game-card p-4 border ${CAT_COLORS[goal.category] || 'border-slate-700'} ${goal.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleComplete(goal)} className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-violet-400 transition-colors">
                  {goal.completed ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CAT_ICONS[goal.category]}</span>
                    <h3 className={`font-semibold text-slate-200 ${goal.completed ? 'line-through text-slate-500' : ''}`}>{goal.title}</h3>
                  </div>
                  {goal.description && <p className="text-sm text-slate-400 mt-0.5">{goal.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize">{goal.category}</span>
                    {goal.target_date && <span className="text-xs text-slate-500">🗓 {goal.target_date}</span>}
                    {goal.completed && <span className="text-xs text-green-400">✓ Completed</span>}
                  </div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
