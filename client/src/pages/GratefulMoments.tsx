import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MomentCategory = 'person' | 'experience' | 'nature' | 'blessing' | 'lesson' | 'simple' | 'surprise' | 'health' | 'growth' | 'other'

interface GratefulMoment {
  id: string
  category: MomentCategory
  title: string
  detail: string
  why: string
  who: string
  feeling: string
  depth: number
  date: string
  isFavorite: boolean
  createdAt: string
}

const CAT_CONFIG: Record<MomentCategory, { label: string; emoji: string; color: string }> = {
  person:     { label: 'Person',      emoji: '👤', color: '#ec4899' },
  experience: { label: 'Experience',  emoji: '🌟', color: '#f59e0b' },
  nature:     { label: 'Nature',      emoji: '🌿', color: '#22c55e' },
  blessing:   { label: 'Blessing',    emoji: '🙏', color: '#6366f1' },
  lesson:     { label: 'Lesson',      emoji: '📖', color: '#3b82f6' },
  simple:     { label: 'Simple Joy',  emoji: '☕', color: '#f97316' },
  surprise:   { label: 'Surprise',    emoji: '🎉', color: '#a855f7' },
  health:     { label: 'Health',      emoji: '💪', color: '#10b981' },
  growth:     { label: 'Growth',      emoji: '🌱', color: '#84cc16' },
  other:      { label: 'Other',       emoji: '✨', color: '#94a3b8' },
}

const STORAGE_KEY = 'grateful_moments'

export default function GratefulMoments() {
  const { toastSuccess } = useToast()
  const [moments, setMoments] = useState<GratefulMoment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<GratefulMoment, 'id' | 'createdAt'>>({
    category: 'simple', title: '', detail: '', why: '', who: '', feeling: '',
    depth: 5, date: new Date().toISOString().split('T')[0], isFavorite: false,
  })

  useEffect(() => {
    try { setMoments(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratefulMoment[]) => { setMoments(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const m: GratefulMoment = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...moments])
    setForm(f => ({ ...f, title: '', detail: '', why: '', who: '', feeling: '' }))
    setShowForm(false)
    toastSuccess('Grateful moment saved 🙏')
  }

  const filtered = moments.filter(m => filterCat === 'all' || m.category === filterCat)
  const favorites = moments.filter(m => m.isFavorite).length
  const avgDepth = moments.length > 0
    ? Math.round(moments.reduce((s, m) => s + m.depth, 0) / moments.length * 10) / 10
    : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Grateful Moments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Go deep on gratitude — capture the WHY behind it.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{moments.length}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [MomentCategory, typeof CAT_CONFIG.simple][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Grateful Moment</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MomentCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [MomentCategory, typeof CAT_CONFIG.simple][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What are you grateful for? *" className="game-input w-full" autoFocus />
          <textarea value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
            placeholder="Describe it in detail..." className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="WHY are you grateful for this?" className="game-input w-full text-sm" />
          <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}
            placeholder="Who is involved? (optional)" className="game-input w-full text-sm" />
          <input value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
            placeholder="How does it make you feel?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Depth of gratitude: {form.depth}/10</p>
              <input type="range" min={1} max={10} value={form.depth}
                onChange={e => setForm(f => ({ ...f, depth: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} />
            Mark as favorite
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(m => {
          const c = CAT_CONFIG[m.category]
          const isExp = expanded === m.id
          return (
            <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{m.title}</span>
                    {m.isFavorite && <span className="text-yellow-400 text-xs">⭐</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · {m.date} · depth {m.depth}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {m.detail && <p className="text-xs text-slate-300">{m.detail}</p>}
                  {m.why && <p className="text-xs text-yellow-300">❓ Why: {m.why}</p>}
                  {m.who && <p className="text-xs text-blue-300">👤 {m.who}</p>}
                  {m.feeling && <p className="text-xs text-pink-300">💗 {m.feeling}</p>}
                  <button onClick={() => save(moments.filter(x => x.id !== m.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Gratitude deepens when you explore the why behind it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
