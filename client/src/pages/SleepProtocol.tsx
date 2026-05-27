import { useEffect, useState, useCallback } from 'react'
import { Moon, Sun, Clock, TrendingUp, Plus, Trash2, Save, Star, CheckCircle, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SleepProtocol {
  targetBedtime: string
  targetWakeTime: string
  targetHours: number
  windDownMins: number
  rules: string[]
  notes: string
}

interface SleepEntry {
  id: string
  date: string
  actualBedtime: string
  actualWakeTime: string
  hoursSlept: number
  quality: number
  notes: string
}

const STORAGE_KEY = 'sleep_protocol_design'
const LOG_STORAGE_KEY = 'sleep_protocol_log'

function calcHours(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = waketime.split(':').map(Number)
  let bedMins = bh * 60 + bm
  let wakeMins = wh * 60 + wm
  if (wakeMins <= bedMins) wakeMins += 24 * 60
  return +((wakeMins - bedMins) / 60).toFixed(2)
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

export default function SleepProtocol() {
  const { toastSuccess } = useToast()

  const today = new Date().toISOString().split('T')[0]

  const defaultProtocol: SleepProtocol = {
    targetBedtime: '22:30',
    targetWakeTime: '06:30',
    targetHours: 8,
    windDownMins: 60,
    rules: [],
    notes: '',
  }

  const [protocol, setProtocol] = useState<SleepProtocol>(defaultProtocol)
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [newRule, setNewRule] = useState('')
  const [logForm, setLogForm] = useState({
    date: today,
    actualBedtime: '',
    actualWakeTime: '',
    quality: 3,
    notes: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setProtocol(JSON.parse(saved)) } catch { /* ignore */ }
    }
    const savedLog = localStorage.getItem(LOG_STORAGE_KEY)
    if (savedLog) {
      try { setEntries(JSON.parse(savedLog)) } catch { /* ignore */ }
    }
  }, [])

  const saveProtocol = useCallback((p: SleepProtocol) => {
    setProtocol(p)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }, [])

  const updateProtocol = (field: keyof SleepProtocol, value: string | number | string[]) => {
    const updated = { ...protocol, [field]: value }
    if (field === 'targetBedtime' || field === 'targetWakeTime') {
      const bed = field === 'targetBedtime' ? (value as string) : protocol.targetBedtime
      const wake = field === 'targetWakeTime' ? (value as string) : protocol.targetWakeTime
      updated.targetHours = calcHours(bed, wake)
    }
    saveProtocol(updated)
  }

  const addRule = () => {
    if (!newRule.trim()) return
    saveProtocol({ ...protocol, rules: [...protocol.rules, newRule.trim()] })
    setNewRule('')
  }

  const removeRule = (idx: number) => {
    saveProtocol({ ...protocol, rules: protocol.rules.filter((_, i) => i !== idx) })
  }

  const logHours = calcHours(logForm.actualBedtime, logForm.actualWakeTime)

  const saveEntry = () => {
    if (!logForm.actualBedtime || !logForm.actualWakeTime) return
    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: logForm.date,
      actualBedtime: logForm.actualBedtime,
      actualWakeTime: logForm.actualWakeTime,
      hoursSlept: logHours,
      quality: logForm.quality,
      notes: logForm.notes,
    }
    const updated = [entry, ...entries].sort((a, b) => b.date.localeCompare(a.date))
    setEntries(updated)
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated))
    setLogForm({ date: today, actualBedtime: '', actualWakeTime: '', quality: 3, notes: '' })
    toastSuccess('Sleep logged!', `${logHours.toFixed(1)}h — Quality ${logForm.quality}/5`)
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updated))
  }

  // Stats
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const last7 = sorted.slice(0, 7)

  const avgHours = last7.length > 0
    ? +(last7.reduce((s, e) => s + e.hoursSlept, 0) / last7.length).toFixed(1)
    : 0

  const avgQuality = last7.length > 0
    ? +(last7.reduce((s, e) => s + e.quality, 0) / last7.length).toFixed(1)
    : 0

  const adherence = last7.length > 0
    ? Math.round((last7.filter(e => e.hoursSlept >= protocol.targetHours - 0.5).length / last7.length) * 100)
    : 0

  let streak = 0
  for (const e of sorted) {
    if (e.hoursSlept >= 7) streak++
    else break
  }

  // Chart data: last 7 days
  const chartEntries = last7.slice().reverse()
  const chartW = 320
  const chartH = 100
  const barW = Math.floor(chartW / 8)
  const maxBar = Math.max(protocol.targetHours + 1, ...chartEntries.map(e => e.hoursSlept), 9)
  const targetLineY = chartH - 10 - ((protocol.targetHours / maxBar) * (chartH - 20))

  function barColor(h: number): string {
    if (h >= protocol.targetHours) return '#22c55e'
    if (h >= 6) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Moon className="w-7 h-7 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            Sleep Protocol
          </h1>
          <p className="text-slate-400 text-sm">Design and track your ideal sleep system</p>
        </div>
      </div>

      {/* Stats row */}
      {last7.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-indigo-400">{avgHours}h</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Hours</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{avgQuality}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Quality</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className={`text-xl font-bold ${adherence >= 80 ? 'text-green-400' : adherence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {adherence}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Adherence</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-orange-400">{streak}</div>
            <div className="text-xs text-slate-500 mt-0.5">7h+ Streak</div>
          </div>
        </div>
      )}

      {/* Protocol Designer */}
      <div className="game-card p-5 space-y-4 border border-indigo-500/20">
        <h2 className="font-semibold text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Protocol Designer
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Bedtime</label>
            <input
              type="time"
              value={protocol.targetBedtime}
              onChange={e => updateProtocol('targetBedtime', e.target.value)}
              className="game-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Wake Time</label>
            <input
              type="time"
              value={protocol.targetWakeTime}
              onChange={e => updateProtocol('targetWakeTime', e.target.value)}
              className="game-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Hours (auto)</label>
            <div className="game-input w-full text-indigo-400 font-semibold">
              {protocol.targetHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Wind-Down (mins)</label>
            <input
              type="number"
              value={protocol.windDownMins}
              onChange={e => updateProtocol('windDownMins', parseInt(e.target.value) || 0)}
              className="game-input w-full"
              min="0"
              max="180"
            />
          </div>
        </div>

        {/* Sleep Rules */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Sleep Hygiene Rules</label>
          <div className="space-y-2 mb-2">
            {protocol.rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{rule}</span>
                <button onClick={() => removeRule(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              placeholder="Add a sleep hygiene rule..."
              className="game-input flex-1 text-sm"
            />
            <button
              onClick={addRule}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Protocol Notes</label>
          <textarea
            value={protocol.notes}
            onChange={e => updateProtocol('notes', e.target.value)}
            placeholder="Any additional notes about your sleep protocol..."
            className="game-input w-full text-sm resize-none"
            rows={2}
          />
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Save className="w-3 h-3" />
          Protocol saved automatically
        </div>
      </div>

      {/* Log Tonight's Sleep */}
      <div className="game-card p-5 space-y-4 border border-purple-500/20">
        <h2 className="font-semibold text-slate-300 flex items-center gap-2">
          <Moon className="w-4 h-4 text-purple-400" />
          Log Sleep
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input
              type="date"
              value={logForm.date}
              onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
              className="game-input w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Actual Bedtime</label>
            <input
              type="time"
              value={logForm.actualBedtime}
              onChange={e => setLogForm(f => ({ ...f, actualBedtime: e.target.value }))}
              className="game-input w-full"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Actual Wake Time</label>
            <input
              type="time"
              value={logForm.actualWakeTime}
              onChange={e => setLogForm(f => ({ ...f, actualWakeTime: e.target.value }))}
              className="game-input w-full"
            />
          </div>
        </div>

        {/* Hours auto-calc */}
        {logForm.actualBedtime && logForm.actualWakeTime && (
          <div className="flex items-center gap-2 text-sm">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400">Hours slept:</span>
            <span className={`font-bold ${logHours >= protocol.targetHours ? 'text-green-400' : logHours >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
              {logHours.toFixed(1)}h
            </span>
            {logHours >= protocol.targetHours
              ? <CheckCircle className="w-4 h-4 text-green-400" />
              : <AlertCircle className="w-4 h-4 text-yellow-400" />
            }
          </div>
        )}

        {/* Quality picker */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Sleep Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setLogForm(f => ({ ...f, quality: n }))}
                className={`p-1.5 rounded-lg transition-colors ${logForm.quality >= n ? 'text-yellow-400' : 'text-slate-700'}`}
              >
                <Star className={`w-6 h-6 ${logForm.quality >= n ? 'fill-yellow-400' : ''}`} />
              </button>
            ))}
            <span className="text-sm text-slate-400 ml-2 self-center">{logForm.quality}/5</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Notes</label>
          <input
            type="text"
            value={logForm.notes}
            onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="How did you sleep? Any dreams, disturbances..."
            className="game-input w-full text-sm"
          />
        </div>

        <button
          onClick={saveEntry}
          disabled={!logForm.actualBedtime || !logForm.actualWakeTime}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Sleep Log
        </button>
      </div>

      {/* 7-day chart */}
      {chartEntries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            7-Day Sleep Chart
          </h3>
          <div className="relative">
            <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full" style={{ height: '120px' }}>
              {/* Target line */}
              <line
                x1="10" y1={targetLineY}
                x2={chartW - 10} y2={targetLineY}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="5,3"
                opacity="0.7"
              />
              <text x={chartW - 8} y={targetLineY - 3} fill="#818cf8" fontSize="8" textAnchor="end" opacity="0.8">
                {protocol.targetHours}h target
              </text>

              {/* Bars */}
              {chartEntries.map((e, i) => {
                const barH = (e.hoursSlept / maxBar) * (chartH - 20)
                const x = 10 + i * (barW + 4)
                const y = chartH - 10 - barH
                return (
                  <g key={e.id}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx="3"
                      fill={barColor(e.hoursSlept)}
                      opacity="0.85"
                    />
                    <text x={x + barW / 2} y={chartH + 8} fill="#64748b" fontSize="7" textAnchor="middle">
                      {formatDate(e.date)}
                    </text>
                    <text x={x + barW / 2} y={y - 2} fill="#94a3b8" fontSize="7" textAnchor="middle">
                      {e.hoursSlept.toFixed(1)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              ≥ {protocol.targetHours}h
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
              6–7h
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              &lt; 6h
            </div>
          </div>
        </div>
      )}

      {/* Recent log */}
      {sorted.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Entries</h3>
          <div className="space-y-2">
            {sorted.slice(0, 7).map(entry => {
              const onTarget = entry.hoursSlept >= protocol.targetHours - 0.5
              return (
                <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div className="text-xs text-slate-500 w-20 flex-shrink-0">{entry.date}</div>
                  <div className={`font-semibold text-sm w-12 flex-shrink-0 ${onTarget ? 'text-green-400' : entry.hoursSlept >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {entry.hoursSlept.toFixed(1)}h
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${entry.quality >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 flex-shrink-0">
                    {entry.actualBedtime} → {entry.actualWakeTime}
                  </div>
                  {entry.notes && <span className="text-xs text-slate-600 truncate flex-1">{entry.notes}</span>}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onTarget
                      ? <ChevronUp className="w-3.5 h-3.5 text-green-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-red-400" />
                    }
                    <button onClick={() => deleteEntry(entry.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Moon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No sleep logs yet. Design your protocol and log tonight's sleep!</p>
        </div>
      )}
    </div>
  )
}
