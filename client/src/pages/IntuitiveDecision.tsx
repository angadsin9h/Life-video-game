import { useState, useEffect } from 'react'
import { Compass, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DecisionDomain = 'career' | 'relationships' | 'health' | 'finances' | 'creativity' | 'spirituality' | 'lifestyle' | 'education' | 'purpose' | 'adventure'
type IntuitionStrength = 'whisper' | 'nudge' | 'pull' | 'strong-pull' | 'undeniable'

interface IntuitiveDecisionEntry {
  id: string
  domain: DecisionDomain
  intuition: IntuitionStrength
  theDecision: string
  whatYourGutSaid: string
  whatLogicSaid: string
  fearsPresent: string
  whoYouConsulted: string
  choiceMade: string
  resultSoFar: string
  trustLevel: string
  alignmentScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<DecisionDomain, { label: string; emoji: string; color: string }> = {
  career:       { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships:{ label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  finances:     { label: 'Finances',     emoji: '💰', color: '#f59e0b' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#f97316' },
  spirituality: { label: 'Spirituality', emoji: '✨', color: '#a855f7' },
  lifestyle:    { label: 'Lifestyle',    emoji: '🌿', color: '#10b981' },
  education:    { label: 'Education',    emoji: '📚', color: '#6366f1' },
  purpose:      { label: 'Purpose',      emoji: '🧭', color: '#eab308' },
  adventure:    { label: 'Adventure',    emoji: '🗺️', color: '#ef4444' },
}

const INTUITION_CONFIG: Record<IntuitionStrength, { label: string; color: string }> = {
  whisper:      { label: 'Whisper',      color: '#94a3b8' },
  nudge:        { label: 'Nudge',        color: '#f59e0b' },
  pull:         { label: 'Pull',         color: '#3b82f6' },
  'strong-pull':{ label: 'Strong Pull',  color: '#f97316' },
  undeniable:   { label: 'Undeniable',   color: '#22c55e' },
}

const STORAGE_KEY = 'intuitive_decision_log'

export default function IntuitiveDecision() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<IntuitiveDecisionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<IntuitiveDecisionEntry, 'id' | 'createdAt'>>({
    domain: 'career', intuition: 'pull', theDecision: '',
    whatYourGutSaid: '', whatLogicSaid: '', fearsPresent: '',
    whoYouConsulted: '', choiceMade: '', resultSoFar: '', trustLevel: '', alignmentScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: IntuitiveDecisionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.theDecision.trim()) return
    const e: IntuitiveDecisionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, theDecision: '', whatYourGutSaid: '', whatLogicSaid: '', fearsPresent: '', whoYouConsulted: '', choiceMade: '', resultSoFar: '', trustLevel: '' }))
    setShowForm(false)
    toastSuccess('Intuitive decision logged — trust is built by honoring what you know before you know why 🧭')
  }

  const strongPulls = entries.filter(e => e.intuition === 'undeniable' || e.intuition === 'strong-pull').length
  const avgAlignment = entries.length ? Math.round(entries.reduce((s, e) => s + e.alignmentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-amber-400" />
            Intuitive Decision
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your intuitive decisions and build trust in your inner compass.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Decisions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{strongPulls}</div>
          <div className="text-xs text-slate-500">Strong Pulls</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgAlignment}/10</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Intuitive Decision</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as DecisionDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [DecisionDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.intuition} onChange={e => setForm(f => ({ ...f, intuition: e.target.value as IntuitionStrength }))} className="game-input text-sm flex-1">
              {(Object.entries(INTUITION_CONFIG) as [IntuitionStrength, typeof INTUITION_CONFIG.pull][]).map(([k, i]) => (
                <option key={k} value={k}>{i.label}</option>
              ))}
            </select>
          </div>
          <input value={form.theDecision} onChange={e => setForm(f => ({ ...f, theDecision: e.target.value }))}
            placeholder="The decision you faced *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatYourGutSaid} onChange={e => setForm(f => ({ ...f, whatYourGutSaid: e.target.value }))}
            placeholder="What your gut was saying" className="game-input w-full text-sm" />
          <input value={form.whatLogicSaid} onChange={e => setForm(f => ({ ...f, whatLogicSaid: e.target.value }))}
            placeholder="What logical analysis was saying" className="game-input w-full text-sm" />
          <input value={form.fearsPresent} onChange={e => setForm(f => ({ ...f, fearsPresent: e.target.value }))}
            placeholder="Fears that were present" className="game-input w-full text-sm" />
          <input value={form.whoYouConsulted} onChange={e => setForm(f => ({ ...f, whoYouConsulted: e.target.value }))}
            placeholder="Who or what you consulted" className="game-input w-full text-sm" />
          <input value={form.choiceMade} onChange={e => setForm(f => ({ ...f, choiceMade: e.target.value }))}
            placeholder="The choice you ultimately made" className="game-input w-full text-sm" />
          <input value={form.resultSoFar} onChange={e => setForm(f => ({ ...f, resultSoFar: e.target.value }))}
            placeholder="Result or outcome so far" className="game-input w-full text-sm" />
          <input value={form.trustLevel} onChange={e => setForm(f => ({ ...f, trustLevel: e.target.value }))}
            placeholder="Your trust level in your intuition now" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Alignment with your true self: {form.alignmentScore}/10</p>
            <input type="range" min={1} max={10} value={form.alignmentScore}
              onChange={e => setForm(f => ({ ...f, alignmentScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const i = INTUITION_CONFIG[e.intuition]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: i.color + '20', color: i.color }}>{i.label}</span>
                  <span className="text-xs text-amber-400">🧭 {e.alignmentScore}/10</span>
                </div>
                {e.theDecision && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.theDecision}</p>}
                {e.choiceMade && <p className="text-xs text-green-300/70 mt-0.5 line-clamp-1">→ {e.choiceMade}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Intuition is the accumulated wisdom of your entire life, compressed into a feeling.</p>
          </div>
        )}
      </div>
    </div>
  )
}
