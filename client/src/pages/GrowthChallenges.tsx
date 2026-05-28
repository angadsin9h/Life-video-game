import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeArea = 'fitness' | 'mental' | 'social' | 'creative' | 'financial' | 'spiritual' | 'learning' | 'discipline' | 'emotional' | 'professional'
type ChallengeStatus = 'planning' | 'active' | 'completed' | 'failed' | 'paused'
type ChallengeDuration = '7-days' | '14-days' | '21-days' | '30-days' | '60-days' | '90-days'

interface ChallengeEntry {
  id: string
  title: string
  area: ChallengeArea
  status: ChallengeStatus
  duration: ChallengeDuration
  whyThisChallenge: string
  dailyAction: string
  successCriteria: string
  currentStreak: number
  lessonsLearned: string
  progressPct: number
  startDate: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ChallengeArea, { label: string; emoji: string; color: string }> = {
  fitness:      { label: 'Fitness',      emoji: '💪', color: '#ef4444' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#6366f1' },
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#f97316' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#f59e0b' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#a855f7' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#3b82f6' },
  discipline:   { label: 'Discipline',   emoji: '⚔️', color: '#84cc16' },
  emotional:    { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  professional: { label: 'Professional', emoji: '🚀', color: '#0ea5e9' },
}

const STATUS_CONFIG: Record<ChallengeStatus, { label: string; color: string }> = {
  planning:  { label: 'Planning',   color: '#94a3b8' },
  active:    { label: 'Active',     color: '#22c55e' },
  completed: { label: 'Completed',  color: '#3b82f6' },
  failed:    { label: 'Failed',     color: '#ef4444' },
  paused:    { label: 'Paused',     color: '#f59e0b' },
}

const DURATION_CONFIG: Record<ChallengeDuration, string> = {
  '7-days':  '7 Days',
  '14-days': '14 Days',
  '21-days': '21 Days',
  '30-days': '30 Days',
  '60-days': '60 Days',
  '90-days': '90 Days',
}

const STORAGE_KEY = 'growth_challenges'

export default function GrowthChallenges() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ChallengeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ChallengeEntry, 'id' | 'createdAt'>>({
    title: '', area: 'discipline', status: 'active', duration: '30-days',
    whyThisChallenge: '', dailyAction: '', successCriteria: '', currentStreak: 0,
    lessonsLearned: '', progressPct: 0, startDate: new Date().toISOString().split('T')[0],
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ChallengeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: ChallengeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', whyThisChallenge: '', dailyAction: '', successCriteria: '', lessonsLearned: '', currentStreak: 0, progressPct: 0 }))
    setShowForm(false)
    toastSuccess('Growth challenge created — commit to the process 🔥')
  }

  const active = entries.filter(e => e.status === 'active').length
  const completed = entries.filter(e => e.status === 'completed').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-red-400" />
            Growth Challenges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Design intentional challenges to accelerate your growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Challenges</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Create Growth Challenge</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Challenge title *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ChallengeArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ChallengeArea, typeof AREA_CONFIG.discipline][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value as ChallengeDuration }))} className="game-input text-sm flex-1">
              {(Object.entries(DURATION_CONFIG) as [ChallengeDuration, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ChallengeStatus }))} className="game-input w-full text-sm">
            {(Object.entries(STATUS_CONFIG) as [ChallengeStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
          <input value={form.whyThisChallenge} onChange={e => setForm(f => ({ ...f, whyThisChallenge: e.target.value }))}
            placeholder="Why are you doing this challenge?" className="game-input w-full text-sm" />
          <input value={form.dailyAction} onChange={e => setForm(f => ({ ...f, dailyAction: e.target.value }))}
            placeholder="Daily action / commitment" className="game-input w-full text-sm" />
          <input value={form.successCriteria} onChange={e => setForm(f => ({ ...f, successCriteria: e.target.value }))}
            placeholder="How will you know you succeeded?" className="game-input w-full text-sm" />
          <input value={form.lessonsLearned} onChange={e => setForm(f => ({ ...f, lessonsLearned: e.target.value }))}
            placeholder="Lessons learned so far (if active)" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current streak: {form.currentStreak} days</p>
              <input type="range" min={0} max={90} value={form.currentStreak}
                onChange={e => setForm(f => ({ ...f, currentStreak: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Progress: {form.progressPct}%</p>
              <input type="range" min={0} max={100} value={form.progressPct}
                onChange={e => setForm(f => ({ ...f, progressPct: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Create Challenge</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.title}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{DURATION_CONFIG[e.duration]}</span>
                  {e.currentStreak > 0 && <span className="text-xs text-red-400">🔥 {e.currentStreak}d</span>}
                </div>
                <div className="mt-1.5 bg-slate-700 rounded-full h-1">
                  <div className="h-1 rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                    style={{ width: `${e.progressPct}%` }} />
                </div>
                {e.dailyAction && <p className="text-xs text-slate-400 mt-1 line-clamp-1">Daily: {e.dailyAction}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Growth lives at the edge of comfort. Challenge yourself.</p>
          </div>
        )}
      </div>
    </div>
  )
}
