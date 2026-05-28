import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BatteryArea = 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'creative' | 'motivational'

interface BatteryEntry {
  id: string
  area: BatteryArea
  activity: string
  charger: boolean
  level: number
  timeCost: number
  notes: string
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<BatteryArea, { label: string; emoji: string; color: string }> = {
  physical:     { label: 'Physical',     emoji: '💪', color: '#22c55e' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#3b82f6' },
  emotional:    { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  social:       { label: 'Social',       emoji: '👥', color: '#f59e0b' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#a855f7' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#f97316' },
  motivational: { label: 'Motivational', emoji: '🔥', color: '#ef4444' },
}

interface BatteryLevel {
  area: BatteryArea
  level: number
}

const STORAGE_KEY = 'focus_batteries'
const LEVELS_KEY = 'focus_battery_levels'

const DEFAULT_LEVELS: BatteryLevel[] = [
  { area: 'physical', level: 70 },
  { area: 'mental', level: 70 },
  { area: 'emotional', level: 70 },
  { area: 'social', level: 70 },
  { area: 'spiritual', level: 70 },
  { area: 'creative', level: 70 },
  { area: 'motivational', level: 70 },
]

export default function FocusBatteries() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BatteryEntry[]>([])
  const [levels, setLevels] = useState<BatteryLevel[]>(DEFAULT_LEVELS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BatteryEntry, 'id' | 'createdAt'>>({
    area: 'mental', activity: '', charger: true, level: 20,
    timeCost: 30, notes: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const saved = localStorage.getItem(LEVELS_KEY)
      if (saved) setLevels(JSON.parse(saved))
    } catch { /**/ }
  }, [])

  const saveEntries = (u: BatteryEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveLevels = (u: BatteryLevel[]) => { setLevels(u); localStorage.setItem(LEVELS_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.activity.trim()) return
    const e: BatteryEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveEntries([e, ...entries])
    const newLevels = levels.map(l =>
      l.area === form.area
        ? { ...l, level: Math.min(100, Math.max(0, l.level + (form.charger ? form.level : -form.level))) }
        : l
    )
    saveLevels(newLevels)
    setForm(f => ({ ...f, activity: '', notes: '' }))
    setShowForm(false)
    toastSuccess(form.charger ? 'Battery charged! ⚡' : 'Battery drain logged')
  }

  const updateLevel = (area: BatteryArea, val: number) => {
    saveLevels(levels.map(l => l.area === area ? { ...l, level: val } : l))
  }

  const avgLevel = Math.round(levels.reduce((s, l) => s + l.level, 0) / levels.length)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Focus Batteries
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track what charges and drains your energy batteries.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">Overall Energy</p>
          <span className="text-lg font-bold" style={{ color: avgLevel > 60 ? '#22c55e' : avgLevel > 30 ? '#f59e0b' : '#ef4444' }}>{avgLevel}%</span>
        </div>
        <div className="space-y-3">
          {levels.map(l => {
            const a = AREA_CONFIG[l.area]
            return (
              <div key={l.area}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{a.emoji} {a.label}</span>
                  <span className="text-xs font-medium" style={{ color: a.color }}>{l.level}%</span>
                </div>
                <input type="range" min={0} max={100} value={l.level}
                  onChange={e => updateLevel(l.area, Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: a.color }} />
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Energy Activity</h3>
          <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as BatteryArea }))} className="game-input w-full text-sm">
            {(Object.entries(AREA_CONFIG) as [BatteryArea, typeof AREA_CONFIG.physical][]).map(([k, a]) => (
              <option key={k} value={k}>{a.emoji} {a.label}</option>
            ))}
          </select>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="Activity name *" className="game-input w-full" autoFocus />
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={form.charger} onChange={() => setForm(f => ({ ...f, charger: true }))} />
              <span className="text-green-400">⚡ Charger</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={!form.charger} onChange={() => setForm(f => ({ ...f, charger: false }))} />
              <span className="text-red-400">🔋 Drain</span>
            </label>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">{form.charger ? 'Charge amount' : 'Drain amount'}: {form.level}%</p>
              <input type="range" min={5} max={50} step={5} value={form.level}
                onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Time: {form.timeCost} min</p>
              <input type="range" min={5} max={180} step={5} value={form.timeCost}
                onChange={e => setForm(f => ({ ...f, timeCost: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 px-1">Recent activity</p>
          {entries.slice(0, 10).map(e => {
            const a = AREA_CONFIG[e.area]
            return (
              <div key={e.id} className="game-card p-3 flex items-center gap-3">
                <span className="text-xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{e.activity}</span>
                    <span className={`text-xs ${e.charger ? 'text-green-400' : 'text-red-400'}`}>
                      {e.charger ? `+${e.level}%` : `-${e.level}%`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{a.label} · {e.timeCost}min · {e.date}</p>
                </div>
                <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
