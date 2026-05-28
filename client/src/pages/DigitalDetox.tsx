import { useEffect, useState, useRef } from 'react'
import { Moon, Plus, Trash2, Check, Clock, Zap, Shield, Eye, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DetoxType = 'Full Detox' | 'Social Media Only' | 'Work Apps Only' | 'Entertainment Only' | 'Custom'
type Difficulty = 1 | 2 | 3 | 4 | 5

interface DetoxSession {
  id: string
  date: string
  startTime: string
  endTime: string
  detoxType: DetoxType
  customRules: string
  intention: string
  completed: boolean
  actualDurationMinutes: number | null
  difficulty: Difficulty | null
  noticed: string
  benefitFelt: string
}

const DETOX_TYPES: DetoxType[] = [
  'Full Detox',
  'Social Media Only',
  'Work Apps Only',
  'Entertainment Only',
  'Custom',
]

const DETOX_TYPE_COLORS: Record<DetoxType, string> = {
  'Full Detox': 'text-violet-400 bg-violet-900/20 border-violet-500/30',
  'Social Media Only': 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  'Work Apps Only': 'text-orange-400 bg-orange-900/20 border-orange-500/30',
  'Entertainment Only': 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  'Custom': 'text-green-400 bg-green-900/20 border-green-500/30',
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Manageable',
  3: 'Moderate',
  4: 'Hard',
  5: 'Very Hard',
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'text-green-400',
  2: 'text-lime-400',
  3: 'text-yellow-400',
  4: 'text-orange-400',
  5: 'text-red-400',
}

interface QuickPreset {
  label: string
  startTime: string
  endTime: string
  detoxType: DetoxType
  intention: string
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    label: '1hr Focus',
    startTime: '09:00',
    endTime: '10:00',
    detoxType: 'Work Apps Only',
    intention: 'Deep focused work with no digital distractions.',
  },
  {
    label: 'Evening No-phone',
    startTime: '20:00',
    endTime: '23:00',
    detoxType: 'Full Detox',
    intention: 'Wind down and be present with family or self.',
  },
  {
    label: 'Morning Clarity',
    startTime: '06:00',
    endTime: '08:00',
    detoxType: 'Social Media Only',
    intention: 'Start the day with clarity, not comparison.',
  },
  {
    label: 'Full Day',
    startTime: '07:00',
    endTime: '22:00',
    detoxType: 'Full Detox',
    intention: 'Reset my relationship with technology for one full day.',
  },
]

const STORAGE_KEY = 'digital_detox'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToDuration(mins: number): string {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function scheduledDuration(session: DetoxSession): number {
  const start = timeToMinutes(session.startTime)
  const end = timeToMinutes(session.endTime)
  return end > start ? end - start : 0
}

function getCountdown(date: string, endTime: string): string {
  const now = new Date()
  const end = new Date(`${date}T${endTime}:00`)
  const diffMs = end.getTime() - now.getTime()
  if (diffMs <= 0) return 'Ended'
  const totalMins = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m remaining`
  return `${h}h ${m}m remaining`
}

function isActiveNow(session: DetoxSession): boolean {
  const today = todayStr()
  if (session.date !== today) return false
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const start = timeToMinutes(session.startTime)
  const end = timeToMinutes(session.endTime)
  return nowMins >= start && nowMins < end
}

function isScheduledToday(session: DetoxSession): boolean {
  return session.date === todayStr() && !session.completed
}

function calcStreak(sessions: DetoxSession[]): number {
  const completed = sessions.filter(s => s.completed)
  if (completed.length === 0) return 0
  const days = new Set(completed.map(s => s.date))
  const sorted = Array.from(days).sort().reverse()
  let streak = 0
  let cursor = new Date()
  for (const day of sorted) {
    const expected = cursor.toISOString().split('T')[0]
    if (day === expected) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export default function DigitalDetox() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<DetoxSession[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showLogModal, setShowLogModal] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const blankSchedule = (): Omit<DetoxSession, 'id' | 'completed' | 'actualDurationMinutes' | 'difficulty' | 'noticed' | 'benefitFelt'> => ({
    date: todayStr(),
    startTime: '09:00',
    endTime: '10:00',
    detoxType: 'Full Detox',
    customRules: '',
    intention: '',
  })

  const [scheduleForm, setScheduleForm] = useState(blankSchedule())

  const [logForm, setLogForm] = useState<{
    actualDurationMinutes: number
    difficulty: Difficulty
    noticed: string
    benefitFelt: string
  }>({
    actualDurationMinutes: 60,
    difficulty: 3,
    noticed: '',
    benefitFelt: '',
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSessions(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Countdown timer for active session
  const activeSession = sessions.find(s => isActiveNow(s))
  useEffect(() => {
    if (activeSession) {
      const update = () => setCountdown(getCountdown(activeSession.date, activeSession.endTime))
      update()
      intervalRef.current = setInterval(update, 60000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeSession?.id])

  const persist = (updated: DetoxSession[]) => {
    setSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const scheduleSession = () => {
    if (!scheduleForm.startTime || !scheduleForm.endTime) return
    const session: DetoxSession = {
      id: Date.now().toString(),
      completed: false,
      actualDurationMinutes: null,
      difficulty: null,
      noticed: '',
      benefitFelt: '',
      ...scheduleForm,
    }
    persist([session, ...sessions])
    setScheduleForm(blankSchedule())
    setShowScheduleForm(false)
    toastSuccess('Detox session scheduled.', `${session.detoxType} on ${session.date}`)
  }

  const applyPreset = (preset: QuickPreset) => {
    setScheduleForm(f => ({
      ...f,
      startTime: preset.startTime,
      endTime: preset.endTime,
      detoxType: preset.detoxType,
      intention: preset.intention,
      date: todayStr(),
    }))
    setShowScheduleForm(true)
  }

  const openLogModal = (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) return
    setLogForm({
      actualDurationMinutes: session.actualDurationMinutes ?? scheduledDuration(session),
      difficulty: session.difficulty ?? 3,
      noticed: session.noticed ?? '',
      benefitFelt: session.benefitFelt ?? '',
    })
    setShowLogModal(id)
  }

  const saveLog = () => {
    if (!showLogModal) return
    const updated = sessions.map(s =>
      s.id === showLogModal
        ? {
            ...s,
            completed: true,
            actualDurationMinutes: logForm.actualDurationMinutes,
            difficulty: logForm.difficulty,
            noticed: logForm.noticed,
            benefitFelt: logForm.benefitFelt,
          }
        : s
    )
    persist(updated)
    setShowLogModal(null)
    toastSuccess('Detox logged.', 'Great job staying offline!')
  }

  const deleteSession = (id: string) => {
    persist(sessions.filter(s => s.id !== id))
    toastSuccess('Session removed.')
  }

  // Stats
  const completed = sessions.filter(s => s.completed)
  const totalDetoxHours = +(completed.reduce((sum, s) => sum + (s.actualDurationMinutes ?? 0), 0) / 60).toFixed(1)
  const avgDifficulty =
    completed.filter(s => s.difficulty).length > 0
      ? +(completed.reduce((sum, s) => sum + (s.difficulty ?? 0), 0) / completed.filter(s => s.difficulty).length).toFixed(1)
      : 0
  const longestDetox = completed.length > 0
    ? Math.max(...completed.map(s => s.actualDurationMinutes ?? 0))
    : 0
  const streak = calcStreak(sessions)

  const todaySessions = sessions.filter(s => isScheduledToday(s))
  const pastSessions = sessions.filter(s => s.completed || (!isScheduledToday(s) && s.date < todayStr()))
  const sortedPast = [...pastSessions].sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Moon className="w-7 h-7 text-violet-400" />
            Digital Detox
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Reclaim your attention. Schedule and track offline time.</p>
        </div>
        <button
          onClick={() => setShowScheduleForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{totalDetoxHours}h</div>
          <div className="text-xs text-slate-500">Total Hours</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{completed.length}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className={`text-xl font-bold ${avgDifficulty > 0 ? DIFFICULTY_COLORS[Math.round(avgDifficulty)] : 'text-slate-500'}`}>
            {avgDifficulty > 0 ? avgDifficulty.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Difficulty</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {longestDetox > 0 ? minutesToDuration(longestDetox) : '—'}
          </div>
          <div className="text-xs text-slate-500">Longest Detox</div>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="game-card p-4 flex items-center gap-3 border border-orange-500/20 bg-orange-900/10">
          <Zap className="w-6 h-6 text-orange-400" />
          <div>
            <div className="font-bold text-orange-400 text-lg">{streak}-day streak</div>
            <div className="text-xs text-slate-500">You've had at least one detox session every day.</div>
          </div>
        </div>
      )}

      {/* Active Detox Banner */}
      {activeSession && (
        <div className="game-card p-5 border border-violet-500/40 bg-gradient-to-br from-violet-900/30 to-slate-900">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-violet-300">Active Detox in Progress</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">
            {activeSession.detoxType} · {activeSession.startTime}–{activeSession.endTime}
          </p>
          {activeSession.intention && (
            <p className="text-xs text-slate-500 italic mb-3">"{activeSession.intention}"</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 font-semibold text-sm">{countdown}</span>
            </div>
            <button
              onClick={() => openLogModal(activeSession.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Quick Presets</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="game-card p-3 text-left hover:border-violet-500/40 hover:bg-violet-900/10 transition-all group"
            >
              <div className="font-semibold text-sm text-slate-200 group-hover:text-violet-300 transition-colors">
                {preset.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{preset.startTime}–{preset.endTime}</div>
              <div className="text-xs text-slate-600 mt-0.5">{preset.detoxType}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <div className="game-card p-5 space-y-4 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Moon className="w-4 h-4 text-violet-400" />
              Schedule Detox Session
            </h3>
            <button onClick={() => setShowScheduleForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Date</label>
              <input
                type="date"
                className="game-input w-full"
                value={scheduleForm.date}
                onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
              <input
                type="time"
                className="game-input w-full"
                value={scheduleForm.startTime}
                onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End Time</label>
              <input
                type="time"
                className="game-input w-full"
                value={scheduleForm.endTime}
                onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Detox Type */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Detox Type</label>
            <div className="flex flex-wrap gap-2">
              {DETOX_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setScheduleForm(f => ({ ...f, detoxType: type }))}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    scheduleForm.detoxType === type
                      ? DETOX_TYPE_COLORS[type]
                      : 'text-slate-500 bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Rules */}
          {scheduleForm.detoxType === 'Custom' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Custom Rules</label>
              <input
                className="game-input w-full"
                placeholder="e.g. No YouTube, no Reddit, allowed: Maps and Spotify"
                value={scheduleForm.customRules}
                onChange={e => setScheduleForm(f => ({ ...f, customRules: e.target.value }))}
              />
            </div>
          )}

          {/* Intention */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Intention (why are you doing this?)</label>
            <input
              className="game-input w-full"
              placeholder="e.g. Be present with family, reduce anxiety, get deep work done"
              value={scheduleForm.intention}
              onChange={e => setScheduleForm(f => ({ ...f, intention: e.target.value }))}
            />
          </div>

          {/* Duration preview */}
          {scheduleForm.startTime && scheduleForm.endTime && (
            <div className="text-xs text-slate-500">
              Duration: <span className="text-violet-400 font-semibold">
                {minutesToDuration(
                  Math.max(0, timeToMinutes(scheduleForm.endTime) - timeToMinutes(scheduleForm.startTime))
                )}
              </span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowScheduleForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={scheduleSession}
              disabled={!scheduleForm.startTime || !scheduleForm.endTime}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Check className="w-4 h-4" /> Schedule
            </button>
          </div>
        </div>
      )}

      {/* Log Completion Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="game-card p-6 space-y-4 w-full max-w-md border border-green-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-400" />
                Log Detox Completion
              </h3>
              <button onClick={() => setShowLogModal(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actual Duration */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Actual Duration (minutes): <span className="text-green-400 font-semibold">{minutesToDuration(logForm.actualDurationMinutes)}</span>
              </label>
              <input
                type="range"
                min={5}
                max={720}
                step={5}
                value={logForm.actualDurationMinutes}
                onChange={e => setLogForm(f => ({ ...f, actualDurationMinutes: +e.target.value }))}
                className="w-full accent-green-400"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>5m</span><span>12h</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">
                Difficulty: <span className={`font-semibold ${DIFFICULTY_COLORS[logForm.difficulty]}`}>{logForm.difficulty}/5 — {DIFFICULTY_LABELS[logForm.difficulty]}</span>
              </label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setLogForm(f => ({ ...f, difficulty: d }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${
                      logForm.difficulty === d
                        ? `${DIFFICULTY_COLORS[d]} bg-slate-800 border-current`
                        : 'text-slate-600 bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* What you noticed */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">What did you notice during the detox?</label>
              <textarea
                className="game-input w-full resize-none"
                rows={3}
                placeholder="Urges, feelings, observations about yourself or your surroundings..."
                value={logForm.noticed}
                onChange={e => setLogForm(f => ({ ...f, noticed: e.target.value }))}
              />
            </div>

            {/* Benefit felt */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Benefit felt?</label>
              <input
                className="game-input w-full"
                placeholder="e.g. Calmer, more focused, slept better, more present"
                value={logForm.benefitFelt}
                onChange={e => setLogForm(f => ({ ...f, benefitFelt: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowLogModal(null)}
                className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLog}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Check className="w-4 h-4" /> Save Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Scheduled Sessions */}
      {todaySessions.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Scheduled Today</div>
          <div className="space-y-2">
            {todaySessions.map(session => (
              <div
                key={session.id}
                className="game-card p-4 flex items-center justify-between gap-3 border border-violet-500/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${DETOX_TYPE_COLORS[session.detoxType]}`}>
                      {session.detoxType}
                    </span>
                    <span className="text-xs text-slate-500">{session.startTime}–{session.endTime}</span>
                    <span className="text-xs text-slate-600">{minutesToDuration(scheduledDuration(session))}</span>
                  </div>
                  {session.intention && (
                    <p className="text-xs text-slate-500 italic truncate">{session.intention}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openLogModal(session.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-700/30 hover:bg-green-700/50 text-green-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Complete
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {sortedPast.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Past Sessions</div>
          <div className="space-y-2">
            {sortedPast.map(session => (
              <div key={session.id} className="game-card overflow-hidden">
                <div
                  className="p-4 cursor-pointer flex items-start justify-between gap-3"
                  onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {session.completed
                        ? <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        : <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      }
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${DETOX_TYPE_COLORS[session.detoxType]}`}>
                        {session.detoxType}
                      </span>
                      <span className="text-xs text-slate-500">{session.date}</span>
                      <span className="text-xs text-slate-600">{session.startTime}–{session.endTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {session.completed && session.actualDurationMinutes != null && (
                        <span className="text-green-400">{minutesToDuration(session.actualDurationMinutes)}</span>
                      )}
                      {session.completed && session.difficulty != null && (
                        <span className={DIFFICULTY_COLORS[session.difficulty]}>
                          Difficulty: {session.difficulty}/5
                        </span>
                      )}
                      {!session.completed && (
                        <span className="text-slate-600 italic">Not completed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!session.completed && (
                      <button
                        onClick={e => { e.stopPropagation(); openLogModal(session.id) }}
                        className="px-2 py-1 text-xs bg-green-700/20 hover:bg-green-700/40 text-green-400 rounded-lg transition-colors"
                      >
                        Log
                      </button>
                    )}
                    {expandedId === session.id
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />
                    }
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(session.id) }}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expandedId === session.id && (
                  <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-2 text-sm">
                    {session.intention && (
                      <div>
                        <span className="text-xs text-slate-500 uppercase">Intention:</span>
                        <p className="text-slate-300 mt-0.5 text-xs">{session.intention}</p>
                      </div>
                    )}
                    {session.detoxType === 'Custom' && session.customRules && (
                      <div>
                        <span className="text-xs text-slate-500 uppercase">Custom Rules:</span>
                        <p className="text-slate-300 mt-0.5 text-xs">{session.customRules}</p>
                      </div>
                    )}
                    {session.noticed && (
                      <div>
                        <span className="text-xs text-violet-400 uppercase">What I Noticed:</span>
                        <p className="text-slate-300 mt-0.5 text-xs">{session.noticed}</p>
                      </div>
                    )}
                    {session.benefitFelt && (
                      <div>
                        <span className="text-xs text-green-400 uppercase">Benefit Felt:</span>
                        <p className="text-green-300 mt-0.5 text-xs">{session.benefitFelt}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && !showScheduleForm && (
        <div className="text-center py-12 text-slate-500">
          <Moon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No detox sessions yet.</p>
          <p className="text-sm mb-5 text-slate-600">
            Schedule your first digital detox and reclaim your attention.
          </p>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Schedule First Detox
          </button>
        </div>
      )}
    </div>
  )
}
