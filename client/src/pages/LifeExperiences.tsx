import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExpCategory = 'adventure' | 'culture' | 'food' | 'nature' | 'social' | 'spiritual' | 'creative' | 'learning' | 'sport' | 'other'

interface LifeExp {
  id: string
  date: string
  title: string
  category: ExpCategory
  location: string
  companions: string
  story: string
  impact: number
  wouldRepeat: boolean
  photos: string
  tags: string
  createdAt: string
}

const CAT_CONFIG: Record<ExpCategory, { label: string; emoji: string; color: string }> = {
  adventure:  { label: 'Adventure',  emoji: '🏔️', color: '#f97316' },
  culture:    { label: 'Culture',    emoji: '🎭', color: '#6366f1' },
  food:       { label: 'Food',       emoji: '🍜', color: '#f59e0b' },
  nature:     { label: 'Nature',     emoji: '🌿', color: '#22c55e' },
  social:     { label: 'Social',     emoji: '🎉', color: '#ec4899' },
  spiritual:  { label: 'Spiritual',  emoji: '✨', color: '#a855f7' },
  creative:   { label: 'Creative',   emoji: '🎨', color: '#3b82f6' },
  learning:   { label: 'Learning',   emoji: '📚', color: '#84cc16' },
  sport:      { label: 'Sport',      emoji: '⚽', color: '#ef4444' },
  other:      { label: 'Other',      emoji: '🌟', color: '#94a3b8' },
}

const STORAGE_KEY = 'life_experiences'

export default function LifeExperiences() {
  const { toastSuccess } = useToast()
  const [experiences, setExperiences] = useState<LifeExp[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<LifeExp, 'id' | 'createdAt'>>({
    date: '', title: '', category: 'adventure', location: '',
    companions: '', story: '', impact: 8, wouldRepeat: true, photos: '', tags: '',
  })

  useEffect(() => {
    try { setExperiences(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeExp[]) => { setExperiences(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: LifeExp = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...experiences])
    setForm({ date: '', title: '', category: 'adventure', location: '', companions: '', story: '', impact: 8, wouldRepeat: true, photos: '', tags: '' })
    setShowForm(false)
    toastSuccess('Experience saved 🌍')
  }

  const filtered = experiences.filter(e => filterCat === 'all' || e.category === filterCat)
  const topExp = experiences.filter(e => e.impact >= 9).length
  const avgImpact = experiences.length ? Math.round(experiences.reduce((s, e) => s + e.impact, 0) / experiences.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-emerald-400" />
            Life Experiences
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture every experience that has shaped you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{experiences.length}</div>
          <div className="text-xs text-slate-500">Experiences</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgImpact}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{topExp}</div>
          <div className="text-xs text-slate-500">Life-Changing</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {Object.entries(CAT_CONFIG).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Experience</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Experience title *" className="game-input flex-1" autoFocus />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpCategory }))} className="game-input text-sm w-full">
            {(Object.entries(CAT_CONFIG) as [ExpCategory, typeof CAT_CONFIG.adventure][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Where?" className="game-input flex-1 text-sm" />
            <input value={form.companions} onChange={e => setForm(f => ({ ...f, companions: e.target.value }))}
              placeholder="With who?" className="game-input flex-1 text-sm" />
          </div>
          <textarea value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
            placeholder="Tell the story..." className="game-input w-full h-20 resize-none text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Life Impact: {form.impact}/10</span>
            <input type="range" min={1} max={10} value={form.impact}
              onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
              className="flex-1 h-1 accent-emerald-400" />
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.wouldRepeat} onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))} className="accent-emerald-400" />
              Would repeat
            </label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="Tags..." className="game-input flex-1 text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const c = CAT_CONFIG[e.category]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs text-yellow-400">{e.impact}/10</span>
                    {e.wouldRepeat && <span className="text-xs text-green-400">↩</span>}
                  </div>
                  <p className="text-xs text-slate-500">{e.date || 'Date unknown'}{e.location && ` · ${e.location}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.story && <p className="text-sm text-slate-300 leading-relaxed">{e.story}</p>}
                  {e.companions && <p className="text-xs text-slate-400">👥 {e.companions}</p>}
                  {e.tags && <p className="text-xs text-slate-600">🏷️ {e.tags}</p>}
                  <button onClick={() => save(experiences.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Document every experience that makes your life rich.</p>
          </div>
        )}
      </div>
    </div>
  )
}
