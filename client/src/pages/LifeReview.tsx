import { useState, useEffect } from 'react'
import { BarChart3, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ReviewPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'decade'
type ReviewDepth = 'surface' | 'reflective' | 'deep' | 'transformative'

interface LifeReviewEntry {
  id: string
  period: ReviewPeriod
  depth: ReviewDepth
  biggestWin: string
  biggestChallenge: string
  keyLesson: string
  whatYouLetGo: string
  unexpectedGift: string
  whoMattered: string
  howYouGrew: string
  nextPeriodIntention: string
  satisfactionScore: number
  date: string
  createdAt: string
}

const PERIOD_CONFIG: Record<ReviewPeriod, { label: string; emoji: string; color: string }> = {
  daily:     { label: 'Daily',     emoji: '🌅', color: '#f59e0b' },
  weekly:    { label: 'Weekly',    emoji: '📅', color: '#22c55e' },
  monthly:   { label: 'Monthly',   emoji: '🗓️', color: '#3b82f6' },
  quarterly: { label: 'Quarterly', emoji: '📊', color: '#6366f1' },
  yearly:    { label: 'Yearly',    emoji: '🎯', color: '#f97316' },
  decade:    { label: 'Decade',    emoji: '🔭', color: '#a855f7' },
}

const DEPTH_CONFIG: Record<ReviewDepth, { label: string; color: string }> = {
  surface:         { label: 'Surface',         color: '#94a3b8' },
  reflective:      { label: 'Reflective',      color: '#3b82f6' },
  deep:            { label: 'Deep',            color: '#f59e0b' },
  transformative:  { label: 'Transformative',  color: '#22c55e' },
}

const STORAGE_KEY = 'life_review_log'

export default function LifeReview() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeReviewEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeReviewEntry, 'id' | 'createdAt'>>({
    period: 'weekly', depth: 'reflective', biggestWin: '',
    biggestChallenge: '', keyLesson: '', whatYouLetGo: '',
    unexpectedGift: '', whoMattered: '', howYouGrew: '', nextPeriodIntention: '', satisfactionScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeReviewEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.biggestWin.trim()) return
    const e: LifeReviewEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, biggestWin: '', biggestChallenge: '', keyLesson: '', whatYouLetGo: '', unexpectedGift: '', whoMattered: '', howYouGrew: '', nextPeriodIntention: '' }))
    setShowForm(false)
    toastSuccess('Life review logged — reviewed lives improve faster than unexamined ones 📊')
  }

  const deep = entries.filter(e => e.depth === 'deep' || e.depth === 'transformative').length
  const avgSatisfaction = entries.length ? Math.round(entries.reduce((s, e) => s + e.satisfactionScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Life Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Regularly review your life to extract learning and set direction.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Review
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Reviews</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{deep}</div>
          <div className="text-xs text-slate-500">Deep+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{avgSatisfaction}/10</div>
          <div className="text-xs text-slate-500">Avg Satisfaction</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Life Review</h3>
          <div className="flex gap-2">
            <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value as ReviewPeriod }))} className="game-input text-sm flex-1">
              {(Object.entries(PERIOD_CONFIG) as [ReviewPeriod, typeof PERIOD_CONFIG.weekly][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as ReviewDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [ReviewDepth, typeof DEPTH_CONFIG.reflective][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.biggestWin} onChange={e => setForm(f => ({ ...f, biggestWin: e.target.value }))}
            placeholder="Biggest win this period *" className="game-input w-full text-sm" autoFocus />
          <input value={form.biggestChallenge} onChange={e => setForm(f => ({ ...f, biggestChallenge: e.target.value }))}
            placeholder="Biggest challenge faced" className="game-input w-full text-sm" />
          <input value={form.keyLesson} onChange={e => setForm(f => ({ ...f, keyLesson: e.target.value }))}
            placeholder="Key lesson learned" className="game-input w-full text-sm" />
          <input value={form.whatYouLetGo} onChange={e => setForm(f => ({ ...f, whatYouLetGo: e.target.value }))}
            placeholder="What you let go of" className="game-input w-full text-sm" />
          <input value={form.unexpectedGift} onChange={e => setForm(f => ({ ...f, unexpectedGift: e.target.value }))}
            placeholder="An unexpected gift or blessing" className="game-input w-full text-sm" />
          <input value={form.whoMattered} onChange={e => setForm(f => ({ ...f, whoMattered: e.target.value }))}
            placeholder="Who mattered most this period?" className="game-input w-full text-sm" />
          <input value={form.howYouGrew} onChange={e => setForm(f => ({ ...f, howYouGrew: e.target.value }))}
            placeholder="How you grew as a person" className="game-input w-full text-sm" />
          <input value={form.nextPeriodIntention} onChange={e => setForm(f => ({ ...f, nextPeriodIntention: e.target.value }))}
            placeholder="Intention for the next period" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Satisfaction with period: {form.satisfactionScore}/10</p>
            <input type="range" min={1} max={10} value={form.satisfactionScore}
              onChange={e => setForm(f => ({ ...f, satisfactionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PERIOD_CONFIG[e.period]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{p.label}</span>
                  <span className="text-xs">{e.date}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-blue-400">📊 {e.satisfactionScore}/10</span>
                </div>
                {e.biggestWin && <p className="text-xs text-green-300/70 mt-1">🏆 {e.biggestWin}</p>}
                {e.keyLesson && <p className="text-xs text-yellow-300/70 mt-0.5">💡 {e.keyLesson}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The reviewed life compounds wisdom. The unexamined life repeats mistakes.</p>
          </div>
        )}
      </div>
    </div>
  )
}
