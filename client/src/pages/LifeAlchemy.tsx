import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AdversityType = 'failure' | 'loss' | 'rejection' | 'betrayal' | 'illness' | 'conflict' | 'uncertainty' | 'shame' | 'regret' | 'grief'
type TransformLevel = 'raw' | 'processing' | 'integrating' | 'growing' | 'transcended'

interface LifeAlchemyEntry {
  id: string
  adversity: AdversityType
  transformLevel: TransformLevel
  whatHappened: string
  howItHurtInitially: string
  giftHidden: string
  howItStrengthened: string
  wisdomGained: string
  howYouUsedIt: string
  gratitudeForIt: string
  growthScore: number
  date: string
  createdAt: string
}

const ADVERSITY_CONFIG: Record<AdversityType, { label: string; emoji: string; color: string }> = {
  failure:     { label: 'Failure',     emoji: '💔', color: '#ef4444' },
  loss:        { label: 'Loss',        emoji: '🌑', color: '#6366f1' },
  rejection:   { label: 'Rejection',   emoji: '🚫', color: '#f97316' },
  betrayal:    { label: 'Betrayal',    emoji: '⚡', color: '#f59e0b' },
  illness:     { label: 'Illness',     emoji: '🤒', color: '#94a3b8' },
  conflict:    { label: 'Conflict',    emoji: '⚔️', color: '#ec4899' },
  uncertainty: { label: 'Uncertainty', emoji: '❓', color: '#3b82f6' },
  shame:       { label: 'Shame',       emoji: '😔', color: '#8b5cf6' },
  regret:      { label: 'Regret',      emoji: '🌧️', color: '#22c55e' },
  grief:       { label: 'Grief',       emoji: '💧', color: '#a855f7' },
}

const TRANSFORM_CONFIG: Record<TransformLevel, { label: string; color: string }> = {
  raw:         { label: 'Raw Pain',    color: '#ef4444' },
  processing:  { label: 'Processing',  color: '#f97316' },
  integrating: { label: 'Integrating', color: '#f59e0b' },
  growing:     { label: 'Growing',     color: '#3b82f6' },
  transcended: { label: 'Transcended', color: '#a855f7' },
}

const STORAGE_KEY = 'life_alchemy_log'

export default function LifeAlchemy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifeAlchemyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeAlchemyEntry, 'id' | 'createdAt'>>({
    adversity: 'failure', transformLevel: 'integrating', whatHappened: '',
    howItHurtInitially: '', giftHidden: '', howItStrengthened: '',
    wisdomGained: '', howYouUsedIt: '', gratitudeForIt: '', growthScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeAlchemyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatHappened.trim()) return
    const e: LifeAlchemyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatHappened: '', howItHurtInitially: '', giftHidden: '', howItStrengthened: '', wisdomGained: '', howYouUsedIt: '', gratitudeForIt: '' }))
    setShowForm(false)
    toastSuccess('Alchemy logged — every wound becomes wisdom, every darkness becomes light ✨')
  }

  const transcended = entries.filter(e => e.transformLevel === 'transcended' || e.transformLevel === 'growing').length
  const avgGrowth = entries.length ? Math.round(entries.reduce((s, e) => s + e.growthScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-violet-400" />
            Life Alchemy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Transform adversity into wisdom, pain into power.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Alchemized</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{transcended}</div>
          <div className="text-xs text-slate-500">Transcended</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgGrowth}/10</div>
          <div className="text-xs text-slate-500">Avg Growth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Alchemy Entry</h3>
          <div className="flex gap-2">
            <select value={form.adversity} onChange={e => setForm(f => ({ ...f, adversity: e.target.value as AdversityType }))} className="game-input text-sm flex-1">
              {(Object.entries(ADVERSITY_CONFIG) as [AdversityType, typeof ADVERSITY_CONFIG.failure][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.transformLevel} onChange={e => setForm(f => ({ ...f, transformLevel: e.target.value as TransformLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(TRANSFORM_CONFIG) as [TransformLevel, typeof TRANSFORM_CONFIG.integrating][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened? *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.howItHurtInitially} onChange={e => setForm(f => ({ ...f, howItHurtInitially: e.target.value }))}
            placeholder="How did it hurt initially?" className="game-input w-full text-sm" />
          <input value={form.giftHidden} onChange={e => setForm(f => ({ ...f, giftHidden: e.target.value }))}
            placeholder="What gift was hidden in this adversity?" className="game-input w-full text-sm" />
          <input value={form.howItStrengthened} onChange={e => setForm(f => ({ ...f, howItStrengthened: e.target.value }))}
            placeholder="How did it ultimately strengthen you?" className="game-input w-full text-sm" />
          <input value={form.wisdomGained} onChange={e => setForm(f => ({ ...f, wisdomGained: e.target.value }))}
            placeholder="Key wisdom gained" className="game-input w-full text-sm" />
          <input value={form.howYouUsedIt} onChange={e => setForm(f => ({ ...f, howYouUsedIt: e.target.value }))}
            placeholder="How are you using this for good?" className="game-input w-full text-sm" />
          <input value={form.gratitudeForIt} onChange={e => setForm(f => ({ ...f, gratitudeForIt: e.target.value }))}
            placeholder="What are you grateful for in this?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Growth achieved: {form.growthScore}/10</p>
            <input type="range" min={1} max={10} value={form.growthScore}
              onChange={e => setForm(f => ({ ...f, growthScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = ADVERSITY_CONFIG[e.adversity]
          const t = TRANSFORM_CONFIG[e.transformLevel]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-violet-400">✨ {e.growthScore}/10</span>
                </div>
                {e.giftHidden && <p className="text-xs text-yellow-300/70 mt-1">🎁 {e.giftHidden}</p>}
                {e.wisdomGained && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">💡 {e.wisdomGained}</p>}
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
            <p className="text-sm">The alchemist turns lead into gold. Turn your wounds into wisdom.</p>
          </div>
        )}
      </div>
    </div>
  )
}
