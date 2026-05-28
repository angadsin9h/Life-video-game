import { useState, useEffect } from 'react'
import { Flag, Plus, X, CheckCircle2, Trophy, Flame, Target, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeDuration = '7 days' | '14 days' | '21 days' | '30 days' | '66 days' | '90 days'
type ChallengeCategory = 'Fitness' | 'Mind' | 'Nutrition' | 'Sleep' | 'Social' | 'Financial' | 'Creative' | 'Spiritual' | 'Productivity' | 'Relationship'
type ChallengeStatus = 'Active' | 'Completed' | 'Failed'

interface Challenge {
  id: string
  challengeName: string
  description: string
  duration: ChallengeDuration
  startDate: string
  category: ChallengeCategory
  dailyAction: string
  whyAccepted: string
  successCriteria: string
  completedDates: string[]
  createdAt: string
}

const STORAGE_KEY = 'challenge_acceptor'

const DURATIONS: ChallengeDuration[] = ['7 days', '14 days', '21 days', '30 days', '66 days', '90 days']
const CATEGORIES: ChallengeCategory[] = ['Fitness', 'Mind', 'Nutrition', 'Sleep', 'Social', 'Financial', 'Creative', 'Spiritual', 'Productivity', 'Relationship']

const DURATION_DAYS: Record<ChallengeDuration, number> = {
  '7 days': 7, '14 days': 14, '21 days': 21, '30 days': 30, '66 days': 66, '90 days': 90,
}

const CATEGORY_COLORS: Record<ChallengeCategory, string> = {
  Fitness: '#22c55e',
  Mind: '#6366f1',
  Nutrition: '#f59e0b',
  Sleep: '#a855f7',
  Social: '#ec4899',
  Financial: '#f97316',
  Creative: '#14b8a6',
  Spiritual: '#10b981',
  Productivity: '#3b82f6',
  Relationship: '#f43f5e',
}

function today(): string { return new Date().toISOString().split('T')[0] }

function getStatus(c: Challenge): ChallengeStatus {
  const totalDays = DURATION_DAYS[c.duration]
  const start = new Date(c.startDate)
  const now = new Date()
  const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000))
  if (elapsed >= totalDays && c.completedDates.length >= totalDays) return 'Completed'
  // Check for gap > 2 days
  if (elapsed > 2) {
    const datesSet = new Set(c.completedDates)
    let maxGap = 0, gap = 0
    for (let i = 0; i <= elapsed; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      if (!datesSet.has(ds)) { gap++; if (gap > maxGap) maxGap = gap } else gap = 0
    }
    if (maxGap > 2) return 'Failed'
  }
  return 'Active'
}

function getStreak(c: Challenge): number {
  const datesSet = new Set(c.completedDates)
  let streak = 0
  const d = new Date()
  while (true) {
    const ds = d.toISOString().split('T')[0]
    if (datesSet.has(ds)) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
}

function getElapsed(c: Challenge): number {
  const start = new Date(c.startDate)
  const now = new Date()
  return Math.max(0, Math.min(DURATION_DAYS[c.duration], Math.floor((now.getTime() - start.getTime()) / 86400000) + 1))
}

export default function ChallengeAcceptor() {
  const { toastSuccess } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Challenge, 'id' | 'completedDates' | 'createdAt'>>({
    challengeName: '',
    description: '',
    duration: '30 days',
    startDate: today(),
    category: 'Fitness',
    dailyAction: '',
    whyAccepted: '',
    successCriteria: '',
  })

  useEffect(() => {
    try { setChallenges(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (u: Challenge[]) => {
    setChallenges(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    if (!form.challengeName.trim()) return
    const c: Challenge = {
      id: Date.now().toString(),
      ...form,
      completedDates: [],
      createdAt: new Date().toISOString(),
    }
    persist([c, ...challenges])
    setForm(f => ({
      ...f, challengeName: '', description: '', dailyAction: '', whyAccepted: '', successCriteria: '',
    }))
    setShowForm(false)
    toastSuccess('Challenge accepted — you\'ve got this!')
  }

  const checkIn = (id: string) => {
    const t = today()
    const updated = challenges.map(c => {
      if (c.id !== id) return c
      if (c.completedDates.includes(t)) return c
      return { ...c, completedDates: [...c.completedDates, t] }
    })
    persist(updated)
    toastSuccess('Day checked in — keep the streak alive!')
  }

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const completed = challenges.filter(c => getStatus(c) === 'Completed').length
  const failed = challenges.filter(c => getStatus(c) === 'Failed').length
  const active = challenges.filter(c => getStatus(c) === 'Active').length
  const overallRate = challenges.length
    ? Math.round((completed / challenges.length) * 100)
    : 0

  const STATUS_STYLES: Record<ChallengeStatus, { bg: string; text: string; label: string }> = {
    Active: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Active' },
    Completed: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Completed' },
    Failed: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Failed' },
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flag className="w-7 h-7 text-amber-400" />
            Challenge Acceptor
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Accept and track personal challenges — 7 to 90 days.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Accept
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{challenges.length}</div>
          <div className="text-xs text-slate-500">Accepted</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{overallRate}%</div>
          <div className="text-xs text-slate-500">Rate</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Challenge</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <input value={form.challengeName} onChange={e => set('challengeName', e.target.value)}
            placeholder="Challenge name *" className="game-input w-full text-sm" autoFocus />
          <input value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe this challenge" className="game-input w-full text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.duration} onChange={e => set('duration', e.target.value as ChallengeDuration)} className="game-input text-sm">
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.category} onChange={e => set('category', e.target.value as ChallengeCategory)} className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
              className="game-input w-full text-sm mt-0.5" />
          </div>
          <input value={form.dailyAction} onChange={e => set('dailyAction', e.target.value)}
            placeholder="Daily action (what you do each day)" className="game-input w-full text-sm" />
          <input value={form.whyAccepted} onChange={e => set('whyAccepted', e.target.value)}
            placeholder="Why are you accepting this challenge?" className="game-input w-full text-sm" />
          <input value={form.successCriteria} onChange={e => set('successCriteria', e.target.value)}
            placeholder="Success criteria" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
              Accept Challenge
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Challenges list */}
      {challenges.length > 0 && (
        <div className="space-y-3">
          {challenges.map(c => {
            const status = getStatus(c)
            const totalDays = DURATION_DAYS[c.duration]
            const elapsed = getElapsed(c)
            const streak = getStreak(c)
            const completionRate = elapsed > 0 ? Math.round((c.completedDates.length / elapsed) * 100) : 0
            const pct = Math.round((elapsed / totalDays) * 100)
            const checkedToday = c.completedDates.includes(today())
            const color = CATEGORY_COLORS[c.category]
            const ss = STATUS_STYLES[status]

            return (
              <div key={c.id} className="game-card p-4 space-y-3" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{c.challengeName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ss.bg} ${ss.text}`}>
                        {ss.label}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                      <span style={{ color }}>{c.category}</span>
                      <span>· {c.duration}</span>
                      <span>· Started {c.startDate}</span>
                    </div>
                  </div>
                  {status === 'Active' && (
                    <button
                      onClick={() => checkIn(c.id)}
                      disabled={checkedToday}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                        checkedToday
                          ? 'bg-green-900/40 text-green-400 cursor-default'
                          : 'bg-amber-700 hover:bg-amber-600 text-white'
                      }`}>
                      {checkedToday ? <><CheckCircle2 className="w-3.5 h-3.5" /> Done</> : <><RefreshCw className="w-3.5 h-3.5" /> Check In</>}
                    </button>
                  )}
                </div>

                {c.dailyAction && (
                  <p className="text-xs text-slate-400 italic">Daily: {c.dailyAction}</p>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Day {elapsed} / {totalDays}</span>
                    <span>{pct}% through</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{streak} streak</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{c.completedDates.length} days done</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>{completionRate}% rate</span>
                  </div>
                  {status === 'Completed' && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Complete!</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {challenges.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Flag className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Growth lives just outside your comfort zone. Accept a challenge.</p>
        </div>
      )}
    </div>
  )
}
