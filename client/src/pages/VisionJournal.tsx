import { useState, useEffect } from 'react'
import { Eye, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type VisionArea = 'career' | 'health' | 'relationships' | 'finances' | 'personal' | 'spiritual' | 'creative' | 'adventure'
type VisionHorizon = '1year' | '3years' | '5years' | '10years' | 'lifetime'

interface VisionEntry {
  id: string
  area: VisionArea
  horizon: VisionHorizon
  title: string
  description: string
  why: string
  milestones: string
  emotion: string
  clarity: number
  createdAt: string
}

const AREA_CONFIG: Record<VisionArea, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#f59e0b' },
  personal:      { label: 'Personal',      emoji: '🌱', color: '#a855f7' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#6366f1' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  adventure:     { label: 'Adventure',     emoji: '🌍', color: '#0ea5e9' },
}

const HORIZON_CONFIG: Record<VisionHorizon, { label: string; color: string }> = {
  '1year':    { label: '1 Year',    color: '#22c55e' },
  '3years':   { label: '3 Years',   color: '#3b82f6' },
  '5years':   { label: '5 Years',   color: '#a855f7' },
  '10years':  { label: '10 Years',  color: '#f59e0b' },
  'lifetime': { label: 'Lifetime',  color: '#f97316' },
}

const STORAGE_KEY = 'vision_journal'

export default function VisionJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VisionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [filterHorizon, setFilterHorizon] = useState<string>('all')
  const [form, setForm] = useState<Omit<VisionEntry, 'id' | 'createdAt'>>({
    area: 'career', horizon: '1year', title: '', description: '',
    why: '', milestones: '', emotion: '', clarity: 3,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: VisionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: VisionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ area: 'career', horizon: '1year', title: '', description: '', why: '', milestones: '', emotion: '', clarity: 3 })
    setShowForm(false)
    toastSuccess('Vision added 🔮')
  }

  const filtered = entries.filter(e =>
    (filterArea === 'all' || e.area === filterArea) &&
    (filterHorizon === 'all' || e.horizon === filterHorizon)
  )
  const usedAreas = [...new Set(entries.map(e => e.area))]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Eye className="w-7 h-7 text-violet-400" />
            Vision Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define your future across all life areas.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Visions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{usedAreas.length}</div>
          <div className="text-xs text-slate-500">Areas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">
            {entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.clarity, 0) / entries.length * 10) / 10 : 0}
          </div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [VisionArea, typeof AREA_CONFIG.career][]).map(([k, a]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterHorizon('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterHorizon === 'all' ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All time
        </button>
        {(Object.entries(HORIZON_CONFIG) as [VisionHorizon, typeof HORIZON_CONFIG['1year']][]).map(([k, h]) => (
          <button key={k} onClick={() => setFilterHorizon(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterHorizon === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterHorizon === k ? { background: h.color + '30', color: h.color } : {}}>
            {h.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Vision</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as VisionArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [VisionArea, typeof AREA_CONFIG.career][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.horizon} onChange={e => setForm(f => ({ ...f, horizon: e.target.value as VisionHorizon }))} className="game-input text-sm flex-1">
              {(Object.entries(HORIZON_CONFIG) as [VisionHorizon, typeof HORIZON_CONFIG['1year']][]).map(([k, h]) => (
                <option key={k} value={k}>{h.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Vision title *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your vision vividly..." className="game-input w-full h-16 resize-none text-sm" />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why this matters to you..." className="game-input w-full text-sm" />
          <input value={form.milestones} onChange={e => setForm(f => ({ ...f, milestones: e.target.value }))}
            placeholder="Key milestones to get there..." className="game-input w-full text-sm" />
          <input value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="How will you feel when you achieve it?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Clarity: {form.clarity}/5</p>
            <input type="range" min={1} max={5} value={form.clarity}
              onChange={e => setForm(f => ({ ...f, clarity: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const a = AREA_CONFIG[e.area]
          const h = HORIZON_CONFIG[e.horizon]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: h.color + '20', color: h.color }}>{h.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{a.label} · Clarity {'●'.repeat(e.clarity)}{'○'.repeat(5 - e.clarity)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  {e.why && <p className="text-xs text-blue-300">💡 Why: {e.why}</p>}
                  {e.milestones && <p className="text-xs text-green-300">🏁 {e.milestones}</p>}
                  {e.emotion && <p className="text-xs text-yellow-300">✨ {e.emotion}</p>}
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
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Paint a vivid picture of your ideal future.</p>
          </div>
        )}
      </div>
    </div>
  )
}
