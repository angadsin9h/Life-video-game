import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type JoyCategory = 'nature' | 'connection' | 'creativity' | 'achievement' | 'play' | 'food' | 'body' | 'learning' | 'beauty' | 'surprise' | 'peace' | 'other'
type JoyIntensity = 1 | 2 | 3 | 4 | 5

interface JoyEntry {
  id: string
  category: JoyCategory
  title: string
  description: string
  intensity: JoyIntensity
  who: string
  where: string
  date: string
  isMemorable: boolean
  createdAt: string
}

const CAT_CONFIG: Record<JoyCategory, { label: string; emoji: string; color: string }> = {
  nature:      { label: 'Nature',      emoji: '🌿', color: '#22c55e' },
  connection:  { label: 'Connection',  emoji: '❤️', color: '#ec4899' },
  creativity:  { label: 'Creativity',  emoji: '🎨', color: '#a855f7' },
  achievement: { label: 'Achievement', emoji: '🏆', color: '#f59e0b' },
  play:        { label: 'Play',        emoji: '🎮', color: '#3b82f6' },
  food:        { label: 'Food',        emoji: '🍕', color: '#f97316' },
  body:        { label: 'Body',        emoji: '💪', color: '#10b981' },
  learning:    { label: 'Learning',    emoji: '📚', color: '#6366f1' },
  beauty:      { label: 'Beauty',      emoji: '✨', color: '#eab308' },
  surprise:    { label: 'Surprise',    emoji: '🎉', color: '#0ea5e9' },
  peace:       { label: 'Peace',       emoji: '🕊️', color: '#84cc16' },
  other:       { label: 'Other',       emoji: '😊', color: '#94a3b8' },
}

const STORAGE_KEY = 'joy_log'

export default function JoyLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<JoyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<JoyEntry, 'id' | 'createdAt'>>({
    category: 'connection', title: '', description: '', intensity: 3,
    who: '', where: '', date: new Date().toISOString().split('T')[0], isMemorable: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: JoyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: JoyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', who: '', where: '' }))
    setShowForm(false)
    toastSuccess('Joy moment captured 😊')
  }

  const filtered = entries.filter(e => filterCat === 'all' || e.category === filterCat)
  const memorable = entries.filter(e => e.isMemorable).length
  const avgIntensity = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.intensity, 0) / entries.length * 10) / 10
    : 0
  const topCat = entries.length > 0
    ? Object.entries(entries.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0][0]
    : null

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Joy Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture and treasure your moments of joy.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Capture
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Joy Moments</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgIntensity}/5</div>
          <div className="text-xs text-slate-500">Avg Joy</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{memorable}</div>
          <div className="text-xs text-slate-500">Memorable</div>
        </div>
      </div>

      {topCat && (
        <div className="game-card p-3 flex items-center gap-3">
          <span className="text-2xl">{CAT_CONFIG[topCat as JoyCategory].emoji}</span>
          <div>
            <p className="text-xs text-slate-500">Top Joy Source</p>
            <p className="text-sm font-medium text-white">{CAT_CONFIG[topCat as JoyCategory].label}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [JoyCategory, typeof CAT_CONFIG.nature][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Joy Moment</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as JoyCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [JoyCategory, typeof CAT_CONFIG.nature][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What brought you joy? *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the moment in detail..." className="game-input w-full h-16 resize-none text-sm" />
          <div className="flex gap-2">
            <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}
              placeholder="Who was there?" className="game-input flex-1 text-sm" />
            <input value={form.where} onChange={e => setForm(f => ({ ...f, where: e.target.value }))}
              placeholder="Where?" className="game-input flex-1 text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Joy Intensity: {'⭐'.repeat(form.intensity)} ({form.intensity}/5)</p>
            <input type="range" min={1} max={5} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) as JoyIntensity }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-4 items-center">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isMemorable} onChange={e => setForm(f => ({ ...f, isMemorable: e.target.checked }))} />
              Peak moment
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    {e.isMemorable && <span className="text-xs text-yellow-500">⭐ peak</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · {e.date} · {'⭐'.repeat(e.intensity)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.description && <p className="text-xs text-slate-300">{e.description}</p>}
                  <div className="flex gap-4 text-xs text-slate-500">
                    {e.who && <span>👥 {e.who}</span>}
                    {e.where && <span>📍 {e.where}</span>}
                  </div>
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
            <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Joy is always present. Start noticing and capturing it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
