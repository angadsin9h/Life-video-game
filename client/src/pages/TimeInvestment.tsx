import { useState, useEffect } from 'react'
import { Clock, Plus, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TimeCategory = 'Deep Work' | 'Relationships' | 'Health' | 'Learning' | 'Creative' | 'Service' | 'Rest & Recovery' | 'Administration' | 'Entertainment' | 'Spiritual'

interface TimeEntry {
  id: string
  date: string
  category: TimeCategory
  hoursSpent: number
  intentional: boolean
  qualityRating: number
  valueCreated: string
  wouldRepeat: boolean
  timeScore: number
  createdAt: string
}

const STORAGE_KEY = 'time_investment_log'

const CATEGORIES: TimeCategory[] = [
  'Deep Work', 'Relationships', 'Health', 'Learning', 'Creative',
  'Service', 'Rest & Recovery', 'Administration', 'Entertainment', 'Spiritual',
]

const CATEGORY_COLORS: Record<TimeCategory, string> = {
  'Deep Work': '#6366f1',
  'Relationships': '#ec4899',
  'Health': '#22c55e',
  'Learning': '#3b82f6',
  'Creative': '#f97316',
  'Service': '#14b8a6',
  'Rest & Recovery': '#a855f7',
  'Administration': '#64748b',
  'Entertainment': '#f59e0b',
  'Spiritual': '#10b981',
}

function getLast7DaysEntries(entries: TimeEntry[]): TimeEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  cutoff.setHours(0, 0, 0, 0)
  return entries.filter(e => new Date(e.date) >= cutoff)
}

export default function TimeInvestment() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    date: string
    category: TimeCategory
    hoursSpent: number
    intentional: boolean
    qualityRating: number
    valueCreated: string
    wouldRepeat: boolean
  }>({
    date: new Date().toISOString().split('T')[0],
    category: 'Deep Work',
    hoursSpent: 1,
    intentional: true,
    qualityRating: 7,
    valueCreated: '',
    wouldRepeat: true,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: TimeEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    const timeScore = form.intentional ? form.qualityRating * 10 : form.qualityRating * 5
    const e: TimeEntry = {
      id: Date.now().toString(),
      ...form,
      timeScore,
      createdAt: new Date().toISOString(),
    }
    save([e, ...entries])
    setForm(f => ({ ...f, valueCreated: '' }))
    setShowForm(false)
    toastSuccess('Time investment logged!')
  }

  const last7 = getLast7DaysEntries(entries)
  const totalHoursWeek = last7.reduce((s, e) => s + e.hoursSpent, 0)

  const categoryTotals = CATEGORIES.reduce<Record<TimeCategory, number>>((acc, c) => {
    acc[c] = last7.filter(e => e.category === c).reduce((s, e) => s + e.hoursSpent, 0)
    return acc
  }, {} as Record<TimeCategory, number>)

  const totalHoursForBar = Math.max(0.01, totalHoursWeek)
  const activeCats = CATEGORIES.filter(c => categoryTotals[c] > 0)

  const bestInvestment = last7.reduce<TimeEntry | null>((best, e) => {
    const score = e.qualityRating * e.hoursSpent
    if (!best) return e
    return score > best.qualityRating * best.hoursSpent ? e : best
  }, null)

  const timeWasters = last7.filter(e => !e.intentional && e.qualityRating <= 4)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-blue-400" />
            Time Investment
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how you invest your time across life categories.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">All Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{totalHoursWeek.toFixed(1)}h</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{timeWasters.length}</div>
          <div className="text-xs text-slate-500">Time Wasters</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Time Investment</h3>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TimeCategory }))} className="game-input text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Hours spent: {form.hoursSpent}h</p>
            <input type="range" min={0.5} max={16} step={0.5} value={form.hoursSpent}
              onChange={e => setForm(f => ({ ...f, hoursSpent: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Quality rating: {form.qualityRating}/10</p>
            <input type="range" min={1} max={10} value={form.qualityRating}
              onChange={e => setForm(f => ({ ...f, qualityRating: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <input value={form.valueCreated} onChange={e => setForm(f => ({ ...f, valueCreated: e.target.value }))}
            placeholder="What value did this time create?" className="game-input w-full text-sm" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.intentional} onChange={e => setForm(f => ({ ...f, intentional: e.target.checked }))}
                className="accent-blue-500" />
              Intentional / planned
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.wouldRepeat} onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))}
                className="accent-blue-500" />
              Would repeat
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Time Score: <span className="text-blue-400 font-semibold">
              {form.intentional ? form.qualityRating * 10 : form.qualityRating * 5}
            </span>
          </p>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {totalHoursWeek > 0 && (
        <div className="game-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Time Portfolio — Last 7 Days
          </h3>
          <div className="h-6 rounded-lg overflow-hidden flex">
            {activeCats.map(c => (
              <div key={c} title={`${c}: ${categoryTotals[c].toFixed(1)}h`}
                style={{ width: `${(categoryTotals[c] / totalHoursForBar) * 100}%`, background: CATEGORY_COLORS[c] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCats.map(c => (
              <div key={c} className="flex items-center gap-1.5 text-xs text-slate-300">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c] }} />
                <span>{c}</span>
                <span className="text-slate-500">{((categoryTotals[c] / totalHoursForBar) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(bestInvestment || timeWasters.length > 0) && (
        <div className="grid grid-cols-1 gap-3">
          {bestInvestment && (
            <div className="game-card p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Best Investment This Week</span>
              </div>
              <p className="text-sm text-white font-medium">{bestInvestment.category}</p>
              <p className="text-xs text-slate-400">{bestInvestment.hoursSpent}h · Quality {bestInvestment.qualityRating}/10
                {bestInvestment.valueCreated ? ` · ${bestInvestment.valueCreated}` : ''}</p>
            </div>
          )}
          {timeWasters.length > 0 && (
            <div className="game-card p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400">Time Wasters ({timeWasters.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {timeWasters.map(e => (
                  <span key={e.id} className="text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded">{e.category}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {last7.length > 0 && (
        <div className="game-card p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-white mb-3">7-Day Breakdown</h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-2 pr-3">Date</th>
                <th className="pb-2 pr-3">Category</th>
                <th className="pb-2 pr-3">Hours</th>
                <th className="pb-2 pr-3">Quality</th>
                <th className="pb-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {last7.map(e => (
                <tr key={e.id} className="border-t border-slate-700/50">
                  <td className="py-1.5 pr-3 text-slate-400">{e.date}</td>
                  <td className="py-1.5 pr-3">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
                      <span className="text-slate-300">{e.category}</span>
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-slate-300">{e.hoursSpent}h</td>
                  <td className="py-1.5 pr-3 text-slate-300">{e.qualityRating}/10</td>
                  <td className="py-1.5 text-blue-400 font-semibold">{e.timeScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Time is your only non-renewable resource. Invest it wisely.</p>
        </div>
      )}
    </div>
  )
}
