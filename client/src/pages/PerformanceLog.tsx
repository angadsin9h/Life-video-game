import { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PerformanceArea = 'work' | 'fitness' | 'mental' | 'creative' | 'social' | 'financial' | 'learning' | 'health' | 'spiritual' | 'other'
type PerformanceRating = 'below' | 'at' | 'above' | 'exceptional' | 'breakthrough'

interface PerformanceEntry {
  id: string
  area: PerformanceArea
  rating: PerformanceRating
  title: string
  whatWentWell: string
  whatCouldImprove: string
  keyMetric: string
  nextAction: string
  energyLevel: number
  performanceScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<PerformanceArea, { label: string; emoji: string; color: string }> = {
  work:      { label: 'Work',       emoji: '💼', color: '#3b82f6' },
  fitness:   { label: 'Fitness',    emoji: '💪', color: '#ef4444' },
  mental:    { label: 'Mental',     emoji: '🧠', color: '#a855f7' },
  creative:  { label: 'Creative',   emoji: '🎨', color: '#f97316' },
  social:    { label: 'Social',     emoji: '👥', color: '#ec4899' },
  financial: { label: 'Financial',  emoji: '💰', color: '#22c55e' },
  learning:  { label: 'Learning',   emoji: '📚', color: '#6366f1' },
  health:    { label: 'Health',     emoji: '🫀', color: '#84cc16' },
  spiritual: { label: 'Spiritual',  emoji: '✨', color: '#f59e0b' },
  other:     { label: 'Other',      emoji: '⚡', color: '#94a3b8' },
}

const RATING_CONFIG: Record<PerformanceRating, { label: string; color: string; emoji: string }> = {
  below:       { label: 'Below Par',    color: '#ef4444', emoji: '📉' },
  at:          { label: 'At Standard',  color: '#f59e0b', emoji: '➡️' },
  above:       { label: 'Above Par',    color: '#22c55e', emoji: '📈' },
  exceptional: { label: 'Exceptional',  color: '#3b82f6', emoji: '⭐' },
  breakthrough:{ label: 'Breakthrough', color: '#a855f7', emoji: '🚀' },
}

const STORAGE_KEY = 'performance_log'

export default function PerformanceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PerformanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PerformanceEntry, 'id' | 'createdAt'>>({
    area: 'work', rating: 'at', title: '', whatWentWell: '', whatCouldImprove: '',
    keyMetric: '', nextAction: '', energyLevel: 7, performanceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PerformanceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: PerformanceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', whatWentWell: '', whatCouldImprove: '', keyMetric: '', nextAction: '' }))
    setShowForm(false)
    toastSuccess('Performance logged — track it to improve it 📈')
  }

  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + e.performanceScore, 0) / entries.length) : 0
  const breakthroughs = entries.filter(e => e.rating === 'breakthrough').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <TrendingUp className="w-7 h-7 text-green-400" />
            Performance Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Rate your performance, find patterns, optimize.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{breakthroughs}</div>
          <div className="text-xs text-slate-500">Breakthroughs</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Performance</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as PerformanceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [PerformanceArea, typeof AREA_CONFIG.work][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value as PerformanceRating }))} className="game-input text-sm flex-1">
              {(Object.entries(RATING_CONFIG) as [PerformanceRating, typeof RATING_CONFIG.at][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What were you performing at? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.keyMetric} onChange={e => setForm(f => ({ ...f, keyMetric: e.target.value }))}
            placeholder="Key metric or measurable result" className="game-input w-full text-sm" />
          <input value={form.whatWentWell} onChange={e => setForm(f => ({ ...f, whatWentWell: e.target.value }))}
            placeholder="What went well?" className="game-input w-full text-sm" />
          <input value={form.whatCouldImprove} onChange={e => setForm(f => ({ ...f, whatCouldImprove: e.target.value }))}
            placeholder="What could improve?" className="game-input w-full text-sm" />
          <input value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
            placeholder="Next action to level up" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy: {form.energyLevel}/10</p>
              <input type="range" min={1} max={10} value={form.energyLevel}
                onChange={e => setForm(f => ({ ...f, energyLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Score: {form.performanceScore}/10</p>
              <input type="range" min={1} max={10} value={form.performanceScore}
                onChange={e => setForm(f => ({ ...f, performanceScore: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const r = RATING_CONFIG[e.rating]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{r.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: r.color + '20', color: r.color }}>{r.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-green-400">📊 {e.performanceScore}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{e.title}</p>
                {e.keyMetric && <p className="text-xs text-blue-300/80 mt-0.5">Result: {e.keyMetric}</p>}
                {e.nextAction && <p className="text-xs text-yellow-300/70 mt-0.5">Next: {e.nextAction}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What gets measured, gets managed. Track your performance.</p>
          </div>
        )}
      </div>
    </div>
  )
}
