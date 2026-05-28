import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, Check, Trophy, Target, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SkillChallenge {
  id: string
  skill: string
  category: string
  duration: number
  startDate: string
  description: string
  dailyTask: string
  completedDays: string[]
  status: 'active' | 'completed' | 'abandoned'
  createdAt: string
}

const CATEGORIES = [
  { name: 'Technical', color: '#3b82f6' },
  { name: 'Creative', color: '#ec4899' },
  { name: 'Physical', color: '#22c55e' },
  { name: 'Language', color: '#a855f7' },
  { name: 'Mental', color: '#f59e0b' },
  { name: 'Social', color: '#f97316' },
  { name: 'Business', color: '#10b981' },
  { name: 'Artistic', color: '#6366f1' },
]

const PRESETS = [
  { skill: '30-Day Coding Challenge', category: 'Technical', duration: 30, dailyTask: 'Code for 1 hour' },
  { skill: '21-Day Meditation', category: 'Mental', duration: 21, dailyTask: 'Meditate 10 minutes' },
  { skill: '100 Days of Drawing', category: 'Artistic', duration: 100, dailyTask: 'Draw something daily' },
  { skill: '30-Day Writing', category: 'Creative', duration: 30, dailyTask: 'Write 500 words' },
  { skill: '30-Day Language', category: 'Language', duration: 30, dailyTask: 'Practice 30 min' },
  { skill: '30-Day Workout', category: 'Physical', duration: 30, dailyTask: 'Exercise 30 minutes' },
]

const STORAGE_KEY = 'skill_challenges'

export default function SkillChallenge() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [challenges, setChallenges] = useState<SkillChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ skill: '', category: 'Technical', duration: 30, description: '', dailyTask: '' })
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setChallenges(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  const save = (updated: SkillChallenge[]) => {
    setChallenges(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addChallenge = (preset?: typeof PRESETS[0]) => {
    const data = preset ?? form
    if (!data.skill.trim()) return
    const challenge: SkillChallenge = {
      id: Date.now().toString(),
      skill: data.skill.trim(),
      category: data.category,
      duration: data.duration,
      startDate: today,
      description: !preset ? form.description.trim() : '',
      dailyTask: data.dailyTask.trim(),
      completedDays: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    save([challenge, ...challenges])
    setForm({ skill: '', category: 'Technical', duration: 30, description: '', dailyTask: '' })
    setShowForm(false)
    toastSuccess(`Challenge started: ${challenge.skill}! Day 1 begins now 🔥`)
  }

  const toggleDay = (id: string) => {
    save(challenges.map(c => {
      if (c.id !== id) return c
      const already = c.completedDays.includes(today)
      const completedDays = already ? c.completedDays.filter(d => d !== today) : [...c.completedDays, today]
      const status: SkillChallenge['status'] = completedDays.length >= c.duration ? 'completed' : c.status
      if (!already) toastSuccess(`Day logged! ${completedDays.length}/${c.duration} days done 💪`)
      return { ...c, completedDays, status }
    }))
  }

  const abandon = (id: string) => {
    save(challenges.map(c => c.id === id ? { ...c, status: 'abandoned' } : c))
  }

  const del = (id: string) => save(challenges.filter(c => c.id !== id))

  const getDayNumber = (c: SkillChallenge) => {
    const start = new Date(c.startDate)
    const now = new Date(today)
    return Math.floor((now.getTime() - start.getTime()) / 86400000) + 1
  }

  const active = challenges.filter(c => c.status === 'active')
  const completed = challenges.filter(c => c.status === 'completed')
  const abandoned = challenges.filter(c => c.status === 'abandoned')

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Skill Challenges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">30/21/100-day challenges to build mastery</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New Challenge
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <Trophy className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-400">{completed.length}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-purple-400">
            {challenges.reduce((s, c) => s + c.completedDays.length, 0)}
          </div>
          <div className="text-xs text-slate-500">Total Days</div>
        </div>
      </div>

      {/* Presets */}
      {!showForm && (
        <div className="game-card p-4">
          <div className="text-xs text-slate-500 mb-3">Quick start a challenge:</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.filter(p => !challenges.some(c => c.skill === p.skill && c.status === 'active')).slice(0, 4).map(p => {
              const cat = CATEGORIES.find(c => c.name === p.category)
              return (
                <button key={p.skill} onClick={() => addChallenge(p)}
                  className="text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                  <div className="text-sm text-white font-medium">{p.skill}</div>
                  <div className="text-xs mt-0.5" style={{ color: cat?.color }}>{p.duration} days · {p.category}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-semibold text-slate-300">New Skill Challenge</h3>
          <input value={form.skill} onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}
            placeholder="Skill / challenge name..." className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="game-input w-full">
                {CATEGORIES.map(c => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (days)</label>
              <input type="number" min="7" max="365" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} className="game-input w-full" />
            </div>
          </div>
          <input value={form.dailyTask} onChange={e => setForm(f => ({ ...f, dailyTask: e.target.value }))}
            placeholder="Daily task description (e.g. 'Code 1 hour')" className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={() => addChallenge()} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Start Challenge</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Active challenges */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Challenges</h3>
          {active.map(c => {
            const cat = CATEGORIES.find(x => x.name === c.category) || CATEGORIES[0]
            const dayNum = getDayNumber(c)
            const pct = Math.round((c.completedDays.length / c.duration) * 100)
            const doneToday = c.completedDays.includes(today)
            const isExpanded = expanded === c.id

            return (
              <div key={c.id} className="game-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{c.skill}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cat.color + '20', color: cat.color }}>{c.category}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">Day {dayNum}/{c.duration} · {c.completedDays.length} logged · {c.dailyTask}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.color }} />
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: cat.color }}>{pct}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDay(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${doneToday ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'}`}>
                        <Check className="w-3.5 h-3.5" />
                        {doneToday ? "Done today ✓" : "Log today"}
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : c.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-400">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <div className="text-xs text-slate-500 mb-2">Completed days: {c.completedDays.length}/{c.duration}</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: Math.min(c.duration, 60) }).map((_, i) => {
                            const d = new Date(c.startDate)
                            d.setDate(d.getDate() + i)
                            const ds = d.toISOString().split('T')[0]
                            const done = c.completedDays.includes(ds)
                            return (
                              <div key={i} className={`w-4 h-4 rounded-sm ${done ? '' : 'bg-slate-800'}`}
                                style={done ? { background: cat.color } : {}} title={ds} />
                            )
                          })}
                        </div>
                        <button onClick={() => abandon(c.id)} className="mt-3 text-xs text-red-500 hover:text-red-400">
                          Abandon challenge
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => del(c.id)} className="p-1 text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Completed 🏆</h3>
          {completed.map(c => (
            <div key={c.id} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
              <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-slate-300 flex-1">{c.skill}</span>
              <span className="text-xs text-slate-500">{c.duration} days</span>
              <button onClick={() => del(c.id)} className="p-1 text-slate-700 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {challenges.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No skill challenges started yet.</p>
          <p className="text-sm">Pick a skill and commit to daily practice for 21–100 days.</p>
        </div>
      )}
    </div>
  )
}
