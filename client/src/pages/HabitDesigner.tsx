import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2, ChevronDown, ChevronUp, Save, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface HabitLoop {
  id: string
  name: string
  cue: string
  routine: string
  reward: string
  frequency: 'daily' | 'weekly' | 'when-triggered'
  difficulty: 1 | 2 | 3 | 4 | 5
  implementation: string
  obstacleIf: string
  obstacleThen: string
  category: string
  active: boolean
  createdAt: string
}

const CATEGORIES = ['Health', 'Mind', 'Work', 'Social', 'Creative', 'Finance', 'Spirit']
const CAT_COLORS: Record<string, string> = {
  Health: '#22c55e', Mind: '#a855f7', Work: '#3b82f6', Social: '#ec4899',
  Creative: '#f97316', Finance: '#10b981', Spirit: '#6366f1',
}

const CUE_EXAMPLES = [
  'After I wake up', 'Before lunch', 'When I sit at my desk', 'After I brush teeth',
  'When I feel stressed', 'After I finish work', 'Before bed', 'When phone battery is low',
]

const REWARD_IDEAS = [
  'Cup of coffee/tea', '5 min social media', 'Favorite snack', 'Short walk',
  'Podcast episode', 'Stretch break', 'Listen to a song', 'High-five yourself',
]

const STORAGE_KEY = 'habit_designer'

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy (2 min)', 2: 'Easy (5 min)', 3: 'Moderate', 4: 'Hard', 5: 'Very Hard',
}

export default function HabitDesigner() {
  const { toastSuccess } = useToast()
  const [habits, setHabits] = useState<HabitLoop[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', cue: '', routine: '', reward: '', frequency: 'daily' as HabitLoop['frequency'],
    difficulty: 2 as HabitLoop['difficulty'], implementation: '', obstacleIf: '', obstacleThen: '',
    category: 'Health',
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setHabits(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: HabitLoop[]) => {
    setHabits(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addHabit = () => {
    if (!form.name.trim() || !form.cue.trim() || !form.routine.trim()) return
    const habit: HabitLoop = {
      id: Date.now().toString(),
      name: form.name.trim(),
      cue: form.cue.trim(),
      routine: form.routine.trim(),
      reward: form.reward.trim(),
      frequency: form.frequency,
      difficulty: form.difficulty,
      implementation: form.implementation.trim(),
      obstacleIf: form.obstacleIf.trim(),
      obstacleThen: form.obstacleThen.trim(),
      category: form.category,
      active: true,
      createdAt: new Date().toISOString(),
    }
    save([habit, ...habits])
    setForm({
      name: '', cue: '', routine: '', reward: '', frequency: 'daily',
      difficulty: 2, implementation: '', obstacleIf: '', obstacleThen: '', category: 'Health',
    })
    setShowForm(false)
    toastSuccess('Habit designed! Now go wire it into Habits to track it.')
  }

  const toggleActive = (id: string) => {
    save(habits.map(h => h.id === id ? { ...h, active: !h.active } : h))
  }

  const del = (id: string) => {
    save(habits.filter(h => h.id !== id))
  }

  const active = habits.filter(h => h.active)
  const inactive = habits.filter(h => !h.active)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-teal-400" />
            Habit Designer
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Engineer habits using the Cue → Routine → Reward loop</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Design
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-teal-400">{habits.length}</div>
          <div className="text-xs text-slate-500">Designed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-slate-400">{inactive.length}</div>
          <div className="text-xs text-slate-500">Paused</div>
        </div>
      </div>

      {/* Habit Loop Explainer */}
      <div className="game-card p-4 border border-teal-500/20">
        <div className="text-xs text-teal-400 font-semibold mb-2 uppercase tracking-wider">The Habit Loop</div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1 text-center p-2 rounded-lg bg-slate-800">
            <div className="text-slate-400 text-xs">CUE</div>
            <div className="text-white font-medium text-xs mt-0.5">Trigger</div>
          </div>
          <div className="text-slate-600">→</div>
          <div className="flex-1 text-center p-2 rounded-lg bg-slate-800">
            <div className="text-slate-400 text-xs">ROUTINE</div>
            <div className="text-white font-medium text-xs mt-0.5">The Habit</div>
          </div>
          <div className="text-slate-600">→</div>
          <div className="flex-1 text-center p-2 rounded-lg bg-slate-800">
            <div className="text-slate-400 text-xs">REWARD</div>
            <div className="text-white font-medium text-xs mt-0.5">Reinforcer</div>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-teal-500/20">
          <h3 className="font-semibold text-slate-300">Design New Habit</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Habit Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Morning Meditation" className="game-input w-full" autoFocus />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="game-input w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">CUE — What triggers this habit?</label>
            <input value={form.cue} onChange={e => setForm(f => ({ ...f, cue: e.target.value }))}
              placeholder="After I..." className="game-input w-full" />
            <div className="mt-1 flex flex-wrap gap-1">
              {CUE_EXAMPLES.slice(0, 4).map(ex => (
                <button key={ex} onClick={() => setForm(f => ({ ...f, cue: ex }))}
                  className="text-xs text-slate-600 hover:text-teal-400 transition-colors bg-slate-800 px-2 py-0.5 rounded">{ex}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">ROUTINE — What will you do?</label>
            <input value={form.routine} onChange={e => setForm(f => ({ ...f, routine: e.target.value }))}
              placeholder="I will..." className="game-input w-full" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">REWARD — How will you celebrate?</label>
            <input value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))}
              placeholder="Then I will reward myself with..." className="game-input w-full" />
            <div className="mt-1 flex flex-wrap gap-1">
              {REWARD_IDEAS.slice(0, 4).map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, reward: r }))}
                  className="text-xs text-slate-600 hover:text-teal-400 transition-colors bg-slate-800 px-2 py-0.5 rounded">{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Implementation Intention</label>
            <input value={form.implementation} onChange={e => setForm(f => ({ ...f, implementation: e.target.value }))}
              placeholder="I will [behavior] at [time] in [location]..." className="game-input w-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">IF obstacle...</label>
              <input value={form.obstacleIf} onChange={e => setForm(f => ({ ...f, obstacleIf: e.target.value }))}
                placeholder="If I don't have time..." className="game-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">THEN fallback...</label>
              <input value={form.obstacleThen} onChange={e => setForm(f => ({ ...f, obstacleThen: e.target.value }))}
                placeholder="I will do 2 min version..." className="game-input w-full text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as HabitLoop['frequency'] }))}
                className="game-input w-full">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="when-triggered">When triggered</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Difficulty: {DIFFICULTY_LABELS[form.difficulty]}</label>
              <input type="range" min="1" max="5" value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: +e.target.value as HabitLoop['difficulty'] }))}
                className="w-full accent-teal-400 mt-3" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={addHabit} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Save className="w-4 h-4 inline mr-1.5" />Save Habit Design
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Habit cards */}
      {habits.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No habits designed yet.</p>
          <p className="text-sm mt-1">Use the Habit Loop framework to engineer your perfect habits.</p>
        </div>
      )}

      {[...active, ...inactive].map(habit => {
        const cat = { color: CAT_COLORS[habit.category] || '#64748b' }
        const expanded = expandedId === habit.id
        return (
          <div key={habit.id} className={`game-card transition-opacity ${habit.active ? '' : 'opacity-50'}`}>
            <div className="p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: cat.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{habit.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.color + '20', color: cat.color }}>{habit.category}</span>
                  <span className="text-xs text-slate-500">{habit.frequency}</span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  📍 <span className="text-slate-500">Cue:</span> {habit.cue}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setExpandedId(expanded ? null : habit.id)} className="p-1 text-slate-500 hover:text-slate-300">
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={() => toggleActive(habit.id)}
                  className={`p-1 transition-colors ${habit.active ? 'text-green-400' : 'text-slate-600 hover:text-green-400'}`}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => del(habit.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {expanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-800 pt-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-xs text-teal-400 mb-1">CUE</div>
                    <div className="text-slate-300">{habit.cue}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-xs text-blue-400 mb-1">ROUTINE</div>
                    <div className="text-slate-300">{habit.routine}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <div className="text-xs text-yellow-400 mb-1">REWARD</div>
                    <div className="text-slate-300">{habit.reward || '—'}</div>
                  </div>
                </div>
                {habit.implementation && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Implementation:</span> {habit.implementation}
                  </div>
                )}
                {habit.obstacleIf && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">If {habit.obstacleIf} → </span>{habit.obstacleThen}
                  </div>
                )}
                <div className="text-xs text-slate-600">Difficulty: {DIFFICULTY_LABELS[habit.difficulty]}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
