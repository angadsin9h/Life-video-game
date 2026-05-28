import { useState, useEffect } from 'react'
import { Swords, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeCategory = 'fitness' | 'mindset' | 'creativity' | 'learning' | 'social' | 'financial' | 'health' | 'spiritual' | 'productivity' | 'other'
type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'extreme'
type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'failed' | 'paused'

interface PersonalChallenge {
  id: string
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  status: ChallengeStatus
  name: string
  description: string
  duration: number
  unit: string
  currentDay: number
  rules: string
  reward: string
  startDate: string
  xpReward: number
  createdAt: string
}

const CAT_CONFIG: Record<ChallengeCategory, { label: string; emoji: string; color: string }> = {
  fitness:     { label: 'Fitness',     emoji: '💪', color: '#ef4444' },
  mindset:     { label: 'Mindset',     emoji: '🧠', color: '#a855f7' },
  creativity:  { label: 'Creativity',  emoji: '🎨', color: '#f97316' },
  learning:    { label: 'Learning',    emoji: '📚', color: '#3b82f6' },
  social:      { label: 'Social',      emoji: '👥', color: '#22c55e' },
  financial:   { label: 'Financial',   emoji: '💰', color: '#f59e0b' },
  health:      { label: 'Health',      emoji: '🏥', color: '#0ea5e9' },
  spiritual:   { label: 'Spiritual',   emoji: '🌟', color: '#84cc16' },
  productivity:{ label: 'Productivity',emoji: '⚡', color: '#6366f1' },
  other:       { label: 'Other',       emoji: '🎯', color: '#94a3b8' },
}

const DIFF_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; xp: number }> = {
  easy:    { label: 'Easy',    color: '#22c55e', xp: 50  },
  medium:  { label: 'Medium',  color: '#f59e0b', xp: 100 },
  hard:    { label: 'Hard',    color: '#ef4444', xp: 200 },
  extreme: { label: 'Extreme', color: '#a855f7', xp: 500 },
}

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: '#94a3b8' },
  active:    { label: 'Active',    color: '#22c55e' },
  completed: { label: 'Done ✓',   color: '#a855f7' },
  failed:    { label: 'Failed',    color: '#ef4444' },
  paused:    { label: 'Paused',    color: '#f59e0b' },
}

const STORAGE_KEY = 'challenge_tracker'

const PRESETS = [
  { name: '30-Day No Sugar', category: 'health' as ChallengeCategory, difficulty: 'hard' as ChallengeDifficulty, duration: 30, unit: 'days' },
  { name: '100 Push-Ups Daily', category: 'fitness' as ChallengeCategory, difficulty: 'medium' as ChallengeDifficulty, duration: 30, unit: 'days' },
  { name: '30 Books in 30 Days', category: 'learning' as ChallengeCategory, difficulty: 'extreme' as ChallengeDifficulty, duration: 30, unit: 'days' },
  { name: 'No Social Media for 7 Days', category: 'mindset' as ChallengeCategory, difficulty: 'hard' as ChallengeDifficulty, duration: 7, unit: 'days' },
  { name: '10K Steps Daily', category: 'fitness' as ChallengeCategory, difficulty: 'easy' as ChallengeDifficulty, duration: 21, unit: 'days' },
]

export default function ChallengeTracker() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<PersonalChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PersonalChallenge, 'id' | 'createdAt'>>({
    category: 'fitness', difficulty: 'medium', status: 'upcoming', name: '', description: '',
    duration: 30, unit: 'days', currentDay: 0, rules: '', reward: '',
    startDate: new Date().toISOString().split('T')[0], xpReward: 100,
  })

  useEffect(() => {
    try { setChallenges(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PersonalChallenge[]) => { setChallenges(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const c: PersonalChallenge = { id: Date.now().toString(), ...form, xpReward: DIFF_CONFIG[form.difficulty].xp, createdAt: new Date().toISOString() }
    save([c, ...challenges])
    setForm(f => ({ ...f, name: '', description: '', rules: '', reward: '' }))
    setShowForm(false)
    toastSuccess('Challenge accepted ⚔️')
  }

  const applyPreset = (p: typeof PRESETS[0]) => {
    setForm(f => ({ ...f, name: p.name, category: p.category, difficulty: p.difficulty, duration: p.duration, unit: p.unit }))
  }

  const bump = (id: string) => {
    save(challenges.map(c => c.id === id ? { ...c, currentDay: Math.min(c.currentDay + 1, c.duration), status: c.currentDay + 1 >= c.duration ? 'completed' : 'active' } : c))
  }

  const active = challenges.filter(c => c.status === 'active').length
  const completed = challenges.filter(c => c.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Swords className="w-7 h-7 text-orange-400" />
            Challenge Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Create and conquer personal challenges day by day.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Challenge
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{challenges.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Challenge</h3>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => applyPreset(p)}
                className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded-lg text-xs">
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ChallengeCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [ChallengeCategory, typeof CAT_CONFIG.fitness][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as ChallengeDifficulty }))} className="game-input text-sm flex-1">
              {(Object.entries(DIFF_CONFIG) as [ChallengeDifficulty, typeof DIFF_CONFIG.easy][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label} (+{d.xp}XP)</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Challenge name *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the challenge..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration</p>
              <input type="number" value={form.duration} min={1}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Unit</p>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Start</p>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
            placeholder="Rules / conditions" className="game-input w-full text-sm" />
          <input value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))}
            placeholder="Reward on completion" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Accept Challenge ⚔️</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {challenges.map(c => {
          const cat = CAT_CONFIG[c.category]
          const diff = DIFF_CONFIG[c.difficulty]
          const st = STATUS_CONFIG[c.status]
          const pct = c.duration > 0 ? Math.round((c.currentDay / c.duration) * 100) : 0
          return (
            <div key={c.id} className="game-card p-3" style={{ borderLeft: `3px solid ${cat.color}` }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                    <span className="text-xs px-1 rounded" style={{ background: diff.color + '20', color: diff.color }}>{diff.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">Day {c.currentDay}/{c.duration} · +{c.xpReward}XP</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{pct}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {c.status === 'active' && (
                    <button onClick={() => bump(c.id)} className="px-2 py-1 bg-orange-700/30 text-orange-300 rounded-lg text-xs">+Day</button>
                  )}
                  {c.status === 'upcoming' && (
                    <button onClick={() => save(challenges.map(x => x.id === c.id ? { ...x, status: 'active' } : x))}
                      className="px-2 py-1 bg-green-700/30 text-green-300 rounded-lg text-xs">Start</button>
                  )}
                  <button onClick={() => save(challenges.filter(x => x.id !== c.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {challenges.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Challenge yourself to grow. Pick something hard and do it anyway.</p>
          </div>
        )}
      </div>
    </div>
  )
}
