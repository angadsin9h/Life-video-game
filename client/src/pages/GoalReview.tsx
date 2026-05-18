import { useState, useEffect } from 'react'
import { Target, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ReviewPeriod = 'weekly' | 'monthly' | 'quarterly' | 'annual'
type GoalReviewStatus = 'on-track' | 'behind' | 'at-risk' | 'completed' | 'paused' | 'abandoned'

interface GoalReviewEntry {
  id: string
  period: ReviewPeriod
  goalName: string
  area: string
  status: GoalReviewStatus
  progressPct: number
  whatWorked: string
  whatDidnt: string
  adjustment: string
  nextMilestone: string
  blockers: string
  energyLevel: number
  commitmentLevel: number
  reviewDate: string
  createdAt: string
}

const PERIOD_CONFIG: Record<ReviewPeriod, { label: string; color: string; emoji: string }> = {
  weekly:    { label: 'Weekly',    color: '#3b82f6', emoji: '📅' },
  monthly:   { label: 'Monthly',   color: '#22c55e', emoji: '📆' },
  quarterly: { label: 'Quarterly', color: '#f59e0b', emoji: '🗓️' },
  annual:    { label: 'Annual',    color: '#a855f7', emoji: '🎯' },
}

const STATUS_CONFIG: Record<GoalReviewStatus, { label: string; color: string }> = {
  'on-track':  { label: 'On Track',  color: '#22c55e' },
  behind:      { label: 'Behind',    color: '#f59e0b' },
  'at-risk':   { label: 'At Risk',   color: '#ef4444' },
  completed:   { label: 'Completed', color: '#a855f7' },
  paused:      { label: 'Paused',    color: '#3b82f6' },
  abandoned:   { label: 'Abandoned', color: '#475569' },
}

const STORAGE_KEY = 'goal_review_log'

export default function GoalReview() {
  const { toastSuccess } = useToast()
  const [reviews, setReviews] = useState<GoalReviewEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GoalReviewEntry, 'id' | 'createdAt'>>({
    period: 'weekly', goalName: '', area: '', status: 'on-track',
    progressPct: 50, whatWorked: '', whatDidnt: '', adjustment: '',
    nextMilestone: '', blockers: '', energyLevel: 7, commitmentLevel: 8,
    reviewDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setReviews(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GoalReviewEntry[]) => { setReviews(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.goalName.trim()) return
    const r: GoalReviewEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...reviews])
    setForm(f => ({ ...f, goalName: '', area: '', whatWorked: '', whatDidnt: '', adjustment: '', nextMilestone: '', blockers: '' }))
    setShowForm(false)
    toastSuccess('Goal review logged 🎯')
  }

  const onTrack = reviews.filter(r => r.status === 'on-track').length
  const avgProgress = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.progressPct, 0) / reviews.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Target className="w-7 h-7 text-green-400" />
            Goal Reviews
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Review goal progress systematically and adjust strategy.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Review
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{reviews.length}</div>
          <div className="text-xs text-slate-500">Reviews</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{onTrack}</div>
          <div className="text-xs text-slate-500">On Track</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgProgress}%</div>
          <div className="text-xs text-slate-500">Avg Progress</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Goal Review</h3>
          <div className="flex gap-2">
            <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value as ReviewPeriod }))} className="game-input text-sm flex-1">
              {(Object.entries(PERIOD_CONFIG) as [ReviewPeriod, typeof PERIOD_CONFIG.weekly][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as GoalReviewStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [GoalReviewStatus, typeof STATUS_CONFIG['on-track']][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.goalName} onChange={e => setForm(f => ({ ...f, goalName: e.target.value }))}
            placeholder="Goal name *" className="game-input w-full" autoFocus />
          <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            placeholder="Life area (health, career, etc.)" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Progress: {form.progressPct}%</p>
            <input type="range" min={0} max={100} step={5} value={form.progressPct}
              onChange={e => setForm(f => ({ ...f, progressPct: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <textarea value={form.whatWorked} onChange={e => setForm(f => ({ ...f, whatWorked: e.target.value }))}
            placeholder="What worked this period?" className="game-input w-full h-10 resize-none text-sm" />
          <textarea value={form.whatDidnt} onChange={e => setForm(f => ({ ...f, whatDidnt: e.target.value }))}
            placeholder="What didn't work?" className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.adjustment} onChange={e => setForm(f => ({ ...f, adjustment: e.target.value }))}
            placeholder="Strategy adjustment going forward" className="game-input w-full text-sm" />
          <input value={form.nextMilestone} onChange={e => setForm(f => ({ ...f, nextMilestone: e.target.value }))}
            placeholder="Next milestone" className="game-input w-full text-sm" />
          <input value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
            placeholder="Current blockers / obstacles" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy for goal: {form.energyLevel}/10</p>
              <input type="range" min={1} max={10} value={form.energyLevel}
                onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Commitment: {form.commitmentLevel}/10</p>
              <input type="range" min={1} max={10} value={form.commitmentLevel}
                onChange={e => setForm(f => ({ ...f, commitmentLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reviews.map(r => {
          const p = PERIOD_CONFIG[r.period]
          const s = STATUS_CONFIG[r.status]
          return (
            <div key={r.id} className="game-card p-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{r.goalName}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                    <span className="text-xs text-slate-500">{p.label}</span>
                  </div>
                  {r.area && <p className="text-xs text-slate-500">{r.area} · {r.reviewDate}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                      <div className="h-1.5 rounded-full" style={{ width: `${r.progressPct}%`, background: s.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{r.progressPct}%</span>
                  </div>
                  {r.adjustment && <p className="text-xs text-yellow-300 mt-0.5">→ {r.adjustment}</p>}
                </div>
                <button onClick={() => save(reviews.filter(x => x.id !== r.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {reviews.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Review your goals regularly — direction beats intention every time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
