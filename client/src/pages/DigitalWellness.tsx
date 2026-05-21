import { useState, useEffect } from 'react'
import { Smartphone, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DigitalHabit = 'social-media' | 'news-consumption' | 'email' | 'streaming' | 'gaming' | 'messaging' | 'browsing' | 'content-creation' | 'learning' | 'productivity'
type WellnessImpact = 'draining' | 'neutral' | 'mixed' | 'energizing' | 'transformative'

interface DigitalWellnessEntry {
  id: string
  habit: DigitalHabit
  impact: WellnessImpact
  minutesSpent: number
  intentional: boolean
  whatTriggered: string
  howYouFeltAfter: string
  valueGained: string
  alternativeConsidered: string
  boundarySet: string
  nextDayPlan: string
  wellnessScore: number
  date: string
  createdAt: string
}

const HABIT_CONFIG: Record<DigitalHabit, { label: string; emoji: string; color: string }> = {
  'social-media':      { label: 'Social Media',      emoji: '📱', color: '#3b82f6' },
  'news-consumption':  { label: 'News',              emoji: '📰', color: '#6366f1' },
  email:               { label: 'Email',             emoji: '✉️', color: '#f59e0b' },
  streaming:           { label: 'Streaming',         emoji: '📺', color: '#ef4444' },
  gaming:              { label: 'Gaming',            emoji: '🎮', color: '#a855f7' },
  messaging:           { label: 'Messaging',         emoji: '💬', color: '#22c55e' },
  browsing:            { label: 'Browsing',          emoji: '🌐', color: '#94a3b8' },
  'content-creation':  { label: 'Content Creation',  emoji: '✍️', color: '#f97316' },
  learning:            { label: 'Digital Learning',  emoji: '📚', color: '#10b981' },
  productivity:        { label: 'Productivity Tools', emoji: '⚙️', color: '#eab308' },
}

const IMPACT_CONFIG: Record<WellnessImpact, { label: string; color: string }> = {
  draining:      { label: 'Draining',      color: '#ef4444' },
  neutral:       { label: 'Neutral',       color: '#94a3b8' },
  mixed:         { label: 'Mixed',         color: '#f59e0b' },
  energizing:    { label: 'Energizing',    color: '#3b82f6' },
  transformative:{ label: 'Transformative', color: '#22c55e' },
}

const STORAGE_KEY = 'digital_wellness_log'

export default function DigitalWellness() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DigitalWellnessEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<DigitalWellnessEntry, 'id' | 'createdAt'>>({
    habit: 'social-media', impact: 'mixed', minutesSpent: 30, intentional: false,
    whatTriggered: '', howYouFeltAfter: '', valueGained: '',
    alternativeConsidered: '', boundarySet: '', nextDayPlan: '', wellnessScore: 5,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DigitalWellnessEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatTriggered.trim()) return
    const e: DigitalWellnessEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatTriggered: '', howYouFeltAfter: '', valueGained: '', alternativeConsidered: '', boundarySet: '', nextDayPlan: '' }))
    setShowForm(false)
    toastSuccess('Digital wellness logged — conscious consumption is the foundation of a free mind 📱')
  }

  const intentional = entries.filter(e => e.intentional).length
  const avgWellness = entries.length ? Math.round(entries.reduce((s, e) => s + e.wellnessScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Smartphone className="w-7 h-7 text-blue-400" />
            Digital Wellness
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and optimize your digital habits for a healthier mind.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{intentional}</div>
          <div className="text-xs text-slate-500">Intentional</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgWellness}/10</div>
          <div className="text-xs text-slate-500">Avg Wellness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Digital Habit</h3>
          <div className="flex gap-2">
            <select value={form.habit} onChange={e => setForm(f => ({ ...f, habit: e.target.value as DigitalHabit }))} className="game-input text-sm flex-1">
              {(Object.entries(HABIT_CONFIG) as [DigitalHabit, typeof HABIT_CONFIG.email][]).map(([k, h]) => (
                <option key={k} value={k}>{h.emoji} {h.label}</option>
              ))}
            </select>
            <select value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value as WellnessImpact }))} className="game-input text-sm flex-1">
              {(Object.entries(IMPACT_CONFIG) as [WellnessImpact, typeof IMPACT_CONFIG.mixed][]).map(([k, i]) => (
                <option key={k} value={k}>{i.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input type="number" min={1} value={form.minutesSpent} onChange={e => setForm(f => ({ ...f, minutesSpent: Number(e.target.value) }))}
              className="game-input text-sm w-24" placeholder="Minutes" />
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={form.intentional} onChange={e => setForm(f => ({ ...f, intentional: e.target.checked }))}
                className="accent-blue-400" />
              Intentional use
            </label>
          </div>
          <input value={form.whatTriggered} onChange={e => setForm(f => ({ ...f, whatTriggered: e.target.value }))}
            placeholder="What triggered this digital session? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.howYouFeltAfter} onChange={e => setForm(f => ({ ...f, howYouFeltAfter: e.target.value }))}
            placeholder="How did you feel after?" className="game-input w-full text-sm" />
          <input value={form.valueGained} onChange={e => setForm(f => ({ ...f, valueGained: e.target.value }))}
            placeholder="Genuine value gained from this session" className="game-input w-full text-sm" />
          <input value={form.alternativeConsidered} onChange={e => setForm(f => ({ ...f, alternativeConsidered: e.target.value }))}
            placeholder="Alternative you could have done instead" className="game-input w-full text-sm" />
          <input value={form.boundarySet} onChange={e => setForm(f => ({ ...f, boundarySet: e.target.value }))}
            placeholder="Boundary you're setting around this" className="game-input w-full text-sm" />
          <input value={form.nextDayPlan} onChange={e => setForm(f => ({ ...f, nextDayPlan: e.target.value }))}
            placeholder="How you'll handle this better tomorrow" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Digital wellness maintained: {form.wellnessScore}/10</p>
            <input type="range" min={1} max={10} value={form.wellnessScore}
              onChange={e => setForm(f => ({ ...f, wellnessScore: Number(e.target.value) }))}
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
          const h = HABIT_CONFIG[e.habit]
          const i = IMPACT_CONFIG[e.impact]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${h.color}` }}>
              <span className="text-2xl">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{h.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.label}</span>
                  <span className="text-xs text-slate-400">{e.minutesSpent}m</span>
                  {e.intentional && <span className="text-xs text-green-400">✓ Intentional</span>}
                </div>
                {e.whatTriggered && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatTriggered}</p>}
                {e.boundarySet && <p className="text-xs text-blue-300/70 mt-0.5 line-clamp-1">→ {e.boundarySet}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your attention is your most valuable resource. Spend it like it matters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
