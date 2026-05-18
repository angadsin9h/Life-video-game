import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ValueDomain = 'character' | 'relationships' | 'work' | 'growth' | 'society' | 'health' | 'spirituality' | 'creativity' | 'freedom' | 'other'
type ValueRank = 'core' | 'important' | 'aspirational'

interface PersonalValue {
  id: string
  domain: ValueDomain
  rank: ValueRank
  value: string
  definition: string
  whyMatters: string
  howLiving: string
  gapScore: number
  examples: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ValueDomain, { label: string; emoji: string; color: string }> = {
  character:    { label: 'Character',    emoji: '🏛️', color: '#6366f1' },
  relationships:{ label: 'Relationships',emoji: '❤️', color: '#ec4899' },
  work:         { label: 'Work',         emoji: '💼', color: '#3b82f6' },
  growth:       { label: 'Growth',       emoji: '🌱', color: '#22c55e' },
  society:      { label: 'Society',      emoji: '🌍', color: '#f97316' },
  health:       { label: 'Health',       emoji: '💪', color: '#ef4444' },
  spirituality: { label: 'Spirituality', emoji: '✨', color: '#a855f7' },
  creativity:   { label: 'Creativity',   emoji: '🎨', color: '#f59e0b' },
  freedom:      { label: 'Freedom',      emoji: '🦅', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '⭐', color: '#94a3b8' },
}

const RANK_CONFIG: Record<ValueRank, { label: string; color: string }> = {
  core:         { label: 'Core',        color: '#f59e0b' },
  important:    { label: 'Important',   color: '#3b82f6' },
  aspirational: { label: 'Aspirational',color: '#a855f7' },
}

const SAMPLE_VALUES = [
  'Integrity', 'Courage', 'Compassion', 'Excellence', 'Authenticity', 'Family',
  'Freedom', 'Growth', 'Service', 'Wisdom', 'Justice', 'Love', 'Creativity', 'Loyalty',
]

const STORAGE_KEY = 'personal_values_v2'

export default function PersonalValues2() {
  const { toastSuccess } = useToast()
  const [values, setValues] = useState<PersonalValue[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<PersonalValue, 'id' | 'createdAt'>>({
    domain: 'character', rank: 'core', value: '', definition: '',
    whyMatters: '', howLiving: '', gapScore: 5, examples: '',
  })

  useEffect(() => {
    try { setValues(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PersonalValue[]) => { setValues(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.value.trim()) return
    const v: PersonalValue = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([v, ...values])
    setForm(f => ({ ...f, value: '', definition: '', whyMatters: '', howLiving: '', examples: '' }))
    setShowForm(false)
    toastSuccess('Value defined ❤️')
  }

  const filtered = values.filter(v => filterDomain === 'all' || v.domain === filterDomain)
  const core = values.filter(v => v.rank === 'core').length
  const avgGap = values.length ? Math.round(values.reduce((s, v) => s + v.gapScore, 0) / values.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Core Values
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define what you stand for and check how well you're living it.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{values.length}</div>
          <div className="text-xs text-slate-500">Values</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{core}</div>
          <div className="text-xs text-slate-500">Core</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgGap}/10</div>
          <div className="text-xs text-slate-500">Living It</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [ValueDomain, typeof DOMAIN_CONFIG.character][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Define a Value</h3>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_VALUES.map(v => (
              <button key={v} onClick={() => setForm(f => ({ ...f, value: v }))}
                className="px-2 py-1 bg-pink-900/30 text-pink-300 rounded-lg text-xs">{v}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ValueDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ValueDomain, typeof DOMAIN_CONFIG.character][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value as ValueRank }))} className="game-input text-sm flex-1">
              {(Object.entries(RANK_CONFIG) as [ValueRank, typeof RANK_CONFIG.core][]).map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="Value name *" className="game-input w-full" autoFocus />
          <textarea value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
            placeholder="What does this value mean to you specifically?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whyMatters} onChange={e => setForm(f => ({ ...f, whyMatters: e.target.value }))}
            placeholder="Why does this value matter to you?" className="game-input w-full text-sm" />
          <input value={form.howLiving} onChange={e => setForm(f => ({ ...f, howLiving: e.target.value }))}
            placeholder="How are you currently living this value?" className="game-input w-full text-sm" />
          <input value={form.examples} onChange={e => setForm(f => ({ ...f, examples: e.target.value }))}
            placeholder="Example of you living this value well" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">How well are you living this value? {form.gapScore}/10</p>
            <input type="range" min={0} max={10} value={form.gapScore}
              onChange={e => setForm(f => ({ ...f, gapScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(v => {
          const d = DOMAIN_CONFIG[v.domain]
          const r = RANK_CONFIG[v.rank]
          return (
            <div key={v.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{v.value}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                </div>
                {v.definition && <p className="text-xs text-slate-400 mt-0.5 italic">{v.definition}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-700 rounded-full">
                    <div className="h-1 rounded-full bg-pink-500" style={{ width: `${v.gapScore * 10}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">Living it {v.gapScore}/10</span>
                </div>
              </div>
              <button onClick={() => save(values.filter(x => x.id !== v.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your values are your compass. Define them or life will define you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
