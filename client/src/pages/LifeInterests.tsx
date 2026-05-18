import { useState, useEffect } from 'react'
import { Layers, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type InterestCategory = 'art' | 'science' | 'sports' | 'music' | 'technology' | 'nature' | 'philosophy' | 'culture' | 'food' | 'gaming' | 'fitness' | 'other'
type InterestLevel = 'curious' | 'exploring' | 'passionate' | 'expert' | 'lifelong'

interface Interest {
  id: string
  category: InterestCategory
  level: InterestLevel
  name: string
  why: string
  howEngage: string
  resources: string
  timePerWeek: number
  lastEngaged: string
  relatedTo: string[]
  createdAt: string
}

const CAT_CONFIG: Record<InterestCategory, { label: string; emoji: string; color: string }> = {
  art:         { label: 'Art',         emoji: '🎨', color: '#ec4899' },
  science:     { label: 'Science',     emoji: '🔬', color: '#3b82f6' },
  sports:      { label: 'Sports',      emoji: '⚽', color: '#22c55e' },
  music:       { label: 'Music',       emoji: '🎵', color: '#a855f7' },
  technology:  { label: 'Technology',  emoji: '💻', color: '#6366f1' },
  nature:      { label: 'Nature',      emoji: '🌿', color: '#84cc16' },
  philosophy:  { label: 'Philosophy',  emoji: '🏛️', color: '#f59e0b' },
  culture:     { label: 'Culture',     emoji: '🌍', color: '#f97316' },
  food:        { label: 'Food',        emoji: '🍳', color: '#ef4444' },
  gaming:      { label: 'Gaming',      emoji: '🎮', color: '#0ea5e9' },
  fitness:     { label: 'Fitness',     emoji: '💪', color: '#f59e0b' },
  other:       { label: 'Other',       emoji: '✨', color: '#94a3b8' },
}

const LEVEL_CONFIG: Record<InterestLevel, { label: string; color: string }> = {
  curious:   { label: 'Curious',    color: '#94a3b8' },
  exploring: { label: 'Exploring',  color: '#3b82f6' },
  passionate:{ label: 'Passionate', color: '#f97316' },
  expert:    { label: 'Expert',     color: '#f59e0b' },
  lifelong:  { label: 'Lifelong ★', color: '#a855f7' },
}

const STORAGE_KEY = 'life_interests'

export default function LifeInterests() {
  const { toastSuccess } = useToast()
  const [interests, setInterests] = useState<Interest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [newRelated, setNewRelated] = useState('')
  const [form, setForm] = useState<Omit<Interest, 'id' | 'createdAt'>>({
    category: 'art', level: 'exploring', name: '', why: '', howEngage: '',
    resources: '', timePerWeek: 2, lastEngaged: '', relatedTo: [],
  })

  useEffect(() => {
    try { setInterests(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Interest[]) => { setInterests(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const i: Interest = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([i, ...interests])
    setForm(f => ({ ...f, name: '', why: '', howEngage: '', resources: '', relatedTo: [] }))
    setNewRelated('')
    setShowForm(false)
    toastSuccess('Interest mapped 🗺️')
  }

  const filtered = interests.filter(i => filterCat === 'all' || i.category === filterCat)
  const passionate = interests.filter(i => i.level === 'passionate' || i.level === 'lifelong').length
  const totalHours = interests.reduce((s, i) => s + i.timePerWeek, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Layers className="w-7 h-7 text-indigo-400" />
            Life Interests
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map all your interests — from curious to lifelong passionate.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{interests.length}</div>
          <div className="text-xs text-slate-500">Interests</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{passionate}</div>
          <div className="text-xs text-slate-500">Passionate</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Hours/Week</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [InterestCategory, typeof CAT_CONFIG.art][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Interest</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as InterestCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [InterestCategory, typeof CAT_CONFIG.art][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as InterestLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(LEVEL_CONFIG) as [InterestLevel, typeof LEVEL_CONFIG.curious][]).map(([k, l]) => (
                <option key={k} value={k}>{l.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Interest name *" className="game-input w-full" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this interest you?" className="game-input w-full text-sm" />
          <input value={form.howEngage} onChange={e => setForm(f => ({ ...f, howEngage: e.target.value }))}
            placeholder="How do you currently engage with it?" className="game-input w-full text-sm" />
          <input value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
            placeholder="Resources, books, communities (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Hours/week: {form.timePerWeek}h</p>
              <input type="range" min={0} max={40} step={0.5} value={form.timePerWeek}
                onChange={e => setForm(f => ({ ...f, timePerWeek: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
            <input type="date" value={form.lastEngaged} onChange={e => setForm(f => ({ ...f, lastEngaged: e.target.value }))}
              className="game-input text-xs" />
          </div>
          <div className="flex gap-2">
            <input value={newRelated} onChange={e => setNewRelated(e.target.value)}
              placeholder="Related interest..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newRelated.trim()) { setForm(f => ({ ...f, relatedTo: [...f.relatedTo, newRelated.trim()] })); setNewRelated('') } }} />
            <button onClick={() => { if (newRelated.trim()) { setForm(f => ({ ...f, relatedTo: [...f.relatedTo, newRelated.trim()] })); setNewRelated('') } }}
              className="px-3 py-1.5 bg-indigo-700/30 text-indigo-400 rounded-xl text-xs">+</button>
          </div>
          {form.relatedTo.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.relatedTo.map((r, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-900/30 text-indigo-300 rounded-full text-xs">
                  {r}
                  <button onClick={() => setForm(fo => ({ ...fo, relatedTo: fo.relatedTo.filter((_, j) => j !== i) }))} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(i => {
          const c = CAT_CONFIG[i.category]
          const l = LEVEL_CONFIG[i.level]
          return (
            <div key={i.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${l.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{i.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '20', color: l.color }}>{l.label}</span>
                </div>
                <p className="text-xs text-slate-500">{c.label} · {i.timePerWeek}h/week</p>
                {i.why && <p className="text-xs text-slate-400 mt-0.5">{i.why}</p>}
                {i.relatedTo.length > 0 && <p className="text-xs text-slate-600">Related: {i.relatedTo.join(', ')}</p>}
              </div>
              <button onClick={() => save(interests.filter(x => x.id !== i.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A rich life is one of many interests. Map what lights you up.</p>
          </div>
        )}
      </div>
    </div>
  )
}
