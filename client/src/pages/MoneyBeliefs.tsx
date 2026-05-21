import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BeliefOrigin = 'parents' | 'culture' | 'school' | 'religion' | 'experience' | 'media' | 'trauma' | 'mentor' | 'self-developed'
type MoneyRelationship = 'scarcity' | 'abundance' | 'neutral' | 'complicated' | 'fear' | 'excitement' | 'indifference' | 'respect'

interface MoneyBeliefEntry {
  id: string
  belief: string
  origin: BeliefOrigin
  relationship: MoneyRelationship
  howItLimits: string
  newBelief: string
  moneyTruth: string
  actionToShift: string
  evidence: string
  holdStrength: number
  date: string
  createdAt: string
}

const ORIGIN_CONFIG: Record<BeliefOrigin, { label: string; emoji: string }> = {
  parents:       { label: 'Parents',       emoji: '👨‍👩‍👧' },
  culture:       { label: 'Culture',       emoji: '🌍' },
  school:        { label: 'School',        emoji: '📚' },
  religion:      { label: 'Religion',      emoji: '⛪' },
  experience:    { label: 'Experience',    emoji: '💼' },
  media:         { label: 'Media',         emoji: '📺' },
  trauma:        { label: 'Trauma',        emoji: '💔' },
  mentor:        { label: 'Mentor',        emoji: '🎓' },
  'self-developed':{ label: 'Self-Developed',emoji: '🌱' },
}

const REL_CONFIG: Record<MoneyRelationship, { label: string; emoji: string; color: string }> = {
  scarcity:     { label: 'Scarcity',     emoji: '😟', color: '#ef4444' },
  abundance:    { label: 'Abundance',    emoji: '🌊', color: '#22c55e' },
  neutral:      { label: 'Neutral',      emoji: '⚖️', color: '#94a3b8' },
  complicated:  { label: 'Complicated',  emoji: '🌀', color: '#f97316' },
  fear:         { label: 'Fear',         emoji: '😨', color: '#ef4444' },
  excitement:   { label: 'Excitement',   emoji: '🤩', color: '#f59e0b' },
  indifference: { label: 'Indifference', emoji: '😐', color: '#6b7280' },
  respect:      { label: 'Respect',      emoji: '🙏', color: '#a855f7' },
}

const STORAGE_KEY = 'money_beliefs'

export default function MoneyBeliefs() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MoneyBeliefEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MoneyBeliefEntry, 'id' | 'createdAt'>>({
    belief: '', origin: 'parents', relationship: 'scarcity',
    howItLimits: '', newBelief: '', moneyTruth: '', actionToShift: '', evidence: '',
    holdStrength: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MoneyBeliefEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.belief.trim()) return
    const e: MoneyBeliefEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, belief: '', howItLimits: '', newBelief: '', moneyTruth: '', actionToShift: '', evidence: '' }))
    setShowForm(false)
    toastSuccess('Money belief examined — financial freedom starts in the mind 💰')
  }

  const abundance = entries.filter(e => e.relationship === 'abundance').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Money Beliefs
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Examine and upgrade your money mindset at the root.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Examine
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Beliefs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{abundance}</div>
          <div className="text-xs text-slate-500">Abundance</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{entries.length - abundance}</div>
          <div className="text-xs text-slate-500">To Upgrade</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Examine Money Belief</h3>
          <textarea value={form.belief} onChange={e => setForm(f => ({ ...f, belief: e.target.value }))}
            placeholder="What belief do you have about money? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as BeliefOrigin }))} className="game-input text-sm flex-1">
              {(Object.entries(ORIGIN_CONFIG) as [BeliefOrigin, typeof ORIGIN_CONFIG.parents][]).map(([k, o]) => (
                <option key={k} value={k}>{o.emoji} {o.label}</option>
              ))}
            </select>
            <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value as MoneyRelationship }))} className="game-input text-sm flex-1">
              {(Object.entries(REL_CONFIG) as [MoneyRelationship, typeof REL_CONFIG.abundance][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.howItLimits} onChange={e => setForm(f => ({ ...f, howItLimits: e.target.value }))}
            placeholder="How does this belief limit you?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Is there counter-evidence to this belief?" className="game-input w-full text-sm" />
          <input value={form.moneyTruth} onChange={e => setForm(f => ({ ...f, moneyTruth: e.target.value }))}
            placeholder="What's a more empowering money truth?" className="game-input w-full text-sm" />
          <input value={form.newBelief} onChange={e => setForm(f => ({ ...f, newBelief: e.target.value }))}
            placeholder="New upgraded belief to adopt" className="game-input w-full text-sm" />
          <input value={form.actionToShift} onChange={e => setForm(f => ({ ...f, actionToShift: e.target.value }))}
            placeholder="Action to reinforce the new belief" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">How strongly held: {form.holdStrength}/10</p>
            <input type="range" min={1} max={10} value={form.holdStrength}
              onChange={e => setForm(f => ({ ...f, holdStrength: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log Belief</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const o = ORIGIN_CONFIG[e.origin]
          const r = REL_CONFIG[e.relationship]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  <span className="text-xs text-slate-500">{o.emoji} {o.label}</span>
                  <span className="text-xs text-green-400">💪 {e.holdStrength}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-2">{e.belief}</p>
                {e.newBelief && <p className="text-xs text-green-300/70 mt-0.5">→ {e.newBelief}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your money beliefs are your financial ceiling. Raise them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
