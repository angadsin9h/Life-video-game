import { useEffect, useState } from 'react'
import { Users, Plus, Battery, BatteryLow, BatteryMedium, BatteryFull, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SocialLog {
  id: string
  date: string
  event: string
  type: 'draining' | 'neutral' | 'recharging'
  duration: number
  people: number
  batteryBefore: number
  batteryAfter: number
  notes: string
}

const EVENT_TYPES = [
  { value: 'draining', label: 'Draining', emoji: '😵', color: '#ef4444', description: 'Took energy from you' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748b', description: 'No big impact' },
  { value: 'recharging', label: 'Recharging', emoji: '⚡', color: '#22c55e', description: 'Gave you energy' },
]

const STORAGE_KEY = 'social_battery'

export default function SocialBattery() {
  const { toastSuccess } = useToast()
  const [logs, setLogs] = useState<SocialLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentBattery, setCurrentBattery] = useState(70)
  const [form, setForm] = useState({
    event: '', type: 'neutral' as SocialLog['type'], duration: '60', people: '2',
    batteryBefore: 70, batteryAfter: 70, notes: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      setLogs(parsed)
      if (parsed.length > 0) setCurrentBattery(parsed[0].batteryAfter)
    }
  }, [])

  const persist = (updated: SocialLog[]) => {
    setLogs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (updated.length > 0) setCurrentBattery(updated[0].batteryAfter)
  }

  const addLog = () => {
    if (!form.event.trim()) return
    const log: SocialLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      event: form.event,
      type: form.type,
      duration: parseInt(form.duration) || 60,
      people: parseInt(form.people) || 1,
      batteryBefore: form.batteryBefore,
      batteryAfter: form.batteryAfter,
      notes: form.notes,
    }
    persist([log, ...logs])
    setForm({ event: '', type: 'neutral', duration: '60', people: '2', batteryBefore: form.batteryAfter, batteryAfter: form.batteryAfter, notes: '' })
    setShowForm(false)
    toastSuccess('Social interaction logged!')
  }

  const batteryIcon = (level: number) => {
    if (level >= 70) return BatteryFull
  if (level >= 40) return BatteryMedium
    return BatteryLow
  }
  const batteryColor = (level: number) => level >= 70 ? '#22c55e' : level >= 40 ? '#eab308' : '#ef4444'
  const batteryLabel = (level: number) => level >= 80 ? 'Fully Charged' : level >= 60 ? 'Good' : level >= 40 ? 'Low' : level >= 20 ? 'Very Low' : 'Empty'

  const recentDraining = logs.filter(l => l.type === 'draining').slice(0, 5)
  const recentRecharging = logs.filter(l => l.type === 'recharging').slice(0, 5)

  const avg7DayDelta = logs.length > 0 ? +(logs.slice(0, 7).reduce((s, l) => s + (l.batteryAfter - l.batteryBefore), 0) / Math.min(7, logs.length)).toFixed(1) : 0

  const BattIcon = batteryIcon(currentBattery)

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-blue-400" />
            Social Battery
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your social energy as an introvert/extrovert</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Battery gauge */}
      <div className="game-card p-6 text-center">
        <BattIcon className="w-16 h-16 mx-auto mb-3" style={{ color: batteryColor(currentBattery) }} />
        <div className="text-4xl font-bold mb-1" style={{ color: batteryColor(currentBattery) }}>{currentBattery}%</div>
        <div className="text-slate-400 text-sm mb-3">{batteryLabel(currentBattery)}</div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Adjust current level</label>
          <input type="range" min="0" max="100" value={currentBattery}
            onChange={e => setCurrentBattery(+e.target.value)}
            className="w-full accent-blue-400" />
        </div>
        {avg7DayDelta !== 0 && (
          <div className="text-xs text-slate-500 mt-2">
            7-day avg per interaction: <span style={{ color: avg7DayDelta > 0 ? '#22c55e' : '#ef4444' }}>
              {avg7DayDelta > 0 ? '+' : ''}{avg7DayDelta}%
            </span>
          </div>
        )}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-300">Log Social Interaction</h3>
          <input value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
            placeholder="What happened? (team meeting, party, phone call...)" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            {EVENT_TYPES.map(t => (
              <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value as SocialLog['type'] }))}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={form.type === t.value ? { background: t.color + '33', color: t.color, border: `1px solid ${t.color}` } : { background: '#1e293b', color: '#64748b' }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="game-input w-full" min="1" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">People involved</label>
              <input type="number" value={form.people} onChange={e => setForm(f => ({ ...f, people: e.target.value }))} className="game-input w-full" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Battery before: {form.batteryBefore}%</label>
              <input type="range" min="0" max="100" value={form.batteryBefore}
                onChange={e => setForm(f => ({ ...f, batteryBefore: +e.target.value }))} className="w-full accent-blue-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Battery after: {form.batteryAfter}%</label>
              <input type="range" min="0" max="100" value={form.batteryAfter}
                onChange={e => setForm(f => ({ ...f, batteryAfter: +e.target.value }))} className="w-full accent-blue-400" />
            </div>
          </div>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full" />
          <div className="flex gap-2">
            <button onClick={addLog} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* What charges / drains you */}
      {logs.length > 5 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="game-card p-3">
            <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">⚡ Recharges You</h3>
            <div className="space-y-1">
              {recentRecharging.map(l => (
                <div key={l.id} className="text-xs text-slate-400 truncate">{l.event}</div>
              ))}
              {recentRecharging.length === 0 && <div className="text-xs text-slate-600">None logged</div>}
            </div>
          </div>
          <div className="game-card p-3">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">😵 Drains You</h3>
            <div className="space-y-1">
              {recentDraining.map(l => (
                <div key={l.id} className="text-xs text-slate-400 truncate">{l.event}</div>
              ))}
              {recentDraining.length === 0 && <div className="text-xs text-slate-600">None logged</div>}
            </div>
          </div>
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Interactions</h3>
          <div className="space-y-2">
            {logs.slice(0, 10).map(l => {
              const t = EVENT_TYPES.find(et => et.value === l.type)
              const delta = l.batteryAfter - l.batteryBefore
              return (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-lg">{t?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-300 truncate">{l.event}</div>
                    <div className="text-xs text-slate-600">{l.date} · {l.duration}m · {l.people} people</div>
                  </div>
                  <div className={`text-sm font-bold flex-shrink-0 ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {delta > 0 ? '+' : ''}{delta}%
                  </div>
                  <button onClick={() => persist(logs.filter(x => x.id !== l.id))} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {logs.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No interactions logged yet.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Interaction
          </button>
        </div>
      )}
    </div>
  )
}
