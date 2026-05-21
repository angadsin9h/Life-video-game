import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WillpowerDomain = 'diet' | 'exercise' | 'focus' | 'spending' | 'social-media' | 'relationships' | 'substance' | 'procrastination' | 'anger' | 'negative-thinking'
type WillpowerOutcome = 'surrendered' | 'struggled' | 'held' | 'strong' | 'effortless'

interface WillpowerEntry {
  id: string
  domain: WillpowerDomain
  outcome: WillpowerOutcome
  temptationFaced: string
  howStrongUrge: number
  strategyUsed: string
  whatHelpedMost: string
  whatWeakened: string
  immediateReward: string
  longTermWhy: string
  identityStatement: string
  willpowerScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<WillpowerDomain, { label: string; emoji: string; color: string }> = {
  diet:               { label: 'Diet',              emoji: '🥗', color: '#22c55e' },
  exercise:           { label: 'Exercise',          emoji: '💪', color: '#3b82f6' },
  focus:              { label: 'Focus',             emoji: '🎯', color: '#6366f1' },
  spending:           { label: 'Spending',          emoji: '💰', color: '#f59e0b' },
  'social-media':     { label: 'Social Media',      emoji: '📱', color: '#a855f7' },
  relationships:      { label: 'Relationships',     emoji: '❤️', color: '#ec4899' },
  substance:          { label: 'Substance',         emoji: '🚫', color: '#ef4444' },
  procrastination:    { label: 'Procrastination',   emoji: '⏱️', color: '#f97316' },
  anger:              { label: 'Anger/Reaction',    emoji: '⚡', color: '#dc2626' },
  'negative-thinking':{ label: 'Negative Thinking', emoji: '🌑', color: '#94a3b8' },
}

const OUTCOME_CONFIG: Record<WillpowerOutcome, { label: string; color: string }> = {
  surrendered: { label: 'Surrendered', color: '#ef4444' },
  struggled:   { label: 'Struggled',   color: '#f97316' },
  held:        { label: 'Held',        color: '#f59e0b' },
  strong:      { label: 'Strong',      color: '#3b82f6' },
  effortless:  { label: 'Effortless',  color: '#22c55e' },
}

const STORAGE_KEY = 'willpower_log'

export default function WillpowerLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WillpowerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<WillpowerEntry, 'id' | 'createdAt'>>({
    domain: 'focus', outcome: 'strong', temptationFaced: '',
    howStrongUrge: 7, strategyUsed: '', whatHelpedMost: '',
    whatWeakened: '', immediateReward: '', longTermWhy: '', identityStatement: '', willpowerScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WillpowerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.temptationFaced.trim()) return
    const e: WillpowerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, temptationFaced: '', strategyUsed: '', whatHelpedMost: '', whatWeakened: '', immediateReward: '', longTermWhy: '', identityStatement: '' }))
    setShowForm(false)
    toastSuccess('Willpower logged — self-mastery is the ultimate freedom 🔥')
  }

  const strongOutcomes = entries.filter(e => e.outcome === 'strong' || e.outcome === 'effortless').length
  const avgWillpower = entries.length ? Math.round(entries.reduce((s, e) => s + e.willpowerScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Willpower Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track temptations faced, strategies used, and your self-mastery growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Battles</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{strongOutcomes}</div>
          <div className="text-xs text-slate-500">Strong+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgWillpower}/10</div>
          <div className="text-xs text-slate-500">Avg Willpower</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Willpower Battle</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as WillpowerDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [WillpowerDomain, typeof DOMAIN_CONFIG.focus][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as WillpowerOutcome }))} className="game-input text-sm flex-1">
              {(Object.entries(OUTCOME_CONFIG) as [WillpowerOutcome, typeof OUTCOME_CONFIG.strong][]).map(([k, o]) => (
                <option key={k} value={k}>{o.label}</option>
              ))}
            </select>
          </div>
          <input value={form.temptationFaced} onChange={e => setForm(f => ({ ...f, temptationFaced: e.target.value }))}
            placeholder="Temptation or challenge you faced *" className="game-input w-full text-sm" autoFocus />
          <div>
            <p className="text-xs text-slate-500 mb-1">Strength of urge: {form.howStrongUrge}/10</p>
            <input type="range" min={1} max={10} value={form.howStrongUrge}
              onChange={e => setForm(f => ({ ...f, howStrongUrge: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <input value={form.strategyUsed} onChange={e => setForm(f => ({ ...f, strategyUsed: e.target.value }))}
            placeholder="Strategy you used to resist" className="game-input w-full text-sm" />
          <input value={form.whatHelpedMost} onChange={e => setForm(f => ({ ...f, whatHelpedMost: e.target.value }))}
            placeholder="What helped most in this moment" className="game-input w-full text-sm" />
          <input value={form.whatWeakened} onChange={e => setForm(f => ({ ...f, whatWeakened: e.target.value }))}
            placeholder="What weakened your willpower" className="game-input w-full text-sm" />
          <input value={form.immediateReward} onChange={e => setForm(f => ({ ...f, immediateReward: e.target.value }))}
            placeholder="Reward you gave yourself for holding" className="game-input w-full text-sm" />
          <input value={form.longTermWhy} onChange={e => setForm(f => ({ ...f, longTermWhy: e.target.value }))}
            placeholder="The long-term why behind your discipline" className="game-input w-full text-sm" />
          <input value={form.identityStatement} onChange={e => setForm(f => ({ ...f, identityStatement: e.target.value }))}
            placeholder="Identity statement that kept you aligned" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Willpower displayed: {form.willpowerScore}/10</p>
            <input type="range" min={1} max={10} value={form.willpowerScore}
              onChange={e => setForm(f => ({ ...f, willpowerScore: Number(e.target.value) }))}
              className="w-full h-1 accent-orange-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const o = OUTCOME_CONFIG[e.outcome]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.label}</span>
                  <span className="text-xs text-orange-400">🔥 {e.willpowerScore}/10</span>
                </div>
                {e.temptationFaced && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.temptationFaced}</p>}
                {e.identityStatement && <p className="text-xs text-amber-300/70 mt-0.5 line-clamp-1">💬 {e.identityStatement}</p>}
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
            <p className="text-sm">Discipline is choosing what you want most over what you want now.</p>
          </div>
        )}
      </div>
    </div>
  )
}
