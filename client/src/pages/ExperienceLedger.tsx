import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExperienceType = 'adventure' | 'cultural' | 'learning' | 'spiritual' | 'social' | 'creative' | 'professional' | 'travel' | 'physical' | 'other'
type ExpStatus = 'want' | 'planned' | 'done' | 'recurring'

interface Experience {
  id: string
  type: ExperienceType
  status: ExpStatus
  name: string
  description: string
  location: string
  who: string
  impact: string
  rating: number
  cost: number
  date: string
  isBucketList: boolean
  wouldRepeat: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<ExperienceType, { label: string; emoji: string; color: string }> = {
  adventure:    { label: 'Adventure',    emoji: '🏔️', color: '#ef4444' },
  cultural:     { label: 'Cultural',     emoji: '🌍', color: '#f97316' },
  learning:     { label: 'Learning',     emoji: '📚', color: '#3b82f6' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#a855f7' },
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#ec4899' },
  professional: { label: 'Professional', emoji: '💼', color: '#6366f1' },
  travel:       { label: 'Travel',       emoji: '✈️', color: '#0ea5e9' },
  physical:     { label: 'Physical',     emoji: '💪', color: '#f59e0b' },
  other:        { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ExpStatus, { label: string; color: string }> = {
  want:      { label: 'Want',       color: '#f59e0b' },
  planned:   { label: 'Planned',    color: '#3b82f6' },
  done:      { label: 'Done ✓',    color: '#22c55e' },
  recurring: { label: 'Recurring',  color: '#a855f7' },
}

const STORAGE_KEY = 'experience_ledger'

export default function ExperienceLedger() {
  const { toastSuccess } = useToast()
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<Experience, 'id' | 'createdAt'>>({
    type: 'adventure', status: 'want', name: '', description: '', location: '',
    who: '', impact: '', rating: 9, cost: 0, date: '', isBucketList: false, wouldRepeat: true,
  })

  useEffect(() => {
    try { setExperiences(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Experience[]) => { setExperiences(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const e: Experience = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...experiences])
    setForm(f => ({ ...f, name: '', description: '', location: '', who: '', impact: '' }))
    setShowForm(false)
    toastSuccess('Experience logged ✈️')
  }

  const filtered = experiences.filter(e => filterType === 'all' || e.type === filterType)
  const done = experiences.filter(e => e.status === 'done' || e.status === 'recurring').length
  const bucketList = experiences.filter(e => e.isBucketList).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-blue-400" />
            Experience Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect experiences, not just things. Log your life in full color.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{experiences.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{done}</div>
          <div className="text-xs text-slate-500">Experienced</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{bucketList}</div>
          <div className="text-xs text-slate-500">Bucket List</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [ExperienceType, typeof TYPE_CONFIG.adventure][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Experience</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ExperienceType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ExperienceType, typeof TYPE_CONFIG.adventure][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ExpStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ExpStatus, typeof STATUS_CONFIG.done][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Experience name *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe it..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Location" className="game-input w-full text-sm" />
          <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}
            placeholder="Who was with you?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How did it impact you?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Rating: {form.rating}/10</p>
              <input type="range" min={1} max={10} value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Cost ($)</p>
              <input type="number" value={form.cost} min={0}
                onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                className="game-input w-20 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isBucketList} onChange={e => setForm(f => ({ ...f, isBucketList: e.target.checked }))} />
              Bucket List
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.wouldRepeat} onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))} />
              Repeat
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{e.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  {e.isBucketList && <span className="text-xs text-yellow-400">🎯</span>}
                  {e.wouldRepeat && <span className="text-xs text-green-400">🔄</span>}
                </div>
                <p className="text-xs text-slate-500">{t.label}{e.location ? ` · ${e.location}` : ''}{e.date ? ` · ${e.date}` : ''}</p>
                {e.impact && <p className="text-xs text-blue-300 mt-0.5">{e.impact}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-yellow-400">★{e.rating}</span>
                <button onClick={() => save(experiences.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Life is measured in experiences, not years. Start your ledger.</p>
          </div>
        )}
      </div>
    </div>
  )
}
