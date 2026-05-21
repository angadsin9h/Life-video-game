import { useState, useEffect } from 'react'
import { Coffee, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BreakType = 'micro' | 'short' | 'lunch' | 'walk' | 'nap' | 'social' | 'creative' | 'mindful' | 'physical' | 'digital-detox'
type BreakQuality = 'poor' | 'okay' | 'good' | 'great' | 'restorative'

interface BreakEntry {
  id: string
  breakType: BreakType
  quality: BreakQuality
  activity: string
  location: string
  energyBefore: number
  energyAfter: number
  duration: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<BreakType, { label: string; emoji: string; color: string }> = {
  micro:           { label: 'Micro',          emoji: '⚡', color: '#f59e0b' },
  short:           { label: 'Short Break',    emoji: '☕', color: '#f97316' },
  lunch:           { label: 'Lunch',          emoji: '🍽️', color: '#22c55e' },
  walk:            { label: 'Walk',           emoji: '🚶', color: '#84cc16' },
  nap:             { label: 'Power Nap',      emoji: '😴', color: '#3b82f6' },
  social:          { label: 'Social',         emoji: '👥', color: '#ec4899' },
  creative:        { label: 'Creative Play',  emoji: '🎨', color: '#a855f7' },
  mindful:         { label: 'Mindful',        emoji: '🧘', color: '#6366f1' },
  physical:        { label: 'Physical',       emoji: '💪', color: '#ef4444' },
  'digital-detox': { label: 'Digital Detox', emoji: '📵', color: '#0ea5e9' },
}

const QUALITY_CONFIG: Record<BreakQuality, { label: string; color: string }> = {
  poor:        { label: 'Poor',        color: '#ef4444' },
  okay:        { label: 'Okay',        color: '#f59e0b' },
  good:        { label: 'Good',        color: '#22c55e' },
  great:       { label: 'Great',       color: '#3b82f6' },
  restorative: { label: 'Restorative', color: '#a855f7' },
}

const STORAGE_KEY = 'break_log'

export default function BreakLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BreakEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BreakEntry, 'id' | 'createdAt'>>({
    breakType: 'short', quality: 'good', activity: '', location: '',
    energyBefore: 5, energyAfter: 7, duration: 15,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BreakEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.activity.trim()) return
    const e: BreakEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, activity: '', location: '' }))
    setShowForm(false)
    toastSuccess('Break logged — rest is productive too ☕')
  }

  const avgEnergyGain = entries.length
    ? Math.round(entries.reduce((s, e) => s + (e.energyAfter - e.energyBefore), 0) / entries.length * 10) / 10
    : 0
  const restorative = entries.filter(e => e.quality === 'restorative' || e.quality === 'great').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Coffee className="w-7 h-7 text-amber-400" />
            Break Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your recovery breaks. Optimize rest for peak performance.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Breaks</div>
        </div>
        <div className="game-card p-3">
          <div className={`text-xl font-bold ${avgEnergyGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>{avgEnergyGain > 0 ? '+' : ''}{avgEnergyGain}</div>
          <div className="text-xs text-slate-500">Avg Energy Gain</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{restorative}</div>
          <div className="text-xs text-slate-500">Restorative</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Break</h3>
          <div className="flex gap-2">
            <select value={form.breakType} onChange={e => setForm(f => ({ ...f, breakType: e.target.value as BreakType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [BreakType, typeof TYPE_CONFIG.short][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as BreakQuality }))} className="game-input text-sm flex-1">
              {(Object.entries(QUALITY_CONFIG) as [BreakQuality, typeof QUALITY_CONFIG.good][]).map(([k, q]) => (
                <option key={k} value={k}>{q.label}</option>
              ))}
            </select>
          </div>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="What did you do on this break? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Where did you take the break?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Duration: {form.duration}min</p>
            <input type="range" min={1} max={120} value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy Before: {form.energyBefore}/10</p>
              <input type="range" min={1} max={10} value={form.energyBefore}
                onChange={e => setForm(f => ({ ...f, energyBefore: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy After: {form.energyAfter}/10</p>
              <input type="range" min={1} max={10} value={form.energyAfter}
                onChange={e => setForm(f => ({ ...f, energyAfter: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Log Break</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.breakType]
          const q = QUALITY_CONFIG[e.quality]
          const gain = e.energyAfter - e.energyBefore
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${q.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: q.color + '20', color: q.color }}>{q.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs text-amber-400">⏱ {e.duration}min</span>
                  <span className={`text-xs ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>⚡ {gain > 0 ? '+' : ''}{gain}</span>
                </div>
                <p className="text-xs text-white mt-1">{e.activity}</p>
                {e.location && <p className="text-xs text-slate-500 mt-0.5">📍 {e.location}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Coffee className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Strategic rest is a performance tool, not laziness.</p>
          </div>
        )}
      </div>
    </div>
  )
}
