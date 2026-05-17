import { useState, useEffect, useMemo } from 'react'
import { Moon, Plus, Check, Star, BarChart3, TrendingUp, Clock, Sun, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface SleepEntry {
  date: string
  bedtime: string
  waketime: string
  durationMinutes: number
  positiveFactors: string[]
  negativeFactors: string[]
  score: number
  notes: string
}

const POSITIVE_FACTORS = [
  'Fell asleep within 15 min',
  'No wakeups',
  'Woke refreshed',
  'No screens 1hr before',
  'Consistent bedtime',
]

const NEGATIVE_FACTORS = [
  'Took long to fall asleep',
  'Woke multiple times',
  'Groggy on waking',
  'Late screens',
  'Irregular schedule',
]

const OPTIMAL_HOURS = 8

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function calcDuration(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0
  let bed = parseTimeToMinutes(bedtime)
  let wake = parseTimeToMinutes(waketime)
  if (wake <= bed) wake += 24 * 60 // crossed midnight
  return wake - bed
}

function calcScore(pos: string[], neg: string[]): number {
  const raw = 60 + pos.length * 8 - neg.length * 8
  return Math.min(100, Math.max(0, raw))
}

function formatDuration(minutes: number): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getDateKey(date: string): string {
  return `sleep_score_${date}`
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function SleepScore() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()

  const [selectedDate, setSelectedDate] = useState(today)
  const [bedtime, setBedtime] = useState('22:30')
  const [waketime, setWaketime] = useState('06:30')
  const [positiveFactors, setPositiveFactors] = useState<string[]>([])
  const [negativeFactors, setNegativeFactors] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<Record<string, SleepEntry>>({})

  const last7Days = useMemo(() => getLast7Days(), [])

  // Load all entries from localStorage
  useEffect(() => {
    const loaded: Record<string, SleepEntry> = {}
    for (const date of last7Days) {
      const raw = localStorage.getItem(getDateKey(date))
      if (raw) {
        try { loaded[date] = JSON.parse(raw) } catch { /* skip */ }
      }
    }
    setEntries(loaded)
  }, [last7Days])

  // Load selected date entry into form
  useEffect(() => {
    const raw = localStorage.getItem(getDateKey(selectedDate))
    if (raw) {
      try {
        const entry: SleepEntry = JSON.parse(raw)
        setBedtime(entry.bedtime || '22:30')
        setWaketime(entry.waketime || '06:30')
        setPositiveFactors(entry.positiveFactors || [])
        setNegativeFactors(entry.negativeFactors || [])
        setNotes(entry.notes || '')
        setSaved(true)
      } catch {
        resetForm()
      }
    } else {
      resetForm()
    }
  }, [selectedDate])

  function resetForm() {
    setBedtime('22:30')
    setWaketime('06:30')
    setPositiveFactors([])
    setNegativeFactors([])
    setNotes('')
    setSaved(false)
  }

  const durationMinutes = calcDuration(bedtime, waketime)
  const score = calcScore(positiveFactors, negativeFactors)

  function togglePositive(factor: string) {
    setPositiveFactors(prev =>
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    )
    setSaved(false)
  }

  function toggleNegative(factor: string) {
    setNegativeFactors(prev =>
      prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor]
    )
    setSaved(false)
  }

  function saveEntry() {
    const entry: SleepEntry = {
      date: selectedDate,
      bedtime,
      waketime,
      durationMinutes,
      positiveFactors,
      negativeFactors,
      score,
      notes,
    }
    localStorage.setItem(getDateKey(selectedDate), JSON.stringify(entry))
    setEntries(prev => ({ ...prev, [selectedDate]: entry }))
    setSaved(true)
    toastSuccess('Sleep logged!', `Score: ${score}/100 · ${formatDuration(durationMinutes)}`)
  }

  // 7-day trend data
  const trendData = last7Days.map(date => {
    const entry = entries[date]
    return {
      date,
      score: entry?.score ?? null,
      duration: entry?.durationMinutes ?? null,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
    }
  })

  const maxScore = 100
  const validScores = trendData.filter(d => d.score !== null).map(d => d.score as number)
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null

  // Sleep debt: sum of shortfalls over 7 days
  const sleepDebt = last7Days.reduce((debt, date) => {
    const entry = entries[date]
    if (!entry) return debt
    const hoursSlept = entry.durationMinutes / 60
    const shortfall = Math.max(0, OPTIMAL_HOURS - hoursSlept)
    return debt + shortfall
  }, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Moon className="w-7 h-7 text-indigo-400" />
          Sleep Score
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track sleep quality and build better rest habits</p>
      </div>

      {/* Date Selector */}
      <div className="game-card p-4 flex items-center gap-3">
        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm text-slate-400">Logging for:</span>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
          className="game-input text-sm flex-1"
        />
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      {/* Sleep Times */}
      <div className="game-card p-5 border border-indigo-500/20">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          Sleep Times
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Bedtime</label>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <input
                type="time"
                value={bedtime}
                onChange={e => { setBedtime(e.target.value); setSaved(false) }}
                className="game-input flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Wake Time</label>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <input
                type="time"
                value={waketime}
                onChange={e => { setWaketime(e.target.value); setSaved(false) }}
                className="game-input flex-1"
              />
            </div>
          </div>
        </div>
        {durationMinutes > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Duration:</span>
            <span className={`font-bold ${durationMinutes >= OPTIMAL_HOURS * 60 ? 'text-green-400' : durationMinutes >= 360 ? 'text-yellow-400' : 'text-red-400'}`}>
              {formatDuration(durationMinutes)}
            </span>
            {durationMinutes < OPTIMAL_HOURS * 60 && (
              <span className="text-xs text-slate-500">
                ({formatDuration(OPTIMAL_HOURS * 60 - durationMinutes)} short of optimal)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quality Factors */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          Quality Factors
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Positive (+8 each)</p>
            <div className="space-y-2">
              {POSITIVE_FACTORS.map(factor => {
                const active = positiveFactors.includes(factor)
                return (
                  <button
                    key={factor}
                    onClick={() => togglePositive(factor)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      active
                        ? 'bg-green-900/30 border border-green-500/40 text-green-300'
                        : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${active ? 'bg-green-500' : 'bg-slate-600'}`}>
                      {active && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {factor}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Negative (-8 each)</p>
            <div className="space-y-2">
              {NEGATIVE_FACTORS.map(factor => {
                const active = negativeFactors.includes(factor)
                return (
                  <button
                    key={factor}
                    onClick={() => toggleNegative(factor)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      active
                        ? 'bg-red-900/30 border border-red-500/40 text-red-300'
                        : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${active ? 'bg-red-500' : 'bg-slate-600'}`}>
                      {active && <X className="w-3 h-3 text-white" />}
                    </div>
                    {factor}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Score Preview */}
      <div className="game-card p-5 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-200">Tonight's Score</h3>
          {avgScore !== null && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              avgScore >= 80 ? 'bg-green-900/40 text-green-400' :
              avgScore >= 60 ? 'bg-yellow-900/40 text-yellow-400' :
              'bg-red-900/40 text-red-400'
            }`}>
              7-day avg: {avgScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${scoreColor(score)}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {score}
          </div>
          <div className="flex-1">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBg(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span className={scoreColor(score)}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'}
              </span>
              <span>100</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span>Base: 60</span>
          {positiveFactors.length > 0 && <span className="text-green-400">+{positiveFactors.length * 8} positive</span>}
          {negativeFactors.length > 0 && <span className="text-red-400">-{negativeFactors.length * 8} negative</span>}
        </div>
      </div>

      {/* Notes */}
      <div className="game-card p-5">
        <label className="block text-sm font-semibold text-slate-300 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={2}
          placeholder="Any dreams, disturbances, or observations..."
          className="game-input w-full resize-none text-sm"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={saveEntry}
        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] shadow-lg shadow-indigo-500/20"
      >
        <Plus className="w-5 h-5" />
        {saved ? 'Update Sleep Entry' : 'Log Sleep Entry'}
      </button>

      {/* Sleep Debt Tracker */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          Sleep Debt (7 Days)
        </h3>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-bold ${sleepDebt === 0 ? 'text-green-400' : sleepDebt < 5 ? 'text-yellow-400' : 'text-red-400'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}>
            {sleepDebt.toFixed(1)}h
          </div>
          <div className="flex-1 text-sm text-slate-400">
            {sleepDebt === 0
              ? 'No sleep debt — great work!'
              : sleepDebt < 5
              ? `Mild debt. Aim for ${Math.ceil(sleepDebt / 7 * 60)}min extra per night this week.`
              : `Significant debt. Prioritize sleep recovery — ${(sleepDebt / 7).toFixed(1)}h short daily average.`}
          </div>
        </div>
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${sleepDebt === 0 ? 'bg-green-500' : sleepDebt < 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, (sleepDebt / 14) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-1">Optimal: 8h/night · 0h debt = fully rested</p>
      </div>

      {/* 7-Day Trend Bar Chart */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          7-Day Trend
        </h3>
        <div className="flex items-end gap-2 h-32">
          {trendData.map(day => {
            const hasData = day.score !== null
            const barHeight = hasData ? Math.max(4, (day.score! / maxScore) * 112) : 4
            const isToday = day.date === today
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                {hasData && (
                  <span className={`text-[10px] font-semibold ${scoreColor(day.score!)}`}>{day.score}</span>
                )}
                <div className="w-full flex flex-col justify-end" style={{ height: 112 }}>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      !hasData ? 'bg-slate-700' :
                      day.score! >= 80 ? 'bg-green-500' :
                      day.score! >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    } ${isToday ? 'ring-1 ring-white/30' : ''}`}
                    style={{ height: barHeight }}
                  />
                </div>
                <span className={`text-[10px] ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Duration sub-chart */}
        <div className="mt-4 border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Sleep Duration (hours)
          </p>
          <div className="flex items-end gap-2 h-12">
            {trendData.map(day => {
              const hours = day.duration !== null ? day.duration / 60 : 0
              const barH = Math.max(2, (hours / 12) * 44)
              const isToday = day.date === today
              return (
                <div key={day.date} className="flex-1 flex flex-col justify-end" style={{ height: 44 }}>
                  <div
                    title={day.duration !== null ? `${formatDuration(day.duration)}` : 'Not logged'}
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      hours === 0 ? 'bg-slate-700' :
                      hours >= OPTIMAL_HOURS ? 'bg-indigo-500' :
                      hours >= 6 ? 'bg-indigo-400/60' : 'bg-indigo-300/30'
                    } ${isToday ? 'ring-1 ring-white/20' : ''}`}
                    style={{ height: barH }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-indigo-500" />
              <span className="text-[10px] text-slate-500">8h+ (optimal)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-indigo-400/60" />
              <span className="text-[10px] text-slate-500">6-8h</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-indigo-300/30" />
              <span className="text-[10px] text-slate-500">&lt;6h</span>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {Object.keys(entries).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Recent Entries
          </h3>
          <div className="space-y-2">
            {last7Days
              .filter(d => entries[d])
              .reverse()
              .map(date => {
                const e = entries[date]
                const isToday = date === today
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selectedDate === date
                        ? 'bg-indigo-900/30 border border-indigo-500/40'
                        : 'bg-slate-700/40 border border-slate-600/40 hover:border-slate-500'
                    }`}
                  >
                    <div className={`text-lg font-bold ${scoreColor(e.score)} min-w-[3rem] text-center`}
                      style={{ fontFamily: 'Orbitron, monospace' }}>
                      {e.score}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">
                          {isToday ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500">{formatDuration(e.durationMinutes)}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {e.bedtime} → {e.waketime}
                        {e.positiveFactors.length > 0 && (
                          <span className="text-green-400 ml-1">+{e.positiveFactors.length}</span>
                        )}
                        {e.negativeFactors.length > 0 && (
                          <span className="text-red-400 ml-1">-{e.negativeFactors.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBg(e.score)}`} style={{ width: `${e.score}%` }} />
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {Object.keys(entries).length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Moon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Log your first night's sleep to start tracking your patterns.</p>
        </div>
      )}
    </div>
  )
}
