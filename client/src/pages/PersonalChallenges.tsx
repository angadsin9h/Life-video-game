import { useState, useEffect } from 'react'
import { Swords, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeCategory = 'fitness' | 'mental' | 'social' | 'skill' | 'health' | 'creative' | 'financial' | 'spiritual' | 'other'
type ChallengeStatus = 'active' | 'completed' | 'failed' | 'paused'
type Duration = '7days' | '14days' | '21days' | '30days' | '60days' | '90days' | 'custom'

interface PersonalChallenge {
  id: string
  title: string
  category: ChallengeCategory
  description: string
  duration: Duration
  customDays: number
  startDate: string
  status: ChallengeStatus
  dailyAction: string
  progress: number
  targetDays: number
  wins: string[]
  createdAt: string
}

const CAT_CONFIG: Record<ChallengeCategory, { label: string; emoji: string; color: string }> = {
  fitness:   { label: 'Fitness',   emoji: '💪', color: '#ef4444' },
  mental:    { label: 'Mental',    emoji: '🧠', color: '#6366f1' },
  social:    { label: 'Social',    emoji: '👥', color: '#3b82f6' },
  skill:     { label: 'Skill',     emoji: '🎯', color: '#f59e0b' },
  health:    { label: 'Health',    emoji: '❤️', color: '#22c55e' },
  creative:  { label: 'Creative',  emoji: '🎨', color: '#a855f7' },
  financial: { label: 'Financial', emoji: '💰', color: '#84cc16' },
  spiritual: { label: 'Spiritual', emoji: '✨', color: '#f97316' },
  other:     { label: 'Other',     emoji: '🏆', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; color: string }> = {
  active:    { label: 'Active',    color: '#3b82f6' },
  completed: { label: 'Completed', color: '#22c55e' },
  failed:    { label: 'Failed',    color: '#ef4444' },
  paused:    { label: 'Paused',    color: '#f59e0b' },
}

const DURATION_DAYS: Record<Duration, number> = {
  '7days': 7, '14days': 14, '21days': 21, '30days': 30,
  '60days': 60, '90days': 90, 'custom': 0,
}

const STORAGE_KEY = 'personal_challenges'

export default function PersonalChallenges() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<PersonalChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [form, setForm] = useState<Omit<PersonalChallenge, 'id' | 'createdAt' | 'wins'>>({
    title: '', category: 'fitness', description: '', duration: '30days', customDays: 30,
    startDate: new Date().toISOString().split('T')[0], status: 'active', dailyAction: '',
    progress: 0, targetDays: 30,
  })

  useEffect(() => {
    try { setChallenges(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PersonalChallenge[]) => { setChallenges(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const targetDays = form.duration === 'custom' ? form.customDays : DURATION_DAYS[form.duration]
    const c: PersonalChallenge = { id: Date.now().toString(), ...form, targetDays, wins: [], createdAt: new Date().toISOString() }
    save([c, ...challenges])
    setForm({ title: '', category: 'fitness', description: '', duration: '30days', customDays: 30, startDate: new Date().toISOString().split('T')[0], status: 'active', dailyAction: '', progress: 0, targetDays: 30 })
    setShowForm(false)
    toastSuccess('Challenge accepted! 🏆')
  }

  const checkIn = (id: string) => {
    const today = new Date().toLocaleDateString()
    save(challenges.map(c => {
      if (c.id !== id) return c
      const newProgress = c.progress + 1
      const isComplete = newProgress >= c.targetDays
      return {
        ...c,
        progress: newProgress,
        status: isComplete ? 'completed' : c.status,
        wins: [...c.wins, today],
      }
    }))
    toastSuccess('Day checked off! 💪')
  }

  const filtered = challenges.filter(c => filterStatus === 'all' || c.status === filterStatus)
  const active = challenges.filter(c => c.status === 'active').length
  const completed = challenges.filter(c => c.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Swords className="w-7 h-7 text-red-400" />
            Challenges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Accept personal challenges. Push your limits.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{challenges.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs capitalize ${filterStatus === s ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s as ChallengeStatus].label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Challenge</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Challenge title *" className="game-input w-full" autoFocus />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ChallengeCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [ChallengeCategory, typeof CAT_CONFIG.fitness][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this challenge about?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.dailyAction} onChange={e => setForm(f => ({ ...f, dailyAction: e.target.value }))}
            placeholder="Daily action required" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value as Duration }))} className="game-input text-sm flex-1">
              <option value="7days">7 Days</option>
              <option value="14days">14 Days</option>
              <option value="21days">21 Days</option>
              <option value="30days">30 Days</option>
              <option value="60days">60 Days</option>
              <option value="90days">90 Days</option>
              <option value="custom">Custom</option>
            </select>
            {form.duration === 'custom' && (
              <input type="number" value={form.customDays} min={1}
                onChange={e => setForm(f => ({ ...f, customDays: Number(e.target.value) }))}
                className="game-input w-20 text-sm" />
            )}
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Accept Challenge</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(c => {
          const cat = CAT_CONFIG[c.category]
          const st = STATUS_CONFIG[c.status]
          const isExp = expanded === c.id
          const pct = c.targetDays > 0 ? Math.min((c.progress / c.targetDays) * 100, 100) : 0
          return (
            <div key={c.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${st.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : c.id)}>
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{c.title}</span>
                    <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: st.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{c.progress}/{c.targetDays}d</span>
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                  {c.dailyAction && <p className="text-xs text-blue-400">⚡ Daily: {c.dailyAction}</p>}
                  <p className="text-xs text-slate-500">Started: {c.startDate}</p>
                  <div className="flex gap-2">
                    {c.status === 'active' && (
                      <button onClick={() => checkIn(c.id)} className="flex-1 py-1.5 bg-green-700/20 text-green-400 rounded-xl text-xs">
                        <Check className="w-3 h-3 inline mr-1" />Check In Today
                      </button>
                    )}
                    <button onClick={() => save(challenges.map(x => x.id === c.id ? { ...x, status: x.status === 'paused' ? 'active' : 'paused' } : x))}
                      className="flex-1 py-1.5 bg-yellow-700/20 text-yellow-400 rounded-xl text-xs">
                      {c.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => save(challenges.filter(x => x.id !== c.id))} className="text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Set a challenge. Prove what you're made of.</p>
          </div>
        )}
      </div>
    </div>
  )
}
