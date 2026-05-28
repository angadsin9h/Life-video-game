import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BoundaryArea = 'work' | 'family' | 'relationships' | 'social' | 'digital' | 'emotional' | 'physical' | 'financial' | 'time' | 'other'
type BoundaryStatus = 'needed' | 'set' | 'tested' | 'held' | 'broken'

interface BoundaryEntry {
  id: string
  area: BoundaryArea
  status: BoundaryStatus
  boundary: string
  why: string
  howCommunicated: string
  response: string
  held: boolean
  difficulty: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<BoundaryArea, { label: string; emoji: string; color: string }> = {
  work:          { label: 'Work',        emoji: '💼', color: '#3b82f6' },
  family:        { label: 'Family',      emoji: '👨‍👩‍👧', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  social:        { label: 'Social',      emoji: '👥', color: '#a855f7' },
  digital:       { label: 'Digital',     emoji: '📱', color: '#6366f1' },
  emotional:     { label: 'Emotional',   emoji: '🧠', color: '#f97316' },
  physical:      { label: 'Physical',    emoji: '🏋️', color: '#ef4444' },
  financial:     { label: 'Financial',   emoji: '💰', color: '#f59e0b' },
  time:          { label: 'Time',        emoji: '⏰', color: '#0ea5e9' },
  other:         { label: 'Other',       emoji: '🌀', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<BoundaryStatus, { label: string; color: string }> = {
  needed:  { label: 'Needed',  color: '#f59e0b' },
  set:     { label: 'Set',     color: '#3b82f6' },
  tested:  { label: 'Tested',  color: '#a855f7' },
  held:    { label: 'Held ✓',  color: '#22c55e' },
  broken:  { label: 'Broken',  color: '#ef4444' },
}

const STORAGE_KEY = 'boundaries_log'

export default function BoundariesLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BoundaryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<BoundaryEntry, 'id' | 'createdAt'>>({
    area: 'work', status: 'needed', boundary: '', why: '', howCommunicated: '',
    response: '', held: false, difficulty: 5, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BoundaryEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.boundary.trim()) return
    const e: BoundaryEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, boundary: '', why: '', howCommunicated: '', response: '' }))
    setShowForm(false)
    toastSuccess('Boundary logged 🛡️')
  }

  const filtered = entries.filter(e => filterArea === 'all' || e.area === filterArea)
  const held = entries.filter(e => e.held).length
  const active = entries.filter(e => e.status === 'set' || e.status === 'tested' || e.status === 'held').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Boundaries Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track the limits you set and how well you hold them.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{held}</div>
          <div className="text-xs text-slate-500">Held</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [BoundaryArea, typeof AREA_CONFIG.work][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Boundary</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as BoundaryArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [BoundaryArea, typeof AREA_CONFIG.work][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as BoundaryStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [BoundaryStatus, typeof STATUS_CONFIG.set][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.boundary} onChange={e => setForm(f => ({ ...f, boundary: e.target.value }))}
            placeholder="What is the boundary? *" className="game-input w-full h-12 resize-none" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why is this boundary important?" className="game-input w-full text-sm" />
          <input value={form.howCommunicated} onChange={e => setForm(f => ({ ...f, howCommunicated: e.target.value }))}
            placeholder="How did / will you communicate it?" className="game-input w-full text-sm" />
          <input value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
            placeholder="How did others respond?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Difficulty: {form.difficulty}/10</p>
              <input type="range" min={1} max={10} value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.held} onChange={e => setForm(f => ({ ...f, held: e.target.checked }))} />
              Held it
            </label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const a = AREA_CONFIG[e.area]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl mt-0.5">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.boundary}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  {e.held && <span className="text-xs text-green-400">✓ held</span>}
                </div>
                {e.why && <p className="text-xs text-slate-500 mt-0.5">{e.why}</p>}
                <p className="text-xs text-slate-600">{a.label} · difficulty {e.difficulty}/10 · {e.date}</p>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Boundaries are the walls of your integrity. Build them consciously.</p>
          </div>
        )}
      </div>
    </div>
  )
}
