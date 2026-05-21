import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ActionDomain = 'career' | 'health' | 'relationships' | 'finances' | 'creativity' | 'learning' | 'service' | 'spiritual' | 'personal' | 'adventure'
type ActionOrigin = 'intuition' | 'inspiration' | 'planning' | 'opportunity' | 'necessity' | 'desire' | 'calling' | 'fear' | 'love' | 'curiosity'

interface InspiredActionEntry {
  id: string
  domain: ActionDomain
  origin: ActionOrigin
  action: string
  whatInspiresIt: string
  whyNow: string
  fearOrResistance: string
  resourcesNeeded: string
  firstStep: string
  result: string
  alignmentScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ActionDomain, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#f59e0b' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#a855f7' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  service:       { label: 'Service',       emoji: '🙌', color: '#10b981' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#94a3b8' },
  personal:      { label: 'Personal',      emoji: '🪞', color: '#f97316' },
  adventure:     { label: 'Adventure',     emoji: '🌍', color: '#ef4444' },
}

const ORIGIN_CONFIG: Record<ActionOrigin, { label: string; color: string }> = {
  intuition:   { label: 'Intuition',   color: '#a855f7' },
  inspiration: { label: 'Inspiration', color: '#f59e0b' },
  planning:    { label: 'Planning',    color: '#3b82f6' },
  opportunity: { label: 'Opportunity', color: '#22c55e' },
  necessity:   { label: 'Necessity',   color: '#ef4444' },
  desire:      { label: 'Desire',      color: '#ec4899' },
  calling:     { label: 'Calling',     color: '#6366f1' },
  fear:        { label: 'Fear',        color: '#94a3b8' },
  love:        { label: 'Love',        color: '#f97316' },
  curiosity:   { label: 'Curiosity',   color: '#10b981' },
}

const STORAGE_KEY = 'inspired_action_log'

export default function InspiredAction() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<InspiredActionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<InspiredActionEntry, 'id' | 'createdAt'>>({
    domain: 'personal', origin: 'intuition', action: '',
    whatInspiresIt: '', whyNow: '', fearOrResistance: '',
    resourcesNeeded: '', firstStep: '', result: '', alignmentScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: InspiredActionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.action.trim()) return
    const e: InspiredActionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, action: '', whatInspiresIt: '', whyNow: '', fearOrResistance: '', resourcesNeeded: '', firstStep: '', result: '' }))
    setShowForm(false)
    toastSuccess('Inspired action logged — act from inspiration, not desperation ⚡')
  }

  const inspired = entries.filter(e => e.origin === 'intuition' || e.origin === 'calling' || e.origin === 'inspiration').length
  const avgAlignment = entries.length ? Math.round(entries.reduce((s, e) => s + e.alignmentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-orange-400" />
            Inspired Action
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Log actions born from inspiration, intuition, and calling.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Actions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{inspired}</div>
          <div className="text-xs text-slate-500">From Calling</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgAlignment}/10</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Inspired Action</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ActionDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ActionDomain, typeof DOMAIN_CONFIG.personal][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as ActionOrigin }))} className="game-input text-sm flex-1">
              {(Object.entries(ORIGIN_CONFIG) as [ActionOrigin, typeof ORIGIN_CONFIG.intuition][]).map(([k, o]) => (
                <option key={k} value={k}>{o.label}</option>
              ))}
            </select>
          </div>
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="The inspired action you took or will take *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatInspiresIt} onChange={e => setForm(f => ({ ...f, whatInspiresIt: e.target.value }))}
            placeholder="What is inspiring this action?" className="game-input w-full text-sm" />
          <input value={form.whyNow} onChange={e => setForm(f => ({ ...f, whyNow: e.target.value }))}
            placeholder="Why now is the right time?" className="game-input w-full text-sm" />
          <input value={form.fearOrResistance} onChange={e => setForm(f => ({ ...f, fearOrResistance: e.target.value }))}
            placeholder="Fear or resistance you're moving through" className="game-input w-full text-sm" />
          <input value={form.resourcesNeeded} onChange={e => setForm(f => ({ ...f, resourcesNeeded: e.target.value }))}
            placeholder="Resources needed for this action" className="game-input w-full text-sm" />
          <input value={form.firstStep} onChange={e => setForm(f => ({ ...f, firstStep: e.target.value }))}
            placeholder="Your very first step" className="game-input w-full text-sm" />
          <input value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
            placeholder="Result or outcome (if known)" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Alignment with values: {form.alignmentScore}/10</p>
            <input type="range" min={1} max={10} value={form.alignmentScore}
              onChange={e => setForm(f => ({ ...f, alignmentScore: Number(e.target.value) }))}
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
          const o = ORIGIN_CONFIG[e.origin]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.label}</span>
                  <span className="text-xs text-orange-400">⚡ {e.alignmentScore}/10</span>
                </div>
                {e.action && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.action}</p>}
                {e.result && <p className="text-xs text-green-300/70 mt-0.5">→ {e.result}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Inspired action moves mountains. Desperate action moves you in circles.</p>
          </div>
        )}
      </div>
    </div>
  )
}
