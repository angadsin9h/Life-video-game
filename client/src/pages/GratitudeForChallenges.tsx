import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ChallengeType = 'failure' | 'loss' | 'rejection' | 'illness' | 'conflict' | 'crisis' | 'betrayal' | 'obstacle' | 'uncertainty' | 'pain'
type GrowthGained = 'resilience' | 'wisdom' | 'empathy' | 'clarity' | 'strength' | 'humility' | 'courage' | 'love' | 'perspective' | 'freedom'

interface GratitudeChallengeEntry {
  id: string
  challengeType: ChallengeType
  growthGained: GrowthGained
  theChallenge: string
  initialPain: string
  hiddenBlessing: string
  whatYouGained: string
  howYouGrew: string
  gratitudeStatement: string
  gratitudeScore: number
  date: string
  createdAt: string
}

const CHALLENGE_CONFIG: Record<ChallengeType, { label: string; emoji: string; color: string }> = {
  failure:     { label: 'Failure',     emoji: '💔', color: '#ef4444' },
  loss:        { label: 'Loss',        emoji: '🌧️', color: '#94a3b8' },
  rejection:   { label: 'Rejection',   emoji: '🚫', color: '#f97316' },
  illness:     { label: 'Illness',     emoji: '🤒', color: '#84cc16' },
  conflict:    { label: 'Conflict',    emoji: '⚔️', color: '#f59e0b' },
  crisis:      { label: 'Crisis',      emoji: '🆘', color: '#dc2626' },
  betrayal:    { label: 'Betrayal',    emoji: '🗡️', color: '#6366f1' },
  obstacle:    { label: 'Obstacle',    emoji: '🧱', color: '#a855f7' },
  uncertainty: { label: 'Uncertainty', emoji: '🌀', color: '#3b82f6' },
  pain:        { label: 'Pain',        emoji: '💢', color: '#ec4899' },
}

const GROWTH_CONFIG: Record<GrowthGained, { label: string; color: string }> = {
  resilience:  { label: 'Resilience',  color: '#ef4444' },
  wisdom:      { label: 'Wisdom',      color: '#f59e0b' },
  empathy:     { label: 'Empathy',     color: '#ec4899' },
  clarity:     { label: 'Clarity',     color: '#3b82f6' },
  strength:    { label: 'Strength',    color: '#22c55e' },
  humility:    { label: 'Humility',    color: '#94a3b8' },
  courage:     { label: 'Courage',     color: '#f97316' },
  love:        { label: 'Love',        color: '#a855f7' },
  perspective: { label: 'Perspective', color: '#6366f1' },
  freedom:     { label: 'Freedom',     color: '#84cc16' },
}

const STORAGE_KEY = 'gratitude_challenges_log'

export default function GratitudeForChallenges() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeChallengeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GratitudeChallengeEntry, 'id' | 'createdAt'>>({
    challengeType: 'failure', growthGained: 'resilience', theChallenge: '',
    initialPain: '', hiddenBlessing: '', whatYouGained: '',
    howYouGrew: '', gratitudeStatement: '', gratitudeScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratitudeChallengeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.theChallenge.trim()) return
    const e: GratitudeChallengeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, theChallenge: '', initialPain: '', hiddenBlessing: '', whatYouGained: '', howYouGrew: '', gratitudeStatement: '' }))
    setShowForm(false)
    toastSuccess('Obstacle transformed into gratitude — your greatest challenges are your greatest teachers 🌱')
  }

  const avgGratitude = entries.length ? Math.round(entries.reduce((s, e) => s + e.gratitudeScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-rose-400" />
            Gratitude for Challenges
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Find the hidden blessings in your hardest experiences.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Challenges</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{entries.filter(e => e.challengeType === 'failure' || e.challengeType === 'crisis').length}</div>
          <div className="text-xs text-slate-500">Big Ones</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgGratitude}/10</div>
          <div className="text-xs text-slate-500">Avg Gratitude</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Gratitude for Challenge</h3>
          <div className="flex gap-2">
            <select value={form.challengeType} onChange={e => setForm(f => ({ ...f, challengeType: e.target.value as ChallengeType }))} className="game-input text-sm flex-1">
              {(Object.entries(CHALLENGE_CONFIG) as [ChallengeType, typeof CHALLENGE_CONFIG.failure][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.growthGained} onChange={e => setForm(f => ({ ...f, growthGained: e.target.value as GrowthGained }))} className="game-input text-sm flex-1">
              {(Object.entries(GROWTH_CONFIG) as [GrowthGained, typeof GROWTH_CONFIG.resilience][]).map(([k, g]) => (
                <option key={k} value={k}>{g.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.theChallenge} onChange={e => setForm(f => ({ ...f, theChallenge: e.target.value }))}
            placeholder="Describe the challenge *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.initialPain} onChange={e => setForm(f => ({ ...f, initialPain: e.target.value }))}
            placeholder="What was the initial pain or difficulty?" className="game-input w-full text-sm" />
          <input value={form.hiddenBlessing} onChange={e => setForm(f => ({ ...f, hiddenBlessing: e.target.value }))}
            placeholder="What hidden blessing did it contain?" className="game-input w-full text-sm" />
          <input value={form.whatYouGained} onChange={e => setForm(f => ({ ...f, whatYouGained: e.target.value }))}
            placeholder="What did you gain from going through this?" className="game-input w-full text-sm" />
          <input value={form.howYouGrew} onChange={e => setForm(f => ({ ...f, howYouGrew: e.target.value }))}
            placeholder="How did this make you stronger or wiser?" className="game-input w-full text-sm" />
          <input value={form.gratitudeStatement} onChange={e => setForm(f => ({ ...f, gratitudeStatement: e.target.value }))}
            placeholder="Complete: I am grateful for this because..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Gratitude for this challenge: {form.gratitudeScore}/10</p>
            <input type="range" min={1} max={10} value={form.gratitudeScore}
              onChange={e => setForm(f => ({ ...f, gratitudeScore: Number(e.target.value) }))}
              className="w-full h-1 accent-rose-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">Find the Blessing</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const ch = CHALLENGE_CONFIG[e.challengeType]
          const g = GROWTH_CONFIG[e.growthGained]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${ch.color}` }}>
              <span className="text-2xl">{ch.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{ch.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: g.color + '20', color: g.color }}>{g.label}</span>
                  <span className="text-xs text-rose-400">🙏 {e.gratitudeScore}/10</span>
                </div>
                {e.hiddenBlessing && <p className="text-xs text-green-300/80 mt-1 line-clamp-2">✨ {e.hiddenBlessing}</p>}
                {e.gratitudeStatement && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{e.gratitudeStatement}"</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The obstacle is the way. Your hardest challenges hold your greatest gifts.</p>
          </div>
        )}
      </div>
    </div>
  )
}
