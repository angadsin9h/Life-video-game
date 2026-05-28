import { useState, useEffect } from 'react'
import { Sparkles, Plus, X, Star, Heart, List } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PeakCategory = 'Achievement' | 'Connection' | 'Flow' | 'Beauty' | 'Courage' | 'Love' | 'Insight' | 'Adventure' | 'Service' | 'Gratitude' | 'Joy' | 'Transformation'

interface PeakEntry {
  id: string
  momentTitle: string
  category: PeakCategory
  when: string
  whereWereYou: string
  whoWasPresent: string
  whatHappened: string
  howItFelt: string
  whyItMattered: string
  whatItRevealed: string
  intensityRating: number
  wantToReliveIt: boolean
  momentScore: number
  createdAt: string
}

const STORAGE_KEY = 'peak_moment_log'

const CATEGORIES: PeakCategory[] = [
  'Achievement', 'Connection', 'Flow', 'Beauty', 'Courage', 'Love',
  'Insight', 'Adventure', 'Service', 'Gratitude', 'Joy', 'Transformation',
]

const CATEGORY_COLORS: Record<PeakCategory, string> = {
  Achievement: '#f59e0b',
  Connection: '#ec4899',
  Flow: '#6366f1',
  Beauty: '#14b8a6',
  Courage: '#ef4444',
  Love: '#f43f5e',
  Insight: '#a855f7',
  Adventure: '#f97316',
  Service: '#22c55e',
  Gratitude: '#10b981',
  Joy: '#eab308',
  Transformation: '#3b82f6',
}

const CATEGORY_ICONS: Record<PeakCategory, string> = {
  Achievement: '🏆',
  Connection: '🤝',
  Flow: '🌊',
  Beauty: '✨',
  Courage: '🦁',
  Love: '❤️',
  Insight: '💡',
  Adventure: '🧭',
  Service: '🌟',
  Gratitude: '🙏',
  Joy: '☀️',
  Transformation: '🦋',
}

export default function PeakMomentLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PeakEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCategory, setFilterCategory] = useState<PeakCategory | 'All'>('All')
  const [form, setForm] = useState<Omit<PeakEntry, 'id' | 'momentScore' | 'createdAt'>>({
    momentTitle: '',
    category: 'Joy',
    when: new Date().toISOString().split('T')[0],
    whereWereYou: '',
    whoWasPresent: '',
    whatHappened: '',
    howItFelt: '',
    whyItMattered: '',
    whatItRevealed: '',
    intensityRating: 8,
    wantToReliveIt: true,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PeakEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    if (!form.momentTitle.trim()) return
    const entry: PeakEntry = {
      id: Date.now().toString(),
      ...form,
      momentScore: form.intensityRating * 10,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(f => ({
      ...f,
      momentTitle: '', whereWereYou: '', whoWasPresent: '', whatHappened: '',
      howItFelt: '', whyItMattered: '', whatItRevealed: '',
    }))
    setShowForm(false)
    toastSuccess('Peak moment captured — relive it anytime!')
  }

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const displayed = (filterCategory === 'All' ? entries : entries.filter(e => e.category === filterCategory)).slice(0, 10)
  const avgIntensity = entries.length ? (entries.reduce((s, e) => s + e.intensityRating, 0) / entries.length).toFixed(1) : '0'

  const categoryCounts: Partial<Record<PeakCategory, number>> = {}
  entries.forEach(e => { categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1 })
  const mostCommon = (Object.entries(categoryCounts) as [PeakCategory, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-violet-400" />
            Peak Moment Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture and relive the experiences that define your best self.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Capture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgIntensity}/10</div>
          <div className="text-xs text-slate-500">Avg Intensity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xs font-bold text-violet-400 mt-1 leading-tight">{mostCommon ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">Top Category</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Capture a Peak Moment</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <input value={form.momentTitle} onChange={e => set('momentTitle', e.target.value)}
            placeholder="Name this moment *" className="game-input w-full text-sm" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => set('category', e.target.value as PeakCategory)} className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
            <input type="date" value={form.when} onChange={e => set('when', e.target.value)} className="game-input text-sm" />
          </div>
          <input value={form.whereWereYou} onChange={e => set('whereWereYou', e.target.value)}
            placeholder="Where were you?" className="game-input w-full text-sm" />
          <input value={form.whoWasPresent} onChange={e => set('whoWasPresent', e.target.value)}
            placeholder="Who was present?" className="game-input w-full text-sm" />
          <textarea value={form.whatHappened} onChange={e => set('whatHappened', e.target.value)}
            placeholder="What happened?" rows={2} className="game-input w-full text-sm resize-none" />
          <textarea value={form.howItFelt} onChange={e => set('howItFelt', e.target.value)}
            placeholder="How did it feel? (physical + emotional sensations)" rows={2} className="game-input w-full text-sm resize-none" />
          <input value={form.whyItMattered} onChange={e => set('whyItMattered', e.target.value)}
            placeholder="Why did it matter?" className="game-input w-full text-sm" />
          <input value={form.whatItRevealed} onChange={e => set('whatItRevealed', e.target.value)}
            placeholder="What did it reveal about you, life, possibilities?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Intensity: {form.intensityRating}/10</p>
            <input type="range" min={1} max={10} value={form.intensityRating}
              onChange={e => set('intensityRating', Number(e.target.value))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.wantToReliveIt} onChange={e => set('wantToReliveIt', e.target.checked)}
              className="accent-violet-500" />
            I want to relive this moment
          </label>
          <p className="text-xs text-slate-500">
            Moment Score: <span className="text-violet-400 font-semibold">{form.intensityRating * 10}</span>
          </p>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
              Save Moment
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Category filter */}
      {entries.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <List className="w-3.5 h-3.5 text-slate-500" />
          <button onClick={() => setFilterCategory('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === 'All' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            All
          </button>
          {CATEGORIES.filter(c => categoryCounts[c]).map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filterCategory === c ? CATEGORY_COLORS[c] + '40' : '#1e293b',
                color: filterCategory === c ? CATEGORY_COLORS[c] : '#94a3b8',
              }}>
              {CATEGORY_ICONS[c]} {c}
            </button>
          ))}
        </div>
      )}

      {/* Peak Moment Gallery */}
      {displayed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Peak Moment Gallery</h3>
          {displayed.map(entry => {
            const color = CATEGORY_COLORS[entry.category]
            return (
              <div key={entry.id} className="game-card p-4 space-y-2"
                style={{ borderTop: `2px solid ${color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{CATEGORY_ICONS[entry.category]}</span>
                    <span className="text-sm font-semibold text-white">{entry.momentTitle}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: color + '25', color }}>
                      {entry.category}
                    </span>
                  </div>
                  {entry.wantToReliveIt && (
                    <Heart className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 fill-pink-400" />
                  )}
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>{entry.when}</span>
                  {entry.whereWereYou && <span>· {entry.whereWereYou}</span>}
                  {entry.whoWasPresent && <span>· {entry.whoWasPresent}</span>}
                </div>
                {entry.whatHappened && (
                  <p className="text-xs text-slate-300 line-clamp-2">{entry.whatHappened}</p>
                )}
                {entry.whyItMattered && (
                  <p className="text-xs text-slate-500 italic">"{entry.whyItMattered}"</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < entry.intensityRating ? 'fill-current' : ''}`}
                        style={{ color: i < entry.intensityRating ? color : '#334155' }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold" style={{ color }}>Score: {entry.momentScore}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Your peak moments define you. Start capturing them.</p>
        </div>
      )}
    </div>
  )
}
