import { useState, useEffect, useCallback } from 'react'
import { Zap, Plus, Trash2, Save, TrendingUp, Target, CheckCircle, Circle, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'habit_design_lab'

interface HabitCue {
  type: 'time' | 'location' | 'preceding_action' | 'emotional_state' | 'other'
  description: string
}

interface DesignedHabit {
  id: string
  name: string
  identity: string       // "I am the type of person who..."
  cue: HabitCue
  craving: string        // what you want
  routine: string        // the actual behavior
  reward: string         // immediate reward
  tinyVersion: string    // 2-minute version
  stackedOn: string      // "After I [existing habit]..."
  frequency: 'daily' | 'weekly' | 'weekdays' | 'custom'
  difficulty: 1 | 2 | 3  // 1=easy, 2=medium, 3=hard
  completions: string[]  // YYYY-MM-DD array
  active: boolean
  createdAt: string
}

function defaultHabit(): Omit<DesignedHabit, 'id' | 'createdAt'> {
  return {
    name: '',
    identity: '',
    cue: { type: 'time', description: '' },
    craving: '',
    routine: '',
    reward: '',
    tinyVersion: '',
    stackedOn: '',
    frequency: 'daily',
    difficulty: 1,
    completions: [],
    active: true,
  }
}

function today() { return new Date().toISOString().slice(0, 10) }

function loadHabits(): DesignedHabit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

export default function HabitDesignLab() {
  const { toastSuccess } = useToast()
  const [habits, setHabits] = useState<DesignedHabit[]>(loadHabits)
  const [form, setForm] = useState(defaultHabit())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'design' | 'track' | 'analytics'>('design')

  const save = useCallback((h: DesignedHabit[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
    setHabits(h)
  }, [])

  useEffect(() => { save(habits) }, [])

  function submitHabit() {
    if (!form.name.trim()) return
    if (editingId) {
      save(habits.map(h => h.id === editingId ? { ...form, id: editingId, createdAt: h.createdAt } : h))
    } else {
      save([...habits, { ...form, id: Date.now().toString(), createdAt: today() }])
    }
    setForm(defaultHabit())
    setEditingId(null)
    setShowForm(false)
    toastSuccess('Habit saved!')
  }

  function toggleToday(id: string) {
    const t = today()
    save(habits.map(h => {
      if (h.id !== id) return h
      const done = h.completions.includes(t)
      return { ...h, completions: done ? h.completions.filter(d => d !== t) : [...h.completions, t] }
    }))
  }

  function deleteHabit(id: string) { save(habits.filter(h => h.id !== id)) }

  function editHabit(h: DesignedHabit) {
    setForm({ ...h })
    setEditingId(h.id)
    setShowForm(true)
    setActiveTab('design')
  }

  function currentStreak(h: DesignedHabit) {
    let streak = 0
    const d = new Date()
    while (true) {
      const s = d.toISOString().slice(0, 10)
      if (h.completions.includes(s)) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }

  function completionRate(h: DesignedHabit) {
    const days = Math.max(1, Math.round((Date.now() - new Date(h.createdAt).getTime()) / 86400000) + 1)
    return Math.round((h.completions.length / days) * 100)
  }

  const activeHabits = habits.filter(h => h.active)
  const todayDone = activeHabits.filter(h => h.completions.includes(today())).length

  const CUE_LABELS = { time: '⏰ Time', location: '📍 Location', preceding_action: '🔗 After action', emotional_state: '💭 Emotional state', other: '✨ Other' }
  const DIFF_LABELS: Record<number, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
  const DIFF_COLORS: Record<number, string> = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-red-400' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Habit Design Lab</h1>
          <p className="text-slate-400 text-sm mt-1">Engineer habits using the habit loop framework</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400">{todayDone}/{activeHabits.length}</div>
          <div className="text-xs text-slate-500">done today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        {(['design', 'track', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Design tab */}
      {activeTab === 'design' && (
        <div className="space-y-4">
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultHabit()) }}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
            {showForm && !editingId ? 'Cancel' : 'Design New Habit'}
          </button>

          {showForm && (
            <div className="game-card p-5 space-y-4">
              <h3 className="font-semibold text-white">{editingId ? 'Edit Habit' : 'New Habit Blueprint'}</h3>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Habit Name *</label>
                <input className="game-input w-full" placeholder="e.g. Daily meditation" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Identity Statement — "I am the type of person who..."</label>
                <input className="game-input w-full" placeholder="meditates every morning" value={form.identity}
                  onChange={e => setForm(f => ({ ...f, identity: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Cue Type</label>
                  <select className="game-input w-full" value={form.cue.type}
                    onChange={e => setForm(f => ({ ...f, cue: { ...f.cue, type: e.target.value as HabitCue['type'] } }))}>
                    {Object.entries(CUE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Cue Description</label>
                  <input className="game-input w-full" placeholder="e.g. 7:00 AM" value={form.cue.description}
                    onChange={e => setForm(f => ({ ...f, cue: { ...f.cue, description: e.target.value } }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stack on existing habit — "After I..."</label>
                <input className="game-input w-full" placeholder="make my morning coffee" value={form.stackedOn}
                  onChange={e => setForm(f => ({ ...f, stackedOn: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">The Craving (what you want)</label>
                  <input className="game-input w-full" placeholder="feel calm and clear" value={form.craving}
                    onChange={e => setForm(f => ({ ...f, craving: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Reward (immediate)</label>
                  <input className="game-input w-full" placeholder="log it, enjoy coffee" value={form.reward}
                    onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">The Routine (exact behavior)</label>
                <input className="game-input w-full" placeholder="Sit, close eyes, breathe for 10 min" value={form.routine}
                  onChange={e => setForm(f => ({ ...f, routine: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">2-Minute Version (make it tiny)</label>
                <input className="game-input w-full" placeholder="Take 3 deep breaths" value={form.tinyVersion}
                  onChange={e => setForm(f => ({ ...f, tinyVersion: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                  <select className="game-input w-full" value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value as DesignedHabit['frequency'] }))}>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Difficulty</label>
                  <select className="game-input w-full" value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) as 1|2|3 }))}>
                    <option value={1}>Easy</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Hard</option>
                  </select>
                </div>
              </div>

              <button onClick={submitHabit}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                <Save className="w-4 h-4" />
                Save Blueprint
              </button>
            </div>
          )}

          {/* Habit list */}
          <div className="space-y-3">
            {habits.map(h => (
              <div key={h.id} className="game-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{h.name}</span>
                      <span className={`text-xs ${DIFF_COLORS[h.difficulty]}`}>{DIFF_LABELS[h.difficulty]}</span>
                      <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{h.frequency}</span>
                    </div>
                    {h.identity && <div className="text-xs text-violet-300 mt-1">I am someone who {h.identity}</div>}
                    {h.stackedOn && <div className="text-xs text-slate-500 mt-0.5">After I {h.stackedOn}</div>}
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{CUE_LABELS[h.cue.type]}: {h.cue.description}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => editHabit(h)} className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteHabit(h.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No habits designed yet. Start building your first habit blueprint.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Track tab */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <div className="space-y-2">
              {activeHabits.map(h => {
                const done = h.completions.includes(today())
                return (
                  <button key={h.id} onClick={() => toggleToday(h.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${done ? 'bg-green-900/30 border border-green-700/40' : 'bg-slate-800 border border-slate-700 hover:border-slate-600'}`}>
                    {done ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${done ? 'text-green-300 line-through' : 'text-white'}`}>{h.name}</div>
                      {h.tinyVersion && !done && <div className="text-xs text-slate-500">2-min version: {h.tinyVersion}</div>}
                    </div>
                    <div className="text-xs text-slate-500">🔥 {currentStreak(h)}d</div>
                  </button>
                )
              })}
              {activeHabits.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No active habits. Design some first.</p>
              )}
            </div>
          </div>

          {/* 7-day view */}
          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Last 7 Days</h3>
            <div className="space-y-2">
              {activeHabits.map(h => {
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (6 - i))
                  return d.toISOString().slice(0, 10)
                })
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 flex-1 truncate">{h.name}</span>
                    <div className="flex gap-1">
                      {days.map(d => (
                        <div key={d} className={`w-6 h-6 rounded-md ${h.completions.includes(d) ? 'bg-green-500' : 'bg-slate-700'}`} title={d} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Analytics tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">{habits.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total Habits</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{habits.reduce((s, h) => s + h.completions.length, 0)}</div>
              <div className="text-xs text-slate-500 mt-1">Total Completions</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{Math.max(0, ...habits.map(currentStreak))}</div>
              <div className="text-xs text-slate-500 mt-1">Best Streak</div>
            </div>
            <div className="game-card p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {habits.length ? Math.round(habits.reduce((s, h) => s + completionRate(h), 0) / habits.length) : 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg Completion Rate</div>
            </div>
          </div>

          <div className="game-card p-4">
            <h3 className="font-semibold text-white mb-3">Habit Leaderboard</h3>
            <div className="space-y-2">
              {[...habits].sort((a, b) => completionRate(b) - completionRate(a)).map((h, i) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{h.name}</span>
                      <span className="text-slate-400">{completionRate(h)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${completionRate(h)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-orange-400">🔥{currentStreak(h)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
