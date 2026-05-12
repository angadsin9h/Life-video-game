import { useEffect, useState } from 'react'
import { Swords, Plus, Flame, Check, Trophy, ChevronRight, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Challenge {
  id: string
  title: string
  description: string
  duration: number
  startDate: string
  type: 'daily' | 'weekly' | 'one-time'
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  xpReward: number
  checkIns: string[]
  completed: boolean
  abandoned: boolean
}

const PRESET_CHALLENGES = [
  { title: '30-Day No Social Media', description: 'Delete social apps for 30 days. Read instead.', duration: 30, type: 'daily' as const, category: 'mindset', difficulty: 'hard' as const, xpReward: 500 },
  { title: '21-Day Journaling Streak', description: 'Write in your journal every single day.', duration: 21, type: 'daily' as const, category: 'reflection', difficulty: 'medium' as const, xpReward: 300 },
  { title: '7-Day Cold Showers', description: 'Cold shower every morning for 7 days.', duration: 7, type: 'daily' as const, category: 'fitness', difficulty: 'hard' as const, xpReward: 200 },
  { title: '100 Pushups Challenge', description: 'Do 100 pushups total (or in sets) every day.', duration: 30, type: 'daily' as const, category: 'fitness', difficulty: 'extreme' as const, xpReward: 600 },
  { title: 'Alcohol-Free Month', description: 'No alcohol for 30 days. Track clarity improvements.', duration: 30, type: 'daily' as const, category: 'health', difficulty: 'medium' as const, xpReward: 400 },
  { title: '7-Day Digital Detox', description: 'No screens after 9pm for one week.', duration: 7, type: 'daily' as const, category: 'wellness', difficulty: 'medium' as const, xpReward: 150 },
  { title: 'Wake Up at 5am for 14 Days', description: 'No snooze. Up at 5am every day.', duration: 14, type: 'daily' as const, category: 'discipline', difficulty: 'extreme' as const, xpReward: 400 },
  { title: 'Read 5 Books', description: 'Read 5 books in 60 days. No time wasted.', duration: 60, type: 'one-time' as const, category: 'learning', difficulty: 'medium' as const, xpReward: 350 },
]

const DIFFICULTY_CONFIG = {
  easy: { color: '#22c55e', label: 'Easy', xp: 50 },
  medium: { color: '#eab308', label: 'Medium', xp: 150 },
  hard: { color: '#f97316', label: 'Hard', xp: 300 },
  extreme: { color: '#ef4444', label: 'Extreme', xp: 600 },
}

const STORAGE_KEY = 'challenge_mode'

export default function ChallengeMode() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showPresets, setShowPresets] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', duration: '30', type: 'daily' as 'daily' | 'weekly' | 'one-time', category: 'fitness', difficulty: 'medium' as Challenge['difficulty'] })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setChallenges(JSON.parse(saved))
  }, [])

  const persist = (updated: Challenge[]) => {
    setChallenges(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const startChallenge = (preset: typeof PRESET_CHALLENGES[0]) => {
    const c: Challenge = {
      id: Date.now().toString(),
      ...preset,
      startDate: today,
      checkIns: [],
      completed: false,
      abandoned: false,
    }
    persist([c, ...challenges])
    setShowPresets(false)
    toastSuccess(`Challenge started: ${preset.title}!`)
  }

  const createCustom = () => {
    if (!form.title.trim()) return
    const diff = DIFFICULTY_CONFIG[form.difficulty]
    const c: Challenge = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description,
      duration: parseInt(form.duration) || 30,
      type: form.type,
      category: form.category,
      difficulty: form.difficulty,
      xpReward: diff.xp,
      startDate: today,
      checkIns: [],
      completed: false,
      abandoned: false,
    }
    persist([c, ...challenges])
    setShowCustom(false)
    setForm({ title: '', description: '', duration: '30', type: 'daily', category: 'fitness', difficulty: 'medium' })
    toastSuccess('Custom challenge started!')
  }

  const checkIn = (id: string) => {
    const updated = challenges.map(c => {
      if (c.id !== id || c.checkIns.includes(today)) return c
      const newCheckIns = [...c.checkIns, today]
      const daysElapsed = Math.ceil((new Date(today).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1
      const done = c.type === 'daily' && newCheckIns.length >= c.duration
      return { ...c, checkIns: newCheckIns, completed: done }
    })
    persist(updated)
    toastSuccess('Checked in! Keep going!')
  }

  const abandon = (id: string) => {
    persist(challenges.map(c => c.id === id ? { ...c, abandoned: true } : c))
  }

  const getStreak = (c: Challenge) => {
    let streak = 0
    const d = new Date(today)
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (!c.checkIns.includes(ds)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  const getDaysSinceStart = (c: Challenge) =>
    Math.ceil((new Date(today).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1

  const active = challenges.filter(c => !c.completed && !c.abandoned)
  const done = challenges.filter(c => c.completed)
  const totalXP = done.reduce((s, c) => s + c.xpReward, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Swords className="w-7 h-7 text-red-400" />
            Challenge Mode
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Hard commitments. Real growth.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowPresets(true); setShowCustom(false) }}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Presets
          </button>
          <button onClick={() => { setShowCustom(true); setShowPresets(false) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Custom
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Swords className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{done.length}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{totalXP}</div>
          <div className="text-xs text-slate-500">XP Earned</div>
        </div>
      </div>

      {/* Preset picker */}
      {showPresets && (
        <div className="game-card p-4 space-y-3 border border-red-500/20">
          <h3 className="font-semibold text-slate-300">Pick a Challenge</h3>
          {PRESET_CHALLENGES.map((p, i) => {
            const diff = DIFFICULTY_CONFIG[p.difficulty]
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 cursor-pointer transition-colors group"
                onClick={() => startChallenge(p)}>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: diff.color + '22', color: diff.color }}>{diff.label}</span>
                    <span className="text-xs text-slate-600">{p.duration} days · +{p.xpReward} XP</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>
            )
          })}
          <button onClick={() => setShowPresets(false)} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
        </div>
      )}

      {/* Custom form */}
      {showCustom && (
        <div className="game-card p-5 space-y-4 border border-red-500/20">
          <h3 className="font-semibold text-slate-300">Create Custom Challenge</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Challenge name" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What exactly will you do?" className="game-input w-full h-16 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (days)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="game-input w-full" min="1" max="365" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="fitness, mindset, learning…" className="game-input w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Difficulty</label>
            <div className="flex gap-2">
              {(Object.entries(DIFFICULTY_CONFIG) as [Challenge['difficulty'], typeof DIFFICULTY_CONFIG['easy']][]).map(([key, d]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, difficulty: key }))}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={form.difficulty === key ? { background: d.color + '33', color: d.color, border: `1px solid ${d.color}` } : { background: '#1e293b', color: '#475569' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createCustom} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Start Challenge
            </button>
            <button onClick={() => setShowCustom(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Active challenges */}
      {active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Challenges</h3>
          {active.map(c => {
            const diff = DIFFICULTY_CONFIG[c.difficulty]
            const streak = getStreak(c)
            const dayNum = getDaysSinceStart(c)
            const pct = Math.min(100, c.type === 'daily' ? (c.checkIns.length / c.duration) * 100 : (dayNum / c.duration) * 100)
            const checkedToday = c.checkIns.includes(today)

            return (
              <div key={c.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${diff.color}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{c.title}</h3>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: diff.color + '22', color: diff.color }}>{diff.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      {streak > 0 && <span className="text-orange-400">🔥 {streak}d streak</span>}
                      <span>Day {dayNum}/{c.duration}</span>
                      <span>{c.checkIns.length} check-ins</span>
                      <span className="text-violet-400">+{c.xpReward} XP on completion</span>
                    </div>
                  </div>
                  <button onClick={() => abandon(c.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: diff.color }} />
                </div>
                {c.type === 'daily' && (
                  checkedToday ? (
                    <div className="flex items-center gap-2 py-2 px-3 bg-green-900/20 text-green-400 rounded-xl text-xs font-semibold">
                      <Check className="w-4 h-4" /> Done for today!
                    </div>
                  ) : (
                    <button onClick={() => checkIn(c.id)}
                      className="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      ⚔️ Check In for Today
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Completed ({done.length})
          </h3>
          {done.map(c => (
            <div key={c.id} className="game-card p-3 flex items-center gap-3 opacity-70">
              <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{c.title}</div>
                <div className="text-xs text-slate-500">{c.checkIns.length}/{c.duration} days · +{c.xpReward} XP</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {challenges.length === 0 && !showPresets && !showCustom && (
        <div className="text-center py-16 text-slate-500">
          <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No active challenges.</p>
          <p className="text-sm mb-5">Push your limits with structured multi-day challenges.</p>
          <button onClick={() => setShowPresets(true)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Browse Challenges
          </button>
        </div>
      )}
    </div>
  )
}
