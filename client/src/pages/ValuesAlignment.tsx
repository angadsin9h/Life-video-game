import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ValueDomain = 'personal' | 'professional' | 'relational' | 'spiritual' | 'civic' | 'creative' | 'physical' | 'intellectual' | 'financial' | 'other'
type AlignmentLevel = 'misaligned' | 'somewhat' | 'mostly' | 'well-aligned' | 'perfectly'

interface ValueEntry {
  id: string
  value: string
  domain: ValueDomain
  alignment: AlignmentLevel
  whyItMatters: string
  howLivingIt: string
  gapsToClose: string
  dailyExpression: string
  importanceRank: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ValueDomain, { label: string; emoji: string; color: string }> = {
  personal:      { label: 'Personal',      emoji: '⭐', color: '#f59e0b' },
  professional:  { label: 'Professional',  emoji: '💼', color: '#3b82f6' },
  relational:    { label: 'Relational',    emoji: '❤️', color: '#ec4899' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#a855f7' },
  civic:         { label: 'Civic',         emoji: '🌍', color: '#22c55e' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  physical:      { label: 'Physical',      emoji: '💪', color: '#ef4444' },
  intellectual:  { label: 'Intellectual',  emoji: '🧠', color: '#6366f1' },
  financial:     { label: 'Financial',     emoji: '💰', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '🔮', color: '#94a3b8' },
}

const ALIGNMENT_CONFIG: Record<AlignmentLevel, { label: string; color: string; pct: number }> = {
  misaligned:     { label: 'Misaligned',    color: '#ef4444', pct: 10 },
  somewhat:       { label: 'Somewhat',      color: '#f97316', pct: 35 },
  mostly:         { label: 'Mostly',        color: '#f59e0b', pct: 65 },
  'well-aligned': { label: 'Well-Aligned',  color: '#22c55e', pct: 85 },
  perfectly:      { label: 'Perfectly',     color: '#a855f7', pct: 100 },
}

const STORAGE_KEY = 'values_alignment'

export default function ValuesAlignment() {
  const { toastSuccess } = useToast()
  const [values, setValues] = useState<ValueEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ValueEntry, 'id' | 'createdAt'>>({
    value: '', domain: 'personal', alignment: 'mostly', whyItMatters: '',
    howLivingIt: '', gapsToClose: '', dailyExpression: '', importanceRank: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setValues(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ValueEntry[]) => { setValues(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.value.trim()) return
    const e: ValueEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...values])
    setForm(f => ({ ...f, value: '', whyItMatters: '', howLivingIt: '', gapsToClose: '', dailyExpression: '' }))
    setShowForm(false)
    toastSuccess('Value aligned — live what you believe 💎')
  }

  const wellAligned = values.filter(v => v.alignment === 'well-aligned' || v.alignment === 'perfectly').length
  const avgAlignment = values.length
    ? Math.round(values.reduce((s, v) => s + ALIGNMENT_CONFIG[v.alignment].pct, 0) / values.length)
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Values Alignment
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Identify your values. Track how aligned your life is.</p>
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
          <div className="text-xl font-bold text-green-400">{wellAligned}</div>
          <div className="text-xs text-slate-500">Well-Aligned</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{avgAlignment}%</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Core Value</h3>
          <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="Value (e.g. Integrity, Freedom, Growth) *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ValueDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ValueDomain, typeof DOMAIN_CONFIG.personal][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.alignment} onChange={e => setForm(f => ({ ...f, alignment: e.target.value as AlignmentLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(ALIGNMENT_CONFIG) as [AlignmentLevel, typeof ALIGNMENT_CONFIG.mostly][]).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this value matter to you?" className="game-input w-full text-sm" />
          <input value={form.howLivingIt} onChange={e => setForm(f => ({ ...f, howLivingIt: e.target.value }))}
            placeholder="How are you currently living this value?" className="game-input w-full text-sm" />
          <input value={form.gapsToClose} onChange={e => setForm(f => ({ ...f, gapsToClose: e.target.value }))}
            placeholder="Gaps to close to live it more fully" className="game-input w-full text-sm" />
          <input value={form.dailyExpression} onChange={e => setForm(f => ({ ...f, dailyExpression: e.target.value }))}
            placeholder="How do you express this daily?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Importance: {form.importanceRank}/10</p>
            <input type="range" min={1} max={10} value={form.importanceRank}
              onChange={e => setForm(f => ({ ...f, importanceRank: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Add Value</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {[...values].sort((a, b) => b.importanceRank - a.importanceRank).map(v => {
          const d = DOMAIN_CONFIG[v.domain]
          const a = ALIGNMENT_CONFIG[v.alignment]
          return (
            <div key={v.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{v.value}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: a.color + '20', color: a.color }}>{a.label}</span>
                  <span className="text-xs text-pink-400">★ {v.importanceRank}/10</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1 mt-1.5">
                  <div className="h-1 rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
                </div>
                {v.howLivingIt && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{v.howLivingIt}</p>}
                {v.gapsToClose && <p className="text-xs text-orange-300/70 mt-0.5">Gap: {v.gapsToClose}</p>}
              </div>
              <button onClick={() => save(values.filter(x => x.id !== v.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {values.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Know your values. Live by them. That's integrity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
