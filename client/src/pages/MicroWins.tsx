import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type WinCategory = 'health' | 'mindset' | 'productivity' | 'relationships' | 'finance' | 'skill' | 'habit' | 'courage' | 'kindness' | 'other'

interface MicroWin {
  id: string
  category: WinCategory
  title: string
  why: string
  impact: string
  date: string
  mood: number
  createdAt: string
}

const CAT_CONFIG: Record<WinCategory, { label: string; emoji: string; color: string }> = {
  health:       { label: 'Health',       emoji: '💪', color: '#22c55e' },
  mindset:      { label: 'Mindset',      emoji: '🧠', color: '#a855f7' },
  productivity: { label: 'Productivity', emoji: '⚡', color: '#3b82f6' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  finance:      { label: 'Finance',      emoji: '💰', color: '#f59e0b' },
  skill:        { label: 'Skill',        emoji: '📚', color: '#6366f1' },
  habit:        { label: 'Habit',        emoji: '🔄', color: '#f97316' },
  courage:      { label: 'Courage',      emoji: '🦁', color: '#ef4444' },
  kindness:     { label: 'Kindness',     emoji: '🤝', color: '#0ea5e9' },
  other:        { label: 'Other',        emoji: '🌟', color: '#94a3b8' },
}

const STORAGE_KEY = 'micro_wins'

export default function MicroWins() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<MicroWin[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<MicroWin, 'id' | 'createdAt'>>({
    category: 'habit', title: '', why: '', impact: '', mood: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setWins(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MicroWin[]) => { setWins(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const w: MicroWin = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([w, ...wins])
    setForm(f => ({ ...f, title: '', why: '', impact: '' }))
    setShowForm(false)
    toastSuccess('Micro-win celebrated! 🏆')
  }

  const filtered = wins.filter(w => filterCat === 'all' || w.category === filterCat)
  const today = wins.filter(w => w.date === new Date().toISOString().split('T')[0]).length
  const thisWeek = wins.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const diff = (now.getTime() - d.getTime()) / 86400000
    return diff <= 7
  }).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Micro Wins
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Celebrate the small victories that fuel momentum.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Win
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{wins.length}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{today}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{thisWeek}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [WinCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Micro Win</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as WinCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [WinCategory, typeof CAT_CONFIG.health][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What did you do? *" className="game-input w-full" autoFocus />
          <input value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
            placeholder="Why does this matter?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="What impact does it have?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Mood boost: {form.mood}/10</p>
              <input type="range" min={1} max={10} value={form.mood}
                onChange={e => setForm(f => ({ ...f, mood: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Celebrate!</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(w => {
          const c = CAT_CONFIG[w.category]
          return (
            <div key={w.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-white text-sm">{w.title}</span>
                {w.why && <p className="text-xs text-slate-400 truncate">{w.why}</p>}
                <p className="text-xs text-slate-500">{w.date} · mood {w.mood}/10</p>
              </div>
              <button onClick={() => save(wins.filter(x => x.id !== w.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every big achievement is built on micro wins. Start celebrating them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
