import { useState, useEffect } from 'react'
import { Zap, Plus, Activity, TrendingUp, Sun, Coffee } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface EnergyEntry {
  id: string
  date: string
  timeOfDay: string
  energyLevel: number
  energyType: string
  source: string
  drain: string
  notes: string
  energyScore: number
}

const TIME_SLOTS = [
  'Wake up 5-7am', 'Morning 7-9am', 'Mid-morning 9-11am', 'Noon 11am-1pm',
  'Afternoon 1-3pm', 'Late afternoon 3-5pm', 'Evening 5-7pm', 'Night 7-9pm', 'Late night 9pm+',
]

const ENERGY_TYPES = ['Physical', 'Mental', 'Emotional', 'Creative', 'Social', 'Spiritual']

const SOURCES = [
  'Sleep', 'Nutrition', 'Exercise', 'Nature', 'People', 'Solitude',
  'Prayer/Meditation', 'Achievement', 'Music', 'Rest', 'Coffee', 'Sunlight', 'Learning',
]

const DRAINS = [
  'None', 'Stress', 'Conflict', 'Poor sleep', 'Overstimulation',
  'Boredom', 'Negativity', 'Illness', 'Overwork', 'Poor nutrition',
]

const STORAGE_KEY = 'life_energy_log'

const defaultForm = {
  timeOfDay: TIME_SLOTS[1],
  energyLevel: 5,
  energyType: 'Physical',
  source: 'Sleep',
  drain: 'None',
  notes: '',
}

function energyColor(level: number): string {
  if (level >= 8) return 'bg-green-400'
  if (level >= 6) return 'bg-green-600'
  if (level >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function energyTextColor(level: number): string {
  if (level >= 8) return 'text-green-400'
  if (level >= 6) return 'text-green-600'
  if (level >= 4) return 'text-yellow-500'
  return 'text-red-500'
}

export default function LifeEnergy() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EnergyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const persist = (updated: EnergyEntry[]) => {
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleSave = () => {
    const entry: EnergyEntry = {
      ...form,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      energyScore: form.energyLevel * 10,
    }
    persist([entry, ...entries])
    setForm(defaultForm)
    setShowForm(false)
    toastSuccess('Energy logged!', `Score: ${entry.energyScore}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter(e => e.date === today)

  // Last 7 days grid
  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Dates.push(d.toISOString().split('T')[0])
  }

  const getAvgEnergy = (date: string, slot: string): number => {
    const matching = entries.filter(e => e.date === date && e.timeOfDay === slot)
    if (matching.length === 0) return 0
    return matching.reduce((s, e) => s + e.energyLevel, 0) / matching.length
  }

  // Stats
  const sourceCounts = SOURCES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = entries.filter(e => e.source === s).length
    return acc
  }, {})
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const drainCounts = DRAINS.filter(d => d !== 'None').reduce<Record<string, number>>((acc, d) => {
    acc[d] = entries.filter(e => e.drain === d).length
    return acc
  }, {})
  const topDrain = Object.entries(drainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const slotAvgs = TIME_SLOTS.map(slot => {
    const matching = entries.filter(e => e.timeOfDay === slot)
    if (matching.length === 0) return { slot, avg: 0 }
    return { slot, avg: matching.reduce((s, e) => s + e.energyLevel, 0) / matching.length }
  })
  const peakSlot = slotAvgs.reduce((best, cur) => cur.avg > best.avg ? cur : best, { slot: '—', avg: 0 }).slot

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-6 h-6" /> Life Energy
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track and optimize your energy patterns</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Energy
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="game-card flex items-center gap-3">
            <Sun className="w-8 h-8 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Top Source</div>
              <div className="font-bold text-amber-300">{topSource}</div>
            </div>
          </div>
          <div className="game-card flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Biggest Drain</div>
              <div className="font-bold text-red-300">{topDrain}</div>
            </div>
          </div>
          <div className="game-card flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Peak Energy Time</div>
              <div className="font-bold text-green-300 text-xs">{peakSlot}</div>
            </div>
          </div>
          <div className="game-card flex items-center gap-3">
            <Coffee className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Today's Logs</div>
              <div className="font-bold text-blue-300">{todayEntries.length}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card space-y-4">
            <h2 className="font-bold text-amber-300 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Log Energy
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Time of Day</label>
                <select className="game-input w-full" value={form.timeOfDay} onChange={e => setForm({ ...form, timeOfDay: e.target.value })}>
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Energy Type</label>
                <select className="game-input w-full" value={form.energyType} onChange={e => setForm({ ...form, energyType: e.target.value })}>
                  {ENERGY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 flex justify-between">
                <span>Energy Level</span>
                <span className={`font-bold ${energyTextColor(form.energyLevel)}`}>{form.energyLevel}/10</span>
              </label>
              <input
                type="range" min={1} max={10} step={1}
                className="w-full accent-amber-500"
                value={form.energyLevel}
                onChange={e => setForm({ ...form, energyLevel: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Energy Source</label>
                <select className="game-input w-full" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Energy Drain</label>
                <select className="game-input w-full" value={form.drain} onChange={e => setForm({ ...form, drain: e.target.value })}>
                  {DRAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <input className="game-input w-full" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition-colors">
                Save Entry
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Energy Pattern Grid */}
        <div className="game-card">
          <h2 className="font-bold text-amber-300 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" /> Energy Pattern (Last 7 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <td className="pr-2 text-slate-500 w-8"></td>
                  {last7Dates.map(d => (
                    <td key={d} className="text-center text-slate-500 pb-1 px-0.5">
                      {d.slice(5)}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot}>
                    <td className="text-slate-500 pr-2 py-0.5 text-right leading-tight" style={{ fontSize: '9px', width: '60px' }}>
                      {slot.split(' ')[0]}
                    </td>
                    {last7Dates.map(date => {
                      const avg = getAvgEnergy(date, slot)
                      return (
                        <td key={date} className="px-0.5 py-0.5">
                          <div
                            className={`h-5 w-full rounded ${avg > 0 ? energyColor(avg) : 'bg-slate-700'} opacity-${avg > 0 ? '80' : '30'}`}
                            title={avg > 0 ? `${avg.toFixed(1)}` : 'No data'}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> &lt;4</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500" /> 4-6</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-600" /> 6-8</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-400" /> 8+</div>
          </div>
        </div>

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-amber-300 flex items-center gap-2 mb-3">
              <Sun className="w-4 h-4" /> Today's Energy Logs
            </h2>
            <div className="space-y-2">
              {todayEntries.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                  <div>
                    <span className="text-sm text-slate-200">{e.timeOfDay}</span>
                    <span className="text-xs text-slate-400 ml-2">{e.energyType}</span>
                    {e.notes && <p className="text-xs text-slate-500 mt-0.5">{e.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{e.source}</span>
                    <span className={`font-bold ${energyTextColor(e.energyLevel)}`}>{e.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
