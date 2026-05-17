import { useState, useEffect, useRef } from 'react'
import { Zap, Play, Pause, RotateCcw, Check, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface PowerTask {
  id: string
  text: string
  done: boolean
  timeSpent: number
}

interface PowerSession {
  id: string
  tasks: PowerTask[]
  duration: number
  completedAt: string
  completionRate: number
  score: number
}

const DURATION_OPTIONS = [25, 45, 60, 90]

const POWER_TIPS = [
  'Put your phone in another room before starting.',
  'Close all browser tabs except what you need.',
  'Tell someone you\'re doing a Power Hour.',
  'Have water and snacks ready before starting.',
  'Set your intention: what\'s the ONE thing you must finish?',
  'Stand up if you feel sluggish — it boosts alertness 20%.',
  'Commit fully: 60 minutes of focus, then reward yourself.',
]

const STORAGE_KEY = 'power_hour_sessions'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function PowerHour() {
  const { toastSuccess } = useToast()
  const [tasks, setTasks] = useState<PowerTask[]>([
    { id: '1', text: '', done: false, timeSpent: 0 },
    { id: '2', text: '', done: false, timeSpent: 0 },
    { id: '3', text: '', done: false, timeSpent: 0 },
  ])
  const [duration, setDuration] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [sessions, setSessions] = useState<PowerSession[]>([])
  const [tip] = useState(POWER_TIPS[Math.floor(Math.random() * POWER_TIPS.length)])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setSessions(saved ? JSON.parse(saved) : [])
    } catch { /**/ }
  }, [])

  useEffect(() => {
    setTimeLeft(duration * 60)
    setFinished(false)
  }, [duration])

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - ((duration * 60 - timeLeft) * 1000)
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const left = Math.max(0, duration * 60 - elapsed)
        setTimeLeft(left)
        if (left === 0) {
          setRunning(false)
          setFinished(true)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }, 200)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const reset = () => {
    setRunning(false)
    setTimeLeft(duration * 60)
    setFinished(false)
  }

  const complete = () => {
    const doneTasks = tasks.filter(t => t.done)
    const filledTasks = tasks.filter(t => t.text.trim())
    const rate = filledTasks.length > 0 ? doneTasks.filter(t => t.text.trim()).length / filledTasks.length : 0
    const elapsed = duration * 60 - timeLeft
    const score = Math.round(rate * 80 + (elapsed / (duration * 60)) * 20)
    const session: PowerSession = {
      id: Date.now().toString(),
      tasks: tasks.filter(t => t.text.trim()),
      duration: Math.round(elapsed / 60),
      completedAt: new Date().toISOString(),
      completionRate: rate,
      score,
    }
    const updated = [session, ...sessions].slice(0, 30)
    setSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    toastSuccess(`Power Hour complete! Score: ${score} 🔥`)
    // Reset
    setTasks([
      { id: '1', text: '', done: false, timeSpent: 0 },
      { id: '2', text: '', done: false, timeSpent: 0 },
      { id: '3', text: '', done: false, timeSpent: 0 },
    ])
    reset()
  }

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const progress = (duration * 60 - timeLeft) / (duration * 60)
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference * (1 - progress)

  const totalSessions = sessions.length
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s, se) => s + se.score, 0) / sessions.length) : 0
  const totalHours = sessions.length > 0 ? Math.round(sessions.reduce((s, se) => s + se.duration, 0) / 60 * 10) / 10 : 0

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-7 h-7 text-yellow-400" />
          Power Hour
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Deep focus sessions with task tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{totalSessions}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{avgScore}</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Total Focus</div>
        </div>
      </div>

      {/* Duration selector */}
      {!running && !finished && (
        <div className="game-card p-4">
          <label className="text-xs text-slate-400 mb-2 block">Session Duration</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${duration === d ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {d}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="flex flex-col items-center">
        <svg width="220" height="220" className="transform -rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle cx="110" cy="110" r={radius} fill="none"
            stroke={finished ? '#22c55e' : running ? '#eab308' : '#6366f1'}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '-180px' }}>
          <div className="text-5xl font-bold text-white font-mono">{formatTime(timeLeft)}</div>
          <div className="text-xs text-slate-500 mt-1">{duration}min session</div>
          {running && <div className="text-xs text-yellow-400 mt-1 animate-pulse">FOCUS MODE</div>}
          {finished && <div className="text-xs text-green-400 mt-1">COMPLETE!</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center" style={{ marginTop: '-60px' }}>
        {!finished ? (
          <>
            <button onClick={() => setRunning(r => !r)}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors">
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {running ? 'Pause' : timeLeft === duration * 60 ? 'Start' : 'Resume'}
            </button>
            <button onClick={reset} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button onClick={complete} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-colors">
            <Check className="w-5 h-5" /> Complete Session
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="game-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Session Tasks</h3>
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-center gap-3">
            <button onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-green-400'}`}>
              {task.done && <Check className="w-3 h-3 text-white" />}
            </button>
            <input value={task.text}
              onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: e.target.value } : t))}
              placeholder={`Task ${i + 1}...`}
              className={`game-input flex-1 ${task.done ? 'line-through text-slate-600' : ''}`} />
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="game-card p-4 border border-yellow-500/20">
        <div className="text-xs text-yellow-400 font-semibold mb-1">⚡ Power Tip</div>
        <p className="text-sm text-slate-400">{tip}</p>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Sessions</h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">
                    {s.tasks.filter(t => t.done).length}/{s.tasks.length} tasks · {s.duration}min
                  </div>
                  <div className="text-xs text-slate-500">{s.completedAt.split('T')[0]}</div>
                </div>
                <div className="text-lg font-bold text-yellow-400">{s.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
