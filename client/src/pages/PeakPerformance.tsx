import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PeakState = 'flow' | 'zone' | 'peak' | 'optimal' | 'breakthrough' | 'aligned'
type PerformanceDomain = 'work' | 'creative' | 'athletic' | 'social' | 'cognitive' | 'emotional' | 'spiritual' | 'other'

interface PeakEntry {
  id: string
  state: PeakState
  domain: PerformanceDomain
  activity: string
  conditions: string
  howAchieved: string
  duration: number
  qualityScore: number
  keyFactors: string[]
  blockers: string
  replication: string
  date: string
  createdAt: string
}

const STATE_CONFIG: Record<PeakState, { label: string; emoji: string; color: string }> = {
  flow:         { label: 'Flow State',    emoji: '🌊', color: '#3b82f6' },
  zone:         { label: 'In the Zone',   emoji: '🎯', color: '#22c55e' },
  peak:         { label: 'Peak',          emoji: '⛰️', color: '#f59e0b' },
  optimal:      { label: 'Optimal',       emoji: '✨', color: '#a855f7' },
  breakthrough: { label: 'Breakthrough',  emoji: '💥', color: '#ef4444' },
  aligned:      { label: 'Fully Aligned', emoji: '🎵', color: '#0ea5e9' },
}

const DOMAIN_CONFIG: Record<PerformanceDomain, { label: string; emoji: string; color: string }> = {
  work:      { label: 'Work',      emoji: '💼', color: '#3b82f6' },
  creative:  { label: 'Creative',  emoji: '🎨', color: '#a855f7' },
  athletic:  { label: 'Athletic',  emoji: '🏃', color: '#22c55e' },
  social:    { label: 'Social',    emoji: '👥', color: '#ec4899' },
  cognitive: { label: 'Cognitive', emoji: '🧠', color: '#6366f1' },
  emotional: { label: 'Emotional', emoji: '❤️', color: '#f97316' },
  spiritual: { label: 'Spiritual', emoji: '✨', color: '#84cc16' },
  other:     { label: 'Other',     emoji: '⚡', color: '#94a3b8' },
}

const STORAGE_KEY = 'peak_performance'

export default function PeakPerformance() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PeakEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterState, setFilterState] = useState<string>('all')
  const [newFactor, setNewFactor] = useState('')
  const [form, setForm] = useState<Omit<PeakEntry, 'id' | 'createdAt'>>({
    state: 'flow', domain: 'work', activity: '', conditions: '',
    howAchieved: '', duration: 60, qualityScore: 9, keyFactors: [],
    blockers: '', replication: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PeakEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.activity.trim()) return
    const e: PeakEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, activity: '', conditions: '', howAchieved: '', keyFactors: [], blockers: '', replication: '' }))
    setNewFactor('')
    setShowForm(false)
    toastSuccess('Peak state logged 🔥')
  }

  const filtered = entries.filter(e => filterState === 'all' || e.state === filterState)
  const avgQuality = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.qualityScore, 0) / entries.length * 10) / 10 : 0
  const totalHours = Math.round(entries.reduce((s, e) => s + e.duration, 0) / 60 * 10) / 10

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-orange-400" />
            Peak Performance
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your peak states to replicate excellence.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Peak States</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{avgQuality}/10</div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Peak Hours</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterState('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterState === 'all' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(STATE_CONFIG) as [PeakState, typeof STATE_CONFIG.flow][]).map(([k, s]) => (
          <button key={k} onClick={() => setFilterState(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterState === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterState === k ? { background: s.color + '30', color: s.color } : {}}>
            {s.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Peak State</h3>
          <div className="flex gap-2">
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value as PeakState }))} className="game-input text-sm flex-1">
              {(Object.entries(STATE_CONFIG) as [PeakState, typeof STATE_CONFIG.flow][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as PerformanceDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [PerformanceDomain, typeof DOMAIN_CONFIG.work][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="What were you doing? *" className="game-input w-full" autoFocus />
          <textarea value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))}
            placeholder="What conditions enabled this state?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.howAchieved} onChange={e => setForm(f => ({ ...f, howAchieved: e.target.value }))}
            placeholder="How did you get into this state?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={newFactor} onChange={e => setNewFactor(e.target.value)}
              placeholder="Key factor..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newFactor.trim()) { setForm(f => ({ ...f, keyFactors: [...f.keyFactors, newFactor.trim()] })); setNewFactor('') } }} />
            <button onClick={() => { if (newFactor.trim()) { setForm(f => ({ ...f, keyFactors: [...f.keyFactors, newFactor.trim()] })); setNewFactor('') } }}
              className="px-3 py-1.5 bg-orange-700/30 text-orange-400 rounded-xl text-xs">+</button>
          </div>
          {form.keyFactors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.keyFactors.map((f, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full text-xs">
                  {f}
                  <button onClick={() => setForm(fo => ({ ...fo, keyFactors: fo.keyFactors.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
          <textarea value={form.replication} onChange={e => setForm(f => ({ ...f, replication: e.target.value }))}
            placeholder="How can you replicate this?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
              <input type="range" min={5} max={300} step={5} value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Quality: {form.qualityScore}/10</p>
              <input type="range" min={1} max={10} value={form.qualityScore}
                onChange={e => setForm(f => ({ ...f, qualityScore: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const s = STATE_CONFIG[e.state]
          const d = DOMAIN_CONFIG[e.domain]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.activity}</span>
                    <span className="text-xs" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{d.emoji} {d.label} · {e.duration}min · ⭐ {e.qualityScore}/10 · {e.date}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.conditions && <p className="text-xs text-slate-300">🌍 Conditions: {e.conditions}</p>}
                  {e.howAchieved && <p className="text-xs text-blue-300">🎯 How: {e.howAchieved}</p>}
                  {e.keyFactors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {e.keyFactors.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded-full text-xs">{f}</span>
                      ))}
                    </div>
                  )}
                  {e.replication && <p className="text-xs text-green-300">🔄 Replicate: {e.replication}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Excellence leaves clues. Start mapping your peak performance states.</p>
          </div>
        )}
      </div>
    </div>
  )
}
