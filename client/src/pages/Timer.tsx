import { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import { Play, Pause, RotateCcw, CheckCircle2, Zap, Coffee, Target, Settings, SkipForward } from 'lucide-react'

const CATEGORIES = ['health', 'mind', 'work', 'social', 'growth'] as const
const CAT_ICONS: Record<string, string> = { health: '❤️', mind: '🧠', work: '💼', social: '👥', growth: '🚀' }
const CAT_COLORS: Record<string, string> = {
  health: 'border-green-500/50 bg-green-500/5 text-green-400',
  mind:   'border-cyan-500/50 bg-cyan-500/5 text-cyan-400',
  work:   'border-violet-500/50 bg-violet-500/5 text-violet-400',
  social: 'border-yellow-500/50 bg-yellow-500/5 text-yellow-400',
  growth: 'border-red-500/50 bg-red-500/5 text-red-400',
}

type Mode = 'focus' | 'short' | 'long'
const MODE_DURATIONS: Record<Mode, number> = { focus: 25, short: 5, long: 15 }
const MODE_LABELS: Record<Mode, string> = { focus: '🎯 Focus', short: '☕ Short Break', long: '🛋️ Long Break' }

function playChime(type: 'work' | 'break') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const freqs = type === 'work' ? [523, 659, 784] : [784, 659, 523]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.5)
    })
  } catch (_) {}
}

interface Session {
  id: number; date: string; category: string; task_name: string; duration_minutes: number; created_at: string
}

interface Targets { health: number; mind: number; work: number; social: number; growth: number }

function pad(n: number) { return String(n).padStart(2, '0') }

export default function Timer() {
  const [mode, setMode] = useState<Mode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(MODE_DURATIONS.focus * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [category, setCategory] = useState<string>('work')
  const [taskName, setTaskName] = useState('')
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [targets, setTargets] = useState<Targets>({ health: 0, mind: 0, work: 0, social: 0, growth: 0 })
  const [editingTargets, setEditingTargets] = useState(false)
  const [draftTargets, setDraftTargets] = useState<Targets>({ health: 0, mind: 0, work: 0, social: 0, growth: 0 })
  const [weekMins, setWeekMins] = useState<Partial<Targets>>({})
  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0) // completed work sessions
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'short' | 'long'>('work')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSeconds = pomodoroMode
    ? (pomodoroPhase === 'work' ? 25 : pomodoroPhase === 'short' ? 5 : 15) * 60
    : MODE_DURATIONS[mode] * 60
  const elapsedSeconds = totalSeconds - secondsLeft
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const progress = elapsedSeconds / totalSeconds

  const loadData = useCallback(async () => {
    const [sessionsRes, targetsRes] = await Promise.all([
      axios.get<Session[]>('/api/timer/sessions'),
      axios.get<Targets>('/api/timer/targets'),
    ])
    setSessions(sessionsRes.data)
    setTargets(targetsRes.data)
    setDraftTargets(targetsRes.data)

    // Calculate this week's minutes by category from sessions
    const monday = (() => {
      const d = new Date(); const day = d.getDay()
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); return d.toISOString().split('T')[0]
    })()
    const thisWeek = sessionsRes.data.filter(s => s.date >= monday)
    const mins: Partial<Targets> = {}
    for (const s of thisWeek) {
      const cat = s.category as keyof Targets
      mins[cat] = (mins[cat] || 0) + s.duration_minutes
    }
    setWeekMins(mins)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Reset timer when mode changes (non-pomodoro)
  useEffect(() => {
    if (!pomodoroMode) {
      setRunning(false)
      setCompleted(false)
      setSecondsLeft(MODE_DURATIONS[mode] * 60)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [mode, pomodoroMode])

  // Reset when pomodoro mode toggled
  useEffect(() => {
    setRunning(false)
    setCompleted(false)
    setPomodoroCount(0)
    setPomodoroPhase('work')
    setSecondsLeft(pomodoroMode ? 25 * 60 : MODE_DURATIONS[mode] * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroMode])

  // Ticker
  useEffect(() => {
    if (running && !completed) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            if (pomodoroMode) {
              // Auto-advance pomodoro cycle
              setPomodoroCount(prev => {
                const newCount = pomodoroPhase === 'work' ? prev + 1 : prev
                const nextPhase: 'work' | 'short' | 'long' = pomodoroPhase === 'work'
                  ? (newCount % 4 === 0 ? 'long' : 'short')
                  : 'work'
                playChime(nextPhase === 'work' ? 'work' : 'break')
                setPomodoroPhase(nextPhase)
                const nextSecs = (nextPhase === 'work' ? 25 : nextPhase === 'short' ? 5 : 15) * 60
                setTimeout(() => setSecondsLeft(nextSecs), 50)
                setRunning(false) // pause so user can see the transition
                setCompleted(pomodoroPhase === 'work') // show log prompt after work session
                return newCount
              })
            } else {
              setRunning(false)
              setCompleted(true)
              playChime('break')
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, completed, pomodoroMode, pomodoroPhase])

  const reset = () => {
    setRunning(false); setCompleted(false)
    setSecondsLeft(pomodoroMode
      ? (pomodoroPhase === 'work' ? 25 : pomodoroPhase === 'short' ? 5 : 15) * 60
      : MODE_DURATIONS[mode] * 60)
  }

  const skipPhase = () => {
    if (!pomodoroMode) return
    setRunning(false); setCompleted(false)
    const nextPhase: 'work' | 'short' | 'long' = pomodoroPhase === 'work'
      ? ((pomodoroCount + 1) % 4 === 0 ? 'long' : 'short') : 'work'
    setPomodoroPhase(nextPhase)
    setSecondsLeft((nextPhase === 'work' ? 25 : nextPhase === 'short' ? 5 : 15) * 60)
  }

  const logSession = async () => {
    if (!taskName.trim()) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const durationMinutes = Math.ceil(elapsedSeconds / 60) || (pomodoroMode ? 25 : MODE_DURATIONS[mode])
      await axios.post('/api/timer/sessions', { date: today, category, task_name: taskName, duration_minutes: durationMinutes })
      setCompleted(false)
      setTaskName('')
      if (pomodoroMode) {
        // Phase was already advanced by the ticker; just start the break
        const breakSecs = (pomodoroPhase === 'short' ? 5 : 15) * 60
        setSecondsLeft(breakSecs)
        setRunning(true)
      } else {
        setSecondsLeft(MODE_DURATIONS[mode] * 60)
      }
      await loadData()
    } finally { setSaving(false) }
  }

  const saveTargets = async () => {
    await axios.put('/api/timer/targets', draftTargets)
    setTargets(draftTargets)
    setEditingTargets(false)
  }

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Focus Timer</h1>
        <p className="text-slate-400 mt-1">Lock in. Sessions auto-log to your daily score.</p>
      </div>

      {/* Pomodoro mode toggle */}
      <div className="flex items-center justify-between game-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍅</span>
          <div>
            <div className="text-sm font-medium text-slate-200">Pomodoro Mode</div>
            <div className="text-xs text-slate-500">25min work → 5min break, long break every 4</div>
          </div>
        </div>
        <button
          onClick={() => setPomodoroMode(p => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pomodoroMode ? 'bg-orange-600' : 'bg-slate-600'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${pomodoroMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Pomodoro progress dots */}
      {pomodoroMode && (
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className={`text-2xl transition-all ${i < (pomodoroCount % 4) ? 'opacity-100' : 'opacity-25'}`}>🍅</span>
          ))}
          <span className="text-xs text-slate-500 ml-2">
            {pomodoroPhase === 'work' ? '🎯 Work session' : pomodoroPhase === 'short' ? '☕ Short break' : '🛋️ Long break'}
            {pomodoroCount > 0 ? ` · ${pomodoroCount} done` : ''}
          </span>
        </div>
      )}

      {/* Mode selector (non-pomodoro) */}
      {!pomodoroMode && (
        <div className="flex gap-2">
          {(Object.keys(MODE_LABELS) as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-violet-600 text-white border border-violet-500' : 'bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-600'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      {/* Timer circle */}
      <div className="game-card p-8 text-center glowing-border">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={completed ? '#22c55e' : running
                ? (pomodoroMode && pomodoroPhase !== 'work' ? '#f97316' : '#8b5cf6')
                : '#475569'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute text-center">
            <div
              className={`text-4xl font-bold ${completed ? 'text-green-400' : running ? 'text-slate-100' : 'text-slate-300'}`}
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              {pad(minutes)}:{pad(seconds)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {completed ? '✓ Done!' : running ? (pomodoroMode ? (pomodoroPhase === 'work' ? '🎯 deep work' : '☕ resting') : 'In flow...') : 'Ready'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={reset} className="game-btn-secondary p-3 rounded-full" title="Reset">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            disabled={completed}
            className={`p-5 rounded-full font-bold text-white transition-all hover:scale-105 disabled:opacity-40 ${
              running ? 'bg-orange-600 hover:bg-orange-500 border-2 border-orange-400' : 'bg-violet-600 hover:bg-violet-500 border-2 border-violet-400'
            }`}
          >
            {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
          </button>
          {pomodoroMode && (
            <button onClick={skipPhase} className="game-btn-secondary p-3 rounded-full" title="Skip to next phase">
              <SkipForward className="w-5 h-5" />
            </button>
          )}
          {completed && !pomodoroMode && (
            <div className="text-green-400 animate-bounce">
              <Zap className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Pomodoro break prompt */}
        {pomodoroMode && !completed && !running && pomodoroPhase !== 'work' && (
          <div className="mt-6 space-y-3 animate-slide-in-up">
            <p className="text-orange-400 font-semibold">
              {pomodoroPhase === 'short' ? '☕ Short break — step away!' : '🛋️ Long break — you earned it!'}
            </p>
            <button onClick={() => setRunning(true)} className="game-btn-primary w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Start Break
            </button>
          </div>
        )}

        {/* Pomodoro: work session done, log and continue */}
        {pomodoroMode && completed && (
          <div className="mt-6 space-y-3 animate-slide-in-up">
            <p className="text-green-400 font-semibold">🍅 Pomodoro complete! Quick log before break?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="game-input flex-1"
                placeholder="What did you work on?"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logSession()}
                autoFocus
              />
              <select className="game-input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={logSession} disabled={saving || !taskName.trim()} className="game-btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Saving...' : 'Log & Start Break'}
              </button>
              <button onClick={() => { setCompleted(false); setRunning(true) }} className="game-btn-secondary">Skip</button>
            </div>
          </div>
        )}

        {/* Completion prompt */}
        {!pomodoroMode && completed && (
          <div className="mt-6 space-y-3 animate-slide-in-up">
            <p className="text-green-400 font-semibold">🎉 Session complete! Log it for XP?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="game-input flex-1"
                placeholder="What did you work on?"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logSession()}
                autoFocus
              />
              <select
                className="game-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={logSession}
                disabled={saving || !taskName.trim()}
                className="game-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Saving...' : `Log ${Math.ceil(elapsedSeconds / 60) || MODE_DURATIONS[mode]} minutes`}
              </button>
              <button onClick={reset} className="game-btn-secondary">Skip</button>
            </div>
          </div>
        )}

        {/* Task/category pre-selection (before timer starts, non-pomodoro) */}
        {!running && !completed && !(pomodoroMode && pomodoroPhase !== 'work') && (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              className="game-input w-full"
              placeholder="What are you focusing on? (optional)"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap justify-center">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    category === c ? CAT_COLORS[c] + ' border-opacity-100' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {CAT_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly targets progress */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            Weekly Targets
          </h3>
          <button
            onClick={() => setEditingTargets(e => !e)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {editingTargets ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Set weekly minute goals per category:</p>
            {CATEGORIES.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm w-20">{CAT_ICONS[cat]} {cat}</span>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  className="game-input w-24 text-center"
                  value={draftTargets[cat] || ''}
                  onChange={e => setDraftTargets(d => ({ ...d, [cat]: parseInt(e.target.value) || 0 }))}
                  placeholder="min"
                />
                <span className="text-xs text-slate-500">min/week</span>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button onClick={saveTargets} className="game-btn-primary flex-1 text-sm">Save Targets</button>
              <button onClick={() => { setEditingTargets(false); setDraftTargets(targets) }} className="game-btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.map(cat => {
              const target = targets[cat]
              const actual = weekMins[cat] || 0
              const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0
              const h = Math.floor(actual / 60); const m = actual % 60
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{CAT_ICONS[cat]} {cat}</span>
                    <span className={target > 0 && actual >= target ? 'text-green-400 font-bold' : 'text-slate-500'}>
                      {h > 0 ? `${h}h ` : ''}{m}m{target > 0 ? ` / ${Math.floor(target / 60) > 0 ? `${Math.floor(target / 60)}h ` : ''}${target % 60}m` : ''}
                      {target > 0 && actual >= target ? ' ✓' : ''}
                    </span>
                  </div>
                  {target > 0 ? (
                    <div className="stat-bar h-2">
                      <div className={`stat-bar-fill bar-${cat}`} style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <div className="stat-bar h-2 opacity-30">
                      <div className="h-full w-0" />
                    </div>
                  )}
                </div>
              )
            })}
            {Object.values(targets).every(v => v === 0) && (
              <p className="text-xs text-slate-500 text-center">
                Click ⚙️ to set weekly minute targets per category.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Session stats */}
      {sessions.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-orange-400" />
            Focus Stats
          </h3>

          {/* Today's sessions */}
          {(() => {
            const today = new Date().toISOString().split('T')[0]
            const todaySessions = sessions.filter(s => s.date === today)
            const todayMins = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
            const totalMins = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
            if (todaySessions.length === 0) return null
            return (
              <div className="mb-4 p-3 bg-violet-600/10 border border-violet-500/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Today's Focus</div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
                      {Math.floor(todayMins / 60) > 0 ? `${Math.floor(todayMins / 60)}h ` : ''}{todayMins % 60}m
                    </div>
                    <div className="text-xs text-slate-500">{todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex-1">
                    {CATEGORIES.map(cat => {
                      const catMins = todaySessions.filter(s => s.category === cat).reduce((sum, s) => sum + s.duration_minutes, 0)
                      if (catMins === 0) return null
                      return (
                        <div key={cat} className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-slate-400 w-14">{CAT_ICONS[cat]} {cat}</span>
                          <span className="text-xs text-slate-300">{catMins}m</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">All time</div>
                    <div className="text-sm font-bold text-slate-300">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Recent sessions list */}
          <div className="space-y-2">
            {sessions.slice(0, 10).map(s => {
              const isToday = s.date === new Date().toISOString().split('T')[0]
              return (
                <div key={s.id} className={`flex items-center gap-3 py-2 border-b border-slate-700 last:border-0 ${isToday ? 'opacity-100' : 'opacity-70'}`}>
                  <span className="text-lg">{CAT_ICONS[s.category]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{s.task_name}</div>
                    <div className="text-xs text-slate-500">{isToday ? 'Today' : s.date}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${CAT_COLORS[s.category]}`}>
                    {s.duration_minutes}m
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
