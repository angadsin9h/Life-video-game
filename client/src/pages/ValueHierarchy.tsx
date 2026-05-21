import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ValueDomain = 'personal' | 'relational' | 'professional' | 'spiritual' | 'civic' | 'aesthetic' | 'intellectual' | 'physical'
type ValueConflict = 'none' | 'minor' | 'moderate' | 'significant' | 'critical'

interface ValueHierarchyEntry {
  id: string
  valueName: string
  domain: ValueDomain
  conflictLevel: ValueConflict
  definition: string
  whyItMatters: string
  howYouLiveIt: string
  whenYouViolateIt: string
  tradeoffsAccept: string
  rank: number
  liveScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<ValueDomain, { label: string; emoji: string; color: string }> = {
  personal:      { label: 'Personal',      emoji: '🪞', color: '#6366f1' },
  relational:    { label: 'Relational',    emoji: '❤️', color: '#ec4899' },
  professional:  { label: 'Professional',  emoji: '💼', color: '#f59e0b' },
  spiritual:     { label: 'Spiritual',     emoji: '🙏', color: '#a855f7' },
  civic:         { label: 'Civic',         emoji: '🌍', color: '#22c55e' },
  aesthetic:     { label: 'Aesthetic',     emoji: '🎨', color: '#f97316' },
  intellectual:  { label: 'Intellectual',  emoji: '🧠', color: '#3b82f6' },
  physical:      { label: 'Physical',      emoji: '💪', color: '#84cc16' },
}

const CONFLICT_CONFIG: Record<ValueConflict, { label: string; color: string }> = {
  none:        { label: 'No Conflict',      color: '#22c55e' },
  minor:       { label: 'Minor Conflict',   color: '#84cc16' },
  moderate:    { label: 'Moderate',         color: '#f59e0b' },
  significant: { label: 'Significant',      color: '#f97316' },
  critical:    { label: 'Critical',         color: '#ef4444' },
}

const STORAGE_KEY = 'value_hierarchy_log'

export default function ValueHierarchy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ValueHierarchyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ValueHierarchyEntry, 'id' | 'createdAt'>>({
    valueName: '', domain: 'personal', conflictLevel: 'none',
    definition: '', whyItMatters: '', howYouLiveIt: '',
    whenYouViolateIt: '', tradeoffsAccept: '', rank: 1, liveScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ValueHierarchyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.valueName.trim()) return
    const e: ValueHierarchyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([...entries, e].sort((a, b) => a.rank - b.rank))
    setForm(f => ({ ...f, valueName: '', definition: '', whyItMatters: '', howYouLiveIt: '', whenYouViolateIt: '', tradeoffsAccept: '' }))
    setShowForm(false)
    toastSuccess('Value mapped — clarity of values is clarity of life 💎')
  }

  const avgLive = entries.length ? Math.round(entries.reduce((s, e) => s + e.liveScore, 0) / entries.length) : 0
  const conflicts = entries.filter(e => e.conflictLevel === 'significant' || e.conflictLevel === 'critical').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Value Hierarchy
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map, rank, and live your most important values consciously.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Value
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Values</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{conflicts}</div>
          <div className="text-xs text-slate-500">Conflicts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgLive}/10</div>
          <div className="text-xs text-slate-500">Live Score</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map a Value</h3>
          <input value={form.valueName} onChange={e => setForm(f => ({ ...f, valueName: e.target.value }))}
            placeholder="Value name (e.g., Freedom, Integrity, Love) *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as ValueDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [ValueDomain, typeof DOMAIN_CONFIG.personal][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.conflictLevel} onChange={e => setForm(f => ({ ...f, conflictLevel: e.target.value as ValueConflict }))} className="game-input text-sm flex-1">
              {(Object.entries(CONFLICT_CONFIG) as [ValueConflict, typeof CONFLICT_CONFIG.none][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <input value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
            placeholder="How do YOU define this value?" className="game-input w-full text-sm" />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why does this matter deeply to you?" className="game-input w-full text-sm" />
          <input value={form.howYouLiveIt} onChange={e => setForm(f => ({ ...f, howYouLiveIt: e.target.value }))}
            placeholder="How do you currently live this value?" className="game-input w-full text-sm" />
          <input value={form.whenYouViolateIt} onChange={e => setForm(f => ({ ...f, whenYouViolateIt: e.target.value }))}
            placeholder="When do you tend to violate this value?" className="game-input w-full text-sm" />
          <input value={form.tradeoffsAccept} onChange={e => setForm(f => ({ ...f, tradeoffsAccept: e.target.value }))}
            placeholder="What trade-offs do you accept for this value?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rank: #{form.rank}</p>
              <input type="range" min={1} max={20} value={form.rank}
                onChange={e => setForm(f => ({ ...f, rank: Number(e.target.value) }))}
                className="w-full h-1 accent-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Living it: {form.liveScore}/10</p>
              <input type="range" min={1} max={10} value={form.liveScore}
                onChange={e => setForm(f => ({ ...f, liveScore: Number(e.target.value) }))}
                className="w-full h-1 accent-rose-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">Add to Hierarchy</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const c = CONFLICT_CONFIG[e.conflictLevel]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-slate-500 text-xs font-bold w-6 text-center mt-1">#{e.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">{e.valueName}</span>
                  <span className="text-xs">{d.emoji} {d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: c.color + '20', color: c.color }}>{c.label}</span>
                  <span className="text-xs text-rose-400">💎 {e.liveScore}/10</span>
                </div>
                {e.definition && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.definition}</p>}
                {e.tradeoffsAccept && <p className="text-xs text-yellow-300/70 mt-0.5">Trade-off: {e.tradeoffsAccept}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your values are your compass. Map them, then live them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
