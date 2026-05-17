import { useState, useEffect, useMemo } from 'react'
import { Activity, Plus, Check, Star, BarChart3, TrendingUp, Clock, Zap, Heart, X, Moon } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface RecoveryEntry {
  date: string
  muscleSoreness: number   // 1-10 (lower = better)
  fatigue: number          // 1-10 (lower = better)
  motivation: number       // 1-10 (higher = better)
  mood: number             // 1-10 (higher = better)
  sleepQuality: number     // 1-5 stars (higher = better)
  score: number            // 0-100
  activity: ActivityLevel | null
  notes: string
}

type ActivityLevel = 'Rest' | 'Light' | 'Moderate' | 'Intense' | 'Competition'

const ACTIVITY_LEVELS: ActivityLevel[] = ['Rest', 'Light', 'Moderate', 'Intense', 'Competition']

const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
  Rest:        '#64748b',
  Light:       '#22c55e',
  Moderate:    '#3b82f6',
  Intense:     '#f97316',
  Competition: '#ef4444',
}

const ACTIVITY_DOT_CLASS: Record<ActivityLevel, string> = {
  Rest:        'bg-slate-500',
  Light:       'bg-green-500',
  Moderate:    'bg-blue-500',
  Intense:     'bg-orange-500',
  Competition: 'bg-red-500',
}

function calcRecoveryScore(entry: Omit<RecoveryEntry, 'score' | 'activity' | 'notes' | 'date'>): number {
  // Invert soreness and fatigue (10 = bad, 1 = good → contribution is 10 - value)
  const sorenessScore  = (10 - entry.muscleSoreness) / 9  // 0–1
  const fatigueScore   = (10 - entry.fatigue) / 9          // 0–1
  const motivationScore = (entry.motivation - 1) / 9        // 0–1
  const moodScore       = (entry.mood - 1) / 9              // 0–1
  const sleepScore      = (entry.sleepQuality - 1) / 4      // 0–1

  // Weights: sleep 25%, fatigue 25%, soreness 20%, motivation 15%, mood 15%
  const raw = (
    sleepScore      * 0.25 +
    fatigueScore    * 0.25 +
    sorenessScore   * 0.20 +
    motivationScore * 0.15 +
    moodScore       * 0.15
  ) * 100

  return Math.min(100, Math.max(0, Math.round(raw)))
}

function getRecommendation(score: number): { label: string; color: string; detail: string } {
  if (score >= 85) return {
    label: 'Push Hard',
    color: 'text-green-400',
    detail: "You're fully recovered. Push intensity in today's session.",
  }
  if (score >= 70) return {
    label: 'Moderate Training',
    color: 'text-blue-400',
    detail: 'Good recovery. Standard training session is appropriate.',
  }
  if (score >= 50) return {
    label: 'Light Activity',
    color: 'text-yellow-400',
    detail: 'Partial recovery. Keep it light — walk, yoga, or easy swim.',
  }
  return {
    label: 'Full Rest Day',
    color: 'text-red-400',
    detail: 'Low recovery score. Prioritize rest, nutrition, and sleep tonight.',
  }
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-green-400'
  if (score >= 70) return 'text-blue-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getDateKey(date: string) {
  return `recovery_${date}`
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

interface SliderRowProps {
  label: string
  icon: React.ReactNode
  value: number
  min: number
  max: number
  lowLabel: string
  highLabel: string
  color: string
  onChange: (v: number) => void
}

function SliderRow({ label, icon, value, min, max, lowLabel, highLabel, color, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          {icon}
          {label}
        </div>
        <span className={`text-sm font-bold ${color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
          {value}/{max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
        style={{ accentColor: color.includes('red') ? '#ef4444' : color.includes('orange') ? '#f97316' : color.includes('yellow') ? '#eab308' : color.includes('green') ? '#22c55e' : '#8b5cf6' }}
      />
      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`transition-all hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-slate-600'}`}
        >
          <Star className="w-6 h-6" fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function RecoveryTracker() {
  const today = new Date().toISOString().split('T')[0]
  const { toastSuccess } = useToast()

  const [selectedDate, setSelectedDate] = useState(today)
  const [muscleSoreness, setMuscleSoreness] = useState(3)
  const [fatigue, setFatigue] = useState(3)
  const [motivation, setMotivation] = useState(7)
  const [mood, setMood] = useState(7)
  const [sleepQuality, setSleepQuality] = useState(3)
  const [activity, setActivity] = useState<ActivityLevel | null>(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState<Record<string, RecoveryEntry>>({})
  const [showActivityLog, setShowActivityLog] = useState(false)

  const last7Days = useMemo(() => getLast7Days(), [])

  useEffect(() => {
    const loaded: Record<string, RecoveryEntry> = {}
    for (const date of last7Days) {
      const raw = localStorage.getItem(getDateKey(date))
      if (raw) {
        try { loaded[date] = JSON.parse(raw) } catch { /* skip */ }
      }
    }
    setEntries(loaded)
  }, [last7Days])

  useEffect(() => {
    const raw = localStorage.getItem(getDateKey(selectedDate))
    if (raw) {
      try {
        const e: RecoveryEntry = JSON.parse(raw)
        setMuscleSoreness(e.muscleSoreness)
        setFatigue(e.fatigue)
        setMotivation(e.motivation)
        setMood(e.mood)
        setSleepQuality(e.sleepQuality)
        setActivity(e.activity)
        setNotes(e.notes || '')
        setSaved(true)
        setShowActivityLog(!!e.activity)
      } catch {
        resetForm()
      }
    } else {
      resetForm()
    }
  }, [selectedDate])

  function resetForm() {
    setMuscleSoreness(3)
    setFatigue(3)
    setMotivation(7)
    setMood(7)
    setSleepQuality(3)
    setActivity(null)
    setNotes('')
    setSaved(false)
    setShowActivityLog(false)
  }

  const score = calcRecoveryScore({ muscleSoreness, fatigue, motivation, mood, sleepQuality })
  const rec = getRecommendation(score)

  function saveEntry() {
    const entry: RecoveryEntry = {
      date: selectedDate,
      muscleSoreness,
      fatigue,
      motivation,
      mood,
      sleepQuality,
      score,
      activity,
      notes,
    }
    localStorage.setItem(getDateKey(selectedDate), JSON.stringify(entry))
    setEntries(prev => ({ ...prev, [selectedDate]: entry }))
    setSaved(true)
    setShowActivityLog(true)
    toastSuccess('Recovery logged!', `Score: ${score}/100 · ${rec.label}`)
  }

  function logActivity(level: ActivityLevel) {
    setActivity(level)
    setSaved(false)
    const existing = localStorage.getItem(getDateKey(selectedDate))
    if (existing) {
      try {
        const e: RecoveryEntry = JSON.parse(existing)
        e.activity = level
        localStorage.setItem(getDateKey(selectedDate), JSON.stringify(e))
        setEntries(prev => ({ ...prev, [selectedDate]: e }))
      } catch { /* skip */ }
    }
    toastSuccess(`Activity logged: ${level}`)
  }

  // 7-day trend data
  const trendData = last7Days.map(date => ({
    date,
    entry: entries[date] ?? null,
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
  }))

  const validScores = trendData.filter(d => d.entry).map(d => d.entry!.score)
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null

  // Training load: count of non-rest days in past 7
  const trainingDays = Object.values(entries).filter(e => e.activity && e.activity !== 'Rest').length
  const intenseDays = Object.values(entries).filter(e => e.activity === 'Intense' || e.activity === 'Competition').length

  function trainingLoadLabel(): string {
    if (intenseDays >= 4) return 'Overreaching — reduce intensity'
    if (trainingDays >= 6) return 'High load — monitor recovery closely'
    if (trainingDays >= 4) return 'Moderate load — sustainable'
    if (trainingDays >= 2) return 'Light load — room to increase'
    return 'Very low load — consider adding sessions'
  }

  function trainingLoadColor(): string {
    if (intenseDays >= 4) return 'text-red-400'
    if (trainingDays >= 6) return 'text-orange-400'
    if (trainingDays >= 4) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-7 h-7 text-cyan-400" />
          Recovery Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Monitor readiness and optimize your training schedule</p>
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

      {/* Inputs */}
      <div className="game-card p-5 space-y-5">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Daily Check-In
        </h3>

        <SliderRow
          label="Muscle Soreness"
          icon={<Activity className="w-4 h-4 text-orange-400" />}
          value={muscleSoreness}
          min={1} max={10}
          lowLabel="None (1)"
          highLabel="Extreme (10)"
          color="text-orange-400"
          onChange={v => { setMuscleSoreness(v); setSaved(false) }}
        />

        <SliderRow
          label="Fatigue Level"
          icon={<Moon className="w-4 h-4 text-indigo-400" />}
          value={fatigue}
          min={1} max={10}
          lowLabel="Energized (1)"
          highLabel="Exhausted (10)"
          color="text-indigo-400"
          onChange={v => { setFatigue(v); setSaved(false) }}
        />

        <SliderRow
          label="Motivation"
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          value={motivation}
          min={1} max={10}
          lowLabel="None (1)"
          highLabel="Fired up (10)"
          color="text-yellow-400"
          onChange={v => { setMotivation(v); setSaved(false) }}
        />

        <SliderRow
          label="Mood"
          icon={<Heart className="w-4 h-4 text-pink-400" />}
          value={mood}
          min={1} max={10}
          lowLabel="Poor (1)"
          highLabel="Great (10)"
          color="text-pink-400"
          onChange={v => { setMood(v); setSaved(false) }}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Star className="w-4 h-4 text-yellow-400" />
              Sleep Quality Last Night
            </div>
            <span className="text-xs text-slate-500">{sleepQuality}/5 stars</span>
          </div>
          <StarRating value={sleepQuality} onChange={v => { setSleepQuality(v); setSaved(false) }} />
        </div>
      </div>

      {/* Live Score */}
      <div className={`game-card p-5 border ${score >= 85 ? 'border-green-500/30' : score >= 70 ? 'border-blue-500/30' : score >= 50 ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-200">Recovery Score</h3>
          {avgScore !== null && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              avgScore >= 85 ? 'bg-green-900/40 text-green-400' :
              avgScore >= 70 ? 'bg-blue-900/40 text-blue-400' :
              avgScore >= 50 ? 'bg-yellow-900/40 text-yellow-400' :
              'bg-red-900/40 text-red-400'
            }`}>
              7-day avg: {avgScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mb-3">
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
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-lg px-4 py-3 ${
          score >= 85 ? 'bg-green-900/20 border border-green-500/30' :
          score >= 70 ? 'bg-blue-900/20 border border-blue-500/30' :
          score >= 50 ? 'bg-yellow-900/20 border border-yellow-500/30' :
          'bg-red-900/20 border border-red-500/30'
        }`}>
          <div className={`font-bold text-sm ${rec.color} flex items-center gap-2`}>
            <TrendingUp className="w-4 h-4" />
            Recommendation: {rec.label}
          </div>
          <p className="text-xs text-slate-400 mt-1">{rec.detail}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="game-card p-5">
        <label className="block text-sm font-semibold text-slate-300 mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setSaved(false) }}
          rows={2}
          placeholder="Any aches, stressors, or observations..."
          className="game-input w-full resize-none text-sm"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={saveEntry}
        className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] shadow-lg shadow-cyan-500/20"
      >
        <Plus className="w-5 h-5" />
        {saved ? 'Update Recovery Entry' : 'Log Recovery Check-In'}
      </button>

      {/* Activity Logger */}
      {(showActivityLog || saved) && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Log Today's Activity
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Based on your score ({score}/100), we recommend: <span className={`font-semibold ${rec.color}`}>{rec.label}</span>
          </p>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_LEVELS.map(level => {
              const isSelected = activity === level
              return (
                <button
                  key={level}
                  onClick={() => logActivity(level)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'border-transparent scale-105'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                  }`}
                  style={isSelected ? { backgroundColor: ACTIVITY_COLORS[level] + '30', borderColor: ACTIVITY_COLORS[level] + '80', color: ACTIVITY_COLORS[level] } : {}}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ACTIVITY_COLORS[level] }}
                  />
                  <span className={isSelected ? '' : 'text-slate-400'}>{level}</span>
                  {isSelected && <Check className="w-3 h-3" style={{ color: ACTIVITY_COLORS[level] }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 7-Day Trend */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          7-Day Recovery Trend
        </h3>
        <div className="flex items-end gap-2 h-32">
          {trendData.map(day => {
            const hasData = !!day.entry
            const s = day.entry?.score ?? 0
            const barHeight = hasData ? Math.max(4, (s / 100) * 112) : 4
            const isToday = day.date === today
            const act = day.entry?.activity ?? null
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                {hasData && (
                  <span className={`text-[10px] font-semibold ${scoreColor(s)}`}>{s}</span>
                )}
                <div className="w-full flex flex-col justify-end relative" style={{ height: 112 }}>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      !hasData ? 'bg-slate-700' :
                      s >= 85 ? 'bg-green-500' :
                      s >= 70 ? 'bg-blue-500' :
                      s >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    } ${isToday ? 'ring-1 ring-white/30' : ''}`}
                    style={{ height: barHeight }}
                  />
                  {act && (
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-slate-900"
                      style={{ backgroundColor: ACTIVITY_COLORS[act] }}
                      title={act}
                    />
                  )}
                </div>
                <span className={`text-[10px] ${isToday ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
        {/* Activity legend */}
        <div className="flex flex-wrap gap-3 mt-3 border-t border-slate-700 pt-3">
          {ACTIVITY_LEVELS.map(level => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[level] }} />
              <span className="text-[10px] text-slate-500">{level}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-600 ml-auto">Dots = activity logged</span>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Weekly Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-700/40 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${avgScore !== null ? scoreColor(avgScore) : 'text-slate-500'}`}
              style={{ fontFamily: 'Orbitron, monospace' }}>
              {avgScore ?? '—'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Recovery Score</div>
          </div>
          <div className="bg-slate-700/40 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {trainingDays}/7
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Active Days</div>
          </div>
        </div>

        {/* Training load bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Training Load</span>
            <span className={`font-semibold ${trainingLoadColor()}`}>{trainingLoadLabel()}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                intenseDays >= 4 ? 'bg-red-500' :
                trainingDays >= 6 ? 'bg-orange-500' :
                trainingDays >= 4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (trainingDays / 7) * 100)}%` }}
            />
          </div>
        </div>

        {/* Activity breakdown */}
        {Object.keys(entries).length > 0 && (
          <div className="mt-4 space-y-1.5">
            {ACTIVITY_LEVELS.map(level => {
              const count = Object.values(entries).filter(e => e.activity === level).length
              if (count === 0) return null
              return (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACTIVITY_COLORS[level] }} />
                  <span className="text-xs text-slate-400 w-24">{level}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / 7) * 100}%`, backgroundColor: ACTIVITY_COLORS[level] }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History List */}
      {Object.keys(entries).length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Recent Entries
          </h3>
          <div className="space-y-2">
            {last7Days
              .filter(d => entries[d])
              .reverse()
              .map(date => {
                const e = entries[date]
                const isToday = date === today
                const r = getRecommendation(e.score)
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selectedDate === date
                        ? 'bg-cyan-900/20 border border-cyan-500/30'
                        : 'bg-slate-700/40 border border-slate-600/40 hover:border-slate-500'
                    }`}
                  >
                    <div className={`text-lg font-bold ${scoreColor(e.score)} min-w-[3rem] text-center`}
                      style={{ fontFamily: 'Orbitron, monospace' }}>
                      {e.score}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-300">
                          {isToday ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {e.activity && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: ACTIVITY_COLORS[e.activity] + '25', color: ACTIVITY_COLORS[e.activity] }}
                          >
                            {e.activity}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{r.label}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} className={`w-2.5 h-2.5 ${n <= e.sleepQuality ? 'text-yellow-400' : 'text-slate-600'}`} fill={n <= e.sleepQuality ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg(e.score)}`} style={{ width: `${e.score}%` }} />
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {Object.keys(entries).length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Log your first recovery check-in to start monitoring readiness.</p>
        </div>
      )}
    </div>
  )
}
