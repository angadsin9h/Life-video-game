import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BeliefDomain = 'self' | 'world' | 'others' | 'money' | 'success' | 'love' | 'health' | 'god' | 'meaning' | 'time'
type BeliefType = 'empowering' | 'limiting' | 'neutral' | 'questioning' | 'replacing'

interface BeliefEntry {
  id: string
  belief: string
  domain: BeliefDomain
  beliefType: BeliefType
  origin: string
  evidence: string
  cost: string
  newBelief: string
  howToReinforce: string
  strengthScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<BeliefDomain, { label: string; emoji: string; color: string }> = {
  self:    { label: 'Self',    emoji: '🪞', color: '#6366f1' },
  world:   { label: 'World',  emoji: '🌍', color: '#22c55e' },
  others:  { label: 'Others', emoji: '👥', color: '#ec4899' },
  money:   { label: 'Money',  emoji: '💰', color: '#f59e0b' },
  success: { label: 'Success',emoji: '🏆', color: '#f97316' },
  love:    { label: 'Love',   emoji: '❤️', color: '#ef4444' },
  health:  { label: 'Health', emoji: '💪', color: '#84cc16' },
  god:     { label: 'God/Universe',emoji: '✨', color: '#a855f7' },
  meaning: { label: 'Meaning',emoji: '🌟', color: '#3b82f6' },
  time:    { label: 'Time',   emoji: '⏳', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<BeliefType, { label: string; color: string; emoji: string }> = {
  empowering: { label: 'Empowering', color: '#22c55e', emoji: '⚡' },
  limiting:   { label: 'Limiting',   color: '#ef4444', emoji: '🔒' },
  neutral:    { label: 'Neutral',    color: '#94a3b8', emoji: '⚖️' },
  questioning:{ label: 'Questioning',color: '#f59e0b', emoji: '❓' },
  replacing:  { label: 'Replacing',  color: '#a855f7', emoji: '🔄' },
}

const STORAGE_KEY = 'belief_system'

export default function BeliefSystem() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BeliefEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BeliefEntry, 'id' | 'createdAt'>>({
    belief: '', domain: 'self', beliefType: 'limiting', origin: '',
    evidence: '', cost: '', newBelief: '', howToReinforce: '',
    strengthScore: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BeliefEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.belief.trim()) return
    const e: BeliefEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, belief: '', origin: '', evidence: '', cost: '', newBelief: '', howToReinforce: '' }))
    setShowForm(false)
    toastSuccess('Belief logged — examine and upgrade your operating system 🧠')
  }

  const empowering = entries.filter(e => e.beliefType === 'empowering').length
  const limiting = entries.filter(e => e.beliefType === 'limiting').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-violet-400" />
            Belief System
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Examine, upgrade, and install better beliefs.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Beliefs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{empowering}</div>
          <div className="text-xs text-slate-500">Empowering</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{limiting}</div>
          <div className="text-xs text-slate-500">Limiting</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Belief</h3>
          <textarea value={form.belief} onChange={e => setForm(f => ({ ...f, belief: e.target.value }))}
            placeholder="State the belief *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as BeliefDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [BeliefDomain, typeof DOMAIN_CONFIG.self][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.beliefType} onChange={e => setForm(f => ({ ...f, beliefType: e.target.value as BeliefType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [BeliefType, typeof TYPE_CONFIG.empowering][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            placeholder="Where did this belief come from?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence for / against this belief" className="game-input w-full text-sm" />
          <input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
            placeholder="Cost of holding this belief" className="game-input w-full text-sm" />
          <input value={form.newBelief} onChange={e => setForm(f => ({ ...f, newBelief: e.target.value }))}
            placeholder="Upgraded belief to replace it with" className="game-input w-full text-sm" />
          <input value={form.howToReinforce} onChange={e => setForm(f => ({ ...f, howToReinforce: e.target.value }))}
            placeholder="How to reinforce the new belief" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Belief strength: {form.strengthScore}/10</p>
            <input type="range" min={1} max={10} value={form.strengthScore}
              onChange={e => setForm(f => ({ ...f, strengthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Log Belief</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const t = TYPE_CONFIG[e.beliefType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{t.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs text-violet-400">💪 {e.strengthScore}/10</span>
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
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your beliefs are your operating system. Upgrade them deliberately.</p>
          </div>
        )}
      </div>
    </div>
  )
}
