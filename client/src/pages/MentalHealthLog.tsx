import { useState, useEffect, useCallback } from 'react'
import {
  Brain, Heart, Plus, BarChart3, TrendingUp, Star, Check, X, Sparkles,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyMentalLog {
  date: string
  mood: number           // 1–10
  anxiety: number        // 1–10
  energy: number         // 1–10
  socialBattery: number  // 1–10
  triggers: string[]
  copingStrategies: string[]
  gratitude: [string, string, string]
  notes: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = (date: string) => `mental_health_${date}`

const TRIGGER_OPTIONS = [
  'Work stress',
  'Sleep issues',
  'Exercise',
  'Social interaction',
  'News/media',
  'Relationships',
  'Finances',
  'Weather',
  'Positive event',
]

const COPING_OPTIONS = [
  'Exercise',
  'Journaling',
  'Meditation',
  'Social connection',
  'Nature walk',
  'Creative outlet',
  'Rest',
  'Therapy',
  'Other',
]

const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#fb923c', 4: '#fbbf24', 5: '#facc15',
  6: '#a3e635', 7: '#4ade80', 8: '#34d399', 9: '#2dd4bf', 10: '#38bdf8',
}

function getMoodColor(val: number): string {
  const clamped = Math.round(Math.min(10, Math.max(1, val)))
  return MOOD_COLORS[clamped] ?? '#94a3b8'
}

function getMoodEmoji(val: number): string {
  if (val <= 2) return '😔'
  if (val <= 4) return '😐'
  if (val <= 6) return '🙂'
  if (val <= 8) return '😊'
  return '🤩'
}

const today = () => new Date().toISOString().split('T')[0]

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function loadLog(date: string): DailyMentalLog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(date))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveLog(log: DailyMentalLog) {
  localStorage.setItem(STORAGE_KEY(log.date), JSON.stringify(log))
}

// ─── Slider ──────────────────────────────────────────────────────────────────

function MetricSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  lowLabel?: string
  highLabel?: string
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="font-bold text-lg" style={{ color }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${(value - 1) * 11.1}%, #334155 ${(value - 1) * 11.1}%)`,
        }}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{lowLabel ?? '1'}</span>
          <span>{highLabel ?? '10'}</span>
        </div>
      )}
    </div>
  )
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────

function MoodBarChart({
  values,
  labels,
}: {
  values: (number | null)[]
  labels: string[]
}) {
  return (
    <div className="flex items-end gap-1 h-20">
      {values.map((v, i) => {
        const pct = v !== null ? (v / 10) * 100 : 0
        const color = v !== null ? getMoodColor(v) : undefined
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <div
              title={v !== null ? `Mood: ${v}/10` : 'No data'}
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${Math.max(pct, v !== null ? 8 : 0)}%`,
                backgroundColor: color ?? '#1e293b',
                minHeight: v !== null ? '6px' : '0',
              }}
            />
            <span className="text-slate-500" style={{ fontSize: '9px' }}>
              {labels[i]?.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MentalHealthLog() {
  const { toastSuccess } = useToast()
  const [selectedDate, setSelectedDate] = useState(today())
  const [saved, setSaved] = useState(false)

  // Mood metrics
  const [mood, setMood] = useState(5)
  const [anxiety, setAnxiety] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [socialBattery, setSocialBattery] = useState(5)

  // Triggers
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [customTrigger, setCustomTrigger] = useState('')

  // Coping
  const [selectedCoping, setSelectedCoping] = useState<string[]>([])

  // Gratitude
  const [gratitude, setGratitude] = useState<[string, string, string]>(['', '', ''])

  // Notes
  const [notes, setNotes] = useState('')

  // Week logs
  const days = getLast7Days()
  const [weekLogs, setWeekLogs] = useState<(DailyMentalLog | null)[]>([])

  const loadDate = useCallback((date: string) => {
    const log = loadLog(date)
    if (log) {
      setMood(log.mood)
      setAnxiety(log.anxiety)
      setEnergy(log.energy)
      setSocialBattery(log.socialBattery)
      setSelectedTriggers(log.triggers)
      setSelectedCoping(log.copingStrategies)
      setGratitude(log.gratitude)
      setNotes(log.notes ?? '')
    } else {
      setMood(5)
      setAnxiety(5)
      setEnergy(5)
      setSocialBattery(5)
      setSelectedTriggers([])
      setSelectedCoping([])
      setGratitude(['', '', ''])
      setNotes('')
    }
  }, [])

  useEffect(() => {
    loadDate(selectedDate)
    setWeekLogs(days.map(d => loadLog(d)))
  }, [selectedDate, saved]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const triggers = customTrigger.trim()
      ? [...selectedTriggers, customTrigger.trim()]
      : selectedTriggers

    const log: DailyMentalLog = {
      date: selectedDate,
      mood,
      anxiety,
      energy,
      socialBattery,
      triggers,
      copingStrategies: selectedCoping,
      gratitude,
      notes,
    }
    saveLog(log)
    setCustomTrigger('')
    setSaved(s => !s)
    toastSuccess('Check-in saved!', `Mood: ${mood}/10`)
  }

  const toggleTrigger = (t: string) => {
    setSelectedTriggers(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  const toggleCoping = (c: string) => {
    setSelectedCoping(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const setGratitudeItem = (i: 0 | 1 | 2, val: string) => {
    setGratitude(prev => {
      const next = [...prev] as [string, string, string]
      next[i] = val
      return next
    })
  }

  // Pattern insights
  const logsWithData = weekLogs.filter((l): l is DailyMentalLog => l !== null)
  const avgAnxiety =
    logsWithData.length
      ? Math.round(
          (logsWithData.reduce((s, l) => s + l.anxiety, 0) / logsWithData.length) * 10
        ) / 10
      : null
  const avgMood =
    logsWithData.length
      ? Math.round(
          (logsWithData.reduce((s, l) => s + l.mood, 0) / logsWithData.length) * 10
        ) / 10
      : null
  const highAnxietyAlert = avgAnxiety !== null && avgAnxiety > 7
  const lowMoodAlert = avgMood !== null && avgMood < 4

  const moodWeek = days.map(d => {
    const log = weekLogs[days.indexOf(d)]
    return log?.mood ?? null
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-400" />
            Mental Health Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Daily check-in for mind & mood</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={today()}
          onChange={e => setSelectedDate(e.target.value)}
          className="game-input text-sm"
        />
      </div>

      {/* Pattern Insights */}
      {(highAnxietyAlert || lowMoodAlert) && (
        <div className="game-card p-4 border-yellow-500/30 bg-yellow-900/10 space-y-1">
          <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" /> Pattern Insight
          </div>
          {highAnxietyAlert && (
            <p className="text-slate-300 text-sm">
              Your average anxiety this week is <strong>{avgAnxiety}/10</strong>. Try a 5-minute
              breathing exercise or a short walk to reset your nervous system.
            </p>
          )}
          {lowMoodAlert && (
            <p className="text-slate-300 text-sm">
              Your average mood is <strong>{avgMood}/10</strong> this week. Consider reaching out
              to someone you trust or scheduling something you enjoy.
            </p>
          )}
        </div>
      )}

      {/* 7-Day Mood Trend */}
      <div className="game-card p-5 space-y-3">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" /> 7-Day Mood Trend
        </h2>
        <MoodBarChart values={moodWeek} labels={days} />
        {avgMood !== null && (
          <div className="text-sm text-slate-400">
            7-day average:{' '}
            <span className="font-bold" style={{ color: getMoodColor(Math.round(avgMood)) }}>
              {avgMood}/10 {getMoodEmoji(avgMood)}
            </span>
          </div>
        )}
      </div>

      {/* Daily Mood Metrics */}
      <div className="game-card p-5 space-y-5">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          How are you feeling{' '}
          <span className="text-violet-400">
            {selectedDate === today() ? 'today' : selectedDate}
          </span>
          ?
        </h2>

        <MetricSlider
          label={`Overall Mood ${getMoodEmoji(mood)}`}
          value={mood}
          onChange={setMood}
          lowLabel="Very low"
          highLabel="Amazing"
          color={getMoodColor(mood)}
        />
        <MetricSlider
          label="Anxiety Level"
          value={anxiety}
          onChange={setAnxiety}
          lowLabel="Calm"
          highLabel="Very anxious"
          color={anxiety > 6 ? '#f87171' : anxiety > 4 ? '#fbbf24' : '#4ade80'}
        />
        <MetricSlider
          label="Energy"
          value={energy}
          onChange={setEnergy}
          lowLabel="Exhausted"
          highLabel="Energized"
          color={energy > 6 ? '#34d399' : energy > 4 ? '#facc15' : '#f87171'}
        />
        <MetricSlider
          label="Social Battery"
          value={socialBattery}
          onChange={setSocialBattery}
          lowLabel="Drained"
          highLabel="Fully charged"
          color={socialBattery > 6 ? '#60a5fa' : socialBattery > 4 ? '#a78bfa' : '#f87171'}
        />
      </div>

      {/* Trigger Log */}
      <div className="game-card p-5 space-y-4">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-400" /> What affected your mood today?
        </h2>
        <div className="flex flex-wrap gap-2">
          {TRIGGER_OPTIONS.map(t => {
            const active = selectedTriggers.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTrigger(t)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all font-medium ${
                  active
                    ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {active && <Check className="w-3 h-3 inline mr-1" />}
                {t}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTrigger}
            onChange={e => setCustomTrigger(e.target.value)}
            placeholder="Add custom trigger..."
            className="game-input flex-1 text-sm"
          />
          {customTrigger && (
            <button
              onClick={() => setCustomTrigger('')}
              className="p-2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {selectedTriggers.length > 0 && (
          <div className="text-xs text-slate-500">
            Selected: {selectedTriggers.join(', ')}
            {customTrigger.trim() && `, ${customTrigger.trim()}`}
          </div>
        )}
      </div>

      {/* Coping Strategies */}
      <div className="game-card p-5 space-y-4">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Brain className="w-4 h-4 text-teal-400" /> Coping strategies used today
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COPING_OPTIONS.map(c => {
            const active = selectedCoping.includes(c)
            return (
              <button
                key={c}
                onClick={() => toggleCoping(c)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                  active
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                    active ? 'bg-teal-500 border-teal-400' : 'border-slate-600'
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-white" />}
                </div>
                {c}
              </button>
            )
          })}
        </div>
        {selectedCoping.length > 0 && (
          <div className="text-xs text-slate-500">
            {selectedCoping.length} strateg{selectedCoping.length === 1 ? 'y' : 'ies'} used
          </div>
        )}
      </div>

      {/* Gratitude */}
      <div className="game-card p-5 space-y-4">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" /> Gratitude (up to 3)
        </h2>
        <div className="space-y-2">
          {([0, 1, 2] as (0 | 1 | 2)[]).map(i => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-yellow-400 text-sm font-bold w-5">{i + 1}.</span>
              <input
                type="text"
                value={gratitude[i]}
                onChange={e => setGratitudeItem(i, e.target.value)}
                placeholder={
                  i === 0
                    ? 'I am grateful for...'
                    : i === 1
                    ? 'Something that made me smile...'
                    : 'A small win today...'
                }
                className="game-input flex-1 text-sm"
              />
            </div>
          ))}
        </div>
        {gratitude.filter(g => g.trim()).length > 0 && (
          <div className="text-xs text-slate-500">
            {gratitude.filter(g => g.trim()).length} gratitude entr
            {gratitude.filter(g => g.trim()).length === 1 ? 'y' : 'ies'} logged
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="game-card p-5 space-y-3">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-400" /> Additional notes (optional)
        </h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything else on your mind today..."
          rows={3}
          className="game-input w-full resize-none text-sm"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="game-btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
      >
        <Check className="w-5 h-5" /> Save Check-in
      </button>

      {/* Weekly Summary Cards */}
      {logsWithData.length > 0 && (
        <div className="game-card p-5 space-y-4">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> Weekly Snapshot
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Avg Mood',
                val: avgMood,
                color: avgMood ? getMoodColor(Math.round(avgMood)) : '#94a3b8',
                icon: Heart,
              },
              {
                label: 'Avg Anxiety',
                val: avgAnxiety,
                color: avgAnxiety && avgAnxiety > 6 ? '#f87171' : '#4ade80',
                icon: Brain,
              },
              {
                label: 'Avg Energy',
                val:
                  logsWithData.length
                    ? Math.round(
                        (logsWithData.reduce((s, l) => s + l.energy, 0) /
                          logsWithData.length) *
                          10
                      ) / 10
                    : null,
                color: '#34d399',
                icon: TrendingUp,
              },
              {
                label: 'Social Battery',
                val:
                  logsWithData.length
                    ? Math.round(
                        (logsWithData.reduce((s, l) => s + l.socialBattery, 0) /
                          logsWithData.length) *
                          10
                      ) / 10
                    : null,
                color: '#60a5fa',
                icon: Star,
              },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-xs text-slate-400">{label}</div>
                <div className="text-xl font-bold" style={{ color }}>
                  {val !== null ? `${val}` : '—'}
                  {val !== null && <span className="text-xs text-slate-400">/10</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Top triggers this week */}
          {(() => {
            const triggerCounts: Record<string, number> = {}
            logsWithData.forEach(l =>
              l.triggers.forEach(t => {
                triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
              })
            )
            const sorted = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
            if (!sorted.length) return null
            return (
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">Top triggers this week</div>
                <div className="flex flex-wrap gap-2">
                  {sorted.map(([t, count]) => (
                    <span
                      key={t}
                      className="px-2 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300"
                    >
                      {t} ({count}x)
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Most used coping strategies */}
          {(() => {
            const copingCounts: Record<string, number> = {}
            logsWithData.forEach(l =>
              l.copingStrategies.forEach(c => {
                copingCounts[c] = (copingCounts[c] ?? 0) + 1
              })
            )
            const sorted = Object.entries(copingCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
            if (!sorted.length) return null
            return (
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">Most used coping strategies</div>
                <div className="flex flex-wrap gap-2">
                  {sorted.map(([c, count]) => (
                    <span
                      key={c}
                      className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-xs text-teal-300"
                    >
                      {c} ({count}x)
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
