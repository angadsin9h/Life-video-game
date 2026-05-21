import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BeliefType = 'empowering' | 'limiting'
type BeliefArea = 'identity' | 'ability' | 'worthiness' | 'relationships' | 'money' | 'success' | 'health' | 'love' | 'purpose' | 'other'

interface BeliefEntry {
  id: string
  beliefType: BeliefType
  area: BeliefArea
  limitingBelief: string
  origin: string
  evidence: string
  powerBelief: string
  affirmation: string
  conviction: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<BeliefArea, { label: string; emoji: string; color: string }> = {
  identity:      { label: 'Identity',     emoji: '🪞', color: '#a855f7' },
  ability:       { label: 'Ability',      emoji: '⚡', color: '#3b82f6' },
  worthiness:    { label: 'Worthiness',   emoji: '👑', color: '#f59e0b' },
  relationships: { label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  money:         { label: 'Money',        emoji: '💰', color: '#22c55e' },
  success:       { label: 'Success',      emoji: '🏆', color: '#f97316' },
  health:        { label: 'Health',       emoji: '💪', color: '#ef4444' },
  love:          { label: 'Love',         emoji: '💕', color: '#f43f5e' },
  purpose:       { label: 'Purpose',      emoji: '🎯', color: '#6366f1' },
  other:         { label: 'Other',        emoji: '💭', color: '#94a3b8' },
}

const STORAGE_KEY = 'power_beliefs'

export default function PowerBeliefs() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BeliefEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'all' | 'empowering' | 'limiting'>('all')
  const [form, setForm] = useState<Omit<BeliefEntry, 'id' | 'createdAt'>>({
    beliefType: 'limiting', area: 'identity', limitingBelief: '', origin: '',
    evidence: '', powerBelief: '', affirmation: '', conviction: 5,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BeliefEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.limitingBelief.trim()) return
    const e: BeliefEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, limitingBelief: '', origin: '', evidence: '', powerBelief: '', affirmation: '' }))
    setShowForm(false)
    toastSuccess('Belief mapped — rewrite your mental programming ⚡')
  }

  const limiting = entries.filter(e => e.beliefType === 'limiting').length
  const empowering = entries.filter(e => e.beliefType === 'empowering').length
  const filtered = view === 'all' ? entries : entries.filter(e => e.beliefType === view)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Power Beliefs
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify limiting beliefs and rewrite them into power beliefs.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{limiting}</div>
          <div className="text-xs text-slate-500">Limiting</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{empowering}</div>
          <div className="text-xs text-slate-500">Empowering</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Mapped</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'limiting', 'empowering'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 rounded-full text-xs capitalize ${view === v ? 'bg-yellow-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {v}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map a Belief</h3>
          <div className="flex gap-2">
            <select value={form.beliefType} onChange={e => setForm(f => ({ ...f, beliefType: e.target.value as BeliefType }))} className="game-input text-sm flex-1">
              <option value="limiting">⛓️ Limiting Belief</option>
              <option value="empowering">⚡ Power Belief</option>
            </select>
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as BeliefArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [BeliefArea, typeof AREA_CONFIG.identity][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.limitingBelief} onChange={e => setForm(f => ({ ...f, limitingBelief: e.target.value }))}
            placeholder={form.beliefType === 'limiting' ? 'The limiting belief (e.g. I\'m not smart enough) *' : 'The empowering belief (e.g. I figure things out) *'}
            className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            placeholder="Where did this belief come from?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence that challenges or supports this belief" className="game-input w-full text-sm" />
          {form.beliefType === 'limiting' && (
            <input value={form.powerBelief} onChange={e => setForm(f => ({ ...f, powerBelief: e.target.value }))}
              placeholder="Reframe as a power belief →" className="game-input w-full text-sm" />
          )}
          <input value={form.affirmation} onChange={e => setForm(f => ({ ...f, affirmation: e.target.value }))}
            placeholder="Daily affirmation to reinforce this" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Current conviction: {form.conviction}/10</p>
            <input type="range" min={1} max={10} value={form.conviction}
              onChange={e => setForm(f => ({ ...f, conviction: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save Belief</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const a = AREA_CONFIG[e.area]
          const isLimiting = e.beliefType === 'limiting'
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3"
              style={{ borderLeft: `3px solid ${isLimiting ? '#ef4444' : '#22c55e'}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isLimiting ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {isLimiting ? '⛓️ Limiting' : '⚡ Power'}
                  </span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-yellow-400">💪 {e.conviction}/10</span>
                </div>
                <p className={`text-xs mt-1 ${isLimiting ? 'text-red-300 line-through' : 'text-green-300 font-medium'}`}>{e.limitingBelief}</p>
                {e.powerBelief && <p className="text-xs text-green-300 mt-0.5">→ {e.powerBelief}</p>}
                {e.affirmation && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{e.affirmation}"</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your beliefs shape your reality. Map them and upgrade them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
