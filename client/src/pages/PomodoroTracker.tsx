import { useEffect, useRef, useState } from 'react'
import { Timer, Play, Pause, RotateCcw, Check, Coffee, Settings } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Session {
  id: string
  type: 'work' | 'short' | 'long'
  duration: number
  task: string
  completedAt: string
}

interface Config {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLong: number
}

const STORAGE_KEY = 'pomodoro_sessions'
const CONFIG_KEY = 'pomodoro_config'

const DEFAULT_CONFIG: Config = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
}

type Phase = 'work' | 'short' | 'long' | 'idle'

export default function PomodoroTracker() {
  const { toastSuccess } = useToast()
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [sessions, setSessions] = useState<Session[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_CONFIG.workMinutes * 60)
  const [running, setRunning] = useState(false)
  const [task, setTask] = useState('')
  const [completedInRow, setCompletedInRow] = useState(0)
  const [showConfig, setShowConfig] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setSessions(JSON.parse(saved))
    const savedConfig = localStorage.getItem(CONFIG_KEY)
    if (savedConfig) {
      const c = JSON.parse(savedConfig) as Config
      setConfig(c)
      setTimeLeft(c.workMinutes * 60)
    }
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            handleComplete()
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const handleComplete = () => {
    if (phase === 'work' || phase === 'idle') {
      const duration = config.workMinutes
      const session: Session = {
        id: Date.now().toString(),
        type: 'work',
        duration,
        task,
        completedAt: new Date().toISOString(),
      }
      const updated = [session, ...sessions]
      setSessions(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      const newCount = completedInRow + 1
      setCompletedInRow(newCount)
      toastSuccess(`Pomodoro complete! 🍅 ${newCount} in a row`)

      if (newCount % config.sessionsBeforeLong === 0) {
        startPhase('long')
      } else {
        startPhase('short')
      }
    } else {
      toastSuccess('Break over — back to work!')
      startPhase('work')
    }
  }

  const startPhase = (p: Phase) => {
    setPhase(p)
    const mins = p === 'work' ? config.workMinutes : p === 'short' ? config.shortBreakMinutes : config.longBreakMinutes
    setTimeLeft(mins * 60)
    setRunning(false)
  }

  const reset = () => {
    setRunning(false)
    setPhase('idle')
    setTimeLeft(config.workMinutes * 60)
    setCompletedInRow(0)
  }

  const saveConfig = (c: Config) => {
    setConfig(c)
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c))
    if (!running) setTimeLeft(c.workMinutes * 60)
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const totalTime = phase === 'short' ? config.shortBreakMinutes * 60 : phase === 'long' ? config.longBreakMinutes * 60 : config.workMinutes * 60
  const progress = 1 - timeLeft / totalTime

  const phaseColor = phase === 'work' || phase === 'idle' ? '#ef4444' : phase === 'short' ? '#22c55e' : '#3b82f6'
  const phaseLabel = phase === 'work' ? 'Work Session' : phase === 'short' ? 'Short Break' : phase === 'long' ? 'Long Break' : 'Ready'

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.completedAt.split('T')[0] === today && s.type === 'work')
  const totalMinutesToday = todaySessions.reduce((s, sess) => s + sess.duration, 0)
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.completedAt)
    const cutoff = new Date(Date.now() - 7 * 86400000)
    return d >= cutoff && s.type === 'work'
  })

  const circumference = 2 * Math.PI * 54

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Timer className="w-7 h-7 text-red-400" />
            Pomodoro
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep work in focused sprints</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Config */}
      {showConfig && (
        <div className="game-card p-4 space-y-3 border border-red-500/20">
          <h3 className="font-semibold text-slate-300 text-sm">Timer Settings</h3>
          {([['workMinutes', 'Work (min)'], ['shortBreakMinutes', 'Short Break (min)'], ['longBreakMinutes', 'Long Break (min)'], ['sessionsBeforeLong', 'Sessions before long break']] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-xs text-slate-400">{label}</label>
              <input type="number" value={config[key]} onChange={e => saveConfig({ ...config, [key]: parseInt(e.target.value) || 1 })}
                className="game-input w-16 text-center text-sm" min="1" max="120" />
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400">{todaySessions.length}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{totalMinutesToday}m</div>
          <div className="text-xs text-slate-500">Focus Time</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{weekSessions.length}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
      </div>

      {/* Timer circle */}
      <div className="game-card p-8 flex flex-col items-center gap-6">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: phaseColor }}>{phaseLabel}</div>

        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="70" cy="70" r="54" fill="none" stroke={phaseColor} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Task input */}
        <input value={task} onChange={e => setTask(e.target.value)}
          placeholder="What are you working on?" className="game-input w-full text-center text-sm"
          disabled={running} />

        {/* Controls */}
        <div className="flex gap-3">
          <button onClick={() => setRunning(r => !r)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ background: phaseColor + '22', color: phaseColor, border: `1px solid ${phaseColor}` }}>
            {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button onClick={reset} className="p-3 text-slate-500 hover:text-slate-300 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Session dots */}
        {completedInRow > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: config.sessionsBeforeLong }, (_, i) => (
              <div key={i} className="w-3 h-3 rounded-full"
                style={{ background: i < (completedInRow % config.sessionsBeforeLong || config.sessionsBeforeLong) ? phaseColor : '#1e293b' }} />
            ))}
          </div>
        )}

        {/* Phase buttons */}
        <div className="flex gap-2 text-xs">
          <button onClick={() => startPhase('work')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg">Work</button>
          <button onClick={() => startPhase('short')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg flex items-center gap-1">
            <Coffee className="w-3 h-3" /> Short Break
          </button>
          <button onClick={() => startPhase('long')} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg flex items-center gap-1">
            <Coffee className="w-3 h-3" /> Long Break
          </button>
        </div>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                <Check className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 truncate">{s.task || 'Focused work'}</div>
                  <div className="text-xs text-slate-600">{s.duration}m · {new Date(s.completedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
