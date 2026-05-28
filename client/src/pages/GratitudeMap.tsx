import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type GratitudeZone = 'people' | 'experiences' | 'body' | 'mind' | 'work' | 'nature' | 'possessions' | 'opportunities' | 'challenges' | 'simple'
type GratitudeDepth = 'surface' | 'medium' | 'deep' | 'profound'

interface GratitudeMapEntry {
  id: string
  zone: GratitudeZone
  depth: GratitudeDepth
  item: string
  why: string
  impact: string
  whoToThank: string
  gratefulFor: string
  intensity: number
  date: string
  createdAt: string
}

const ZONE_CONFIG: Record<GratitudeZone, { label: string; emoji: string; color: string }> = {
  people:       { label: 'People',       emoji: '👥', color: '#ec4899' },
  experiences:  { label: 'Experiences',  emoji: '🌟', color: '#f59e0b' },
  body:         { label: 'My Body',      emoji: '💪', color: '#ef4444' },
  mind:         { label: 'My Mind',      emoji: '🧠', color: '#a855f7' },
  work:         { label: 'Work',         emoji: '💼', color: '#3b82f6' },
  nature:       { label: 'Nature',       emoji: '🌿', color: '#22c55e' },
  possessions:  { label: 'Possessions',  emoji: '🏠', color: '#f97316' },
  opportunities:{ label: 'Opportunities',emoji: '🚀', color: '#6366f1' },
  challenges:   { label: 'Challenges',   emoji: '⚡', color: '#84cc16' },
  simple:       { label: 'Simple Things',emoji: '☀️', color: '#0ea5e9' },
}

const DEPTH_CONFIG: Record<GratitudeDepth, { label: string; color: string }> = {
  surface:  { label: 'Surface',  color: '#94a3b8' },
  medium:   { label: 'Medium',   color: '#3b82f6' },
  deep:     { label: 'Deep',     color: '#a855f7' },
  profound: { label: 'Profound', color: '#f59e0b' },
}

const STORAGE_KEY = 'gratitude_map'

export default function GratitudeMap() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeMapEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterZone, setFilterZone] = useState<GratitudeZone | 'all'>('all')
  const [form, setForm] = useState<Omit<GratitudeMapEntry, 'id' | 'createdAt'>>({
    zone: 'people', depth: 'medium', item: '', why: '', impact: '',
    whoToThank: '', gratefulFor: '', intensity: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratitudeMapEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.item.trim()) return
    const e: GratitudeMapEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, item: '', why: '', impact: '', whoToThank: '', gratefulFor: '' }))
    setShowForm(false)
    toastSuccess('Gratitude mapped — abundance expands with attention 💛')
  }

  const visible = filterZone === 'all' ? entries : entries.filter(e => e.zone === filterZone)
  const profound = entries.filter(e => e.depth === 'profound').length
  const avgIntensity = entries.length ? Math.round(entries.reduce((s, e) => s + e.intensity, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Gratitude Map
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map gratitude across every dimension of life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{profound}</div>
          <div className="text-xs text-slate-500">Profound</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['all', ...Object.keys(ZONE_CONFIG)] as (GratitudeZone | 'all')[]).map(z => (
          <button key={z} onClick={() => setFilterZone(z)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterZone === z ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {z === 'all' ? 'All' : ZONE_CONFIG[z as GratitudeZone].emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Map Gratitude</h3>
          <div className="flex gap-2">
            <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value as GratitudeZone }))} className="game-input text-sm flex-1">
              {(Object.entries(ZONE_CONFIG) as [GratitudeZone, typeof ZONE_CONFIG.people][]).map(([k, z]) => (
                <option key={k} value={k}>{z.emoji} {z.label}</option>
              ))}
            </select>
            <select value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value as GratitudeDepth }))} className="game-input text-sm flex-1">
              {(Object.entries(DEPTH_CONFIG) as [GratitudeDepth, typeof DEPTH_CONFIG.medium][]).map(([k, d]) => (
                <option key={k} value={k}>{d.label}</option>
              ))}
            </select>
          </div>
          <input value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
            placeholder="What are you grateful for? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this matter to you?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How has this shaped your life?" className="game-input w-full text-sm" />
          <input value={form.whoToThank} onChange={e => setForm(f => ({ ...f, whoToThank: e.target.value }))}
            placeholder="Who deserves thanks for this?" className="game-input w-full text-sm" />
          <input value={form.gratefulFor} onChange={e => setForm(f => ({ ...f, gratefulFor: e.target.value }))}
            placeholder="Specific detail you're most grateful for" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensity}/10</p>
            <input type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Map It</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visible.map(e => {
          const z = ZONE_CONFIG[e.zone]
          const d = DEPTH_CONFIG[e.depth]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${z.color}` }}>
              <span className="text-2xl">{z.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  <span className="text-xs text-slate-500">{z.label}</span>
                  <span className="text-xs text-pink-400">💛 {e.intensity}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{e.item}</p>
                {e.why && <p className="text-xs text-slate-400 mt-0.5">Why: {e.why}</p>}
                {e.whoToThank && <p className="text-xs text-pink-300/80 mt-0.5">Thanks: {e.whoToThank}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {visible.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Gratitude maps the abundance already in your life.</p>
          </div>
        )}
      </div>
    </div>
  )
}
