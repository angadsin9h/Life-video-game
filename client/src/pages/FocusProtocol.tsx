import { useState, useEffect, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import {
  Target, Zap, Clock, CheckCircle2, Circle, Play, Pause, X,
  TrendingUp, BarChart3, Brain, Star, Plus,
} from 'lucide-react'

const STORAGE_KEY = 'focus_protocol_log'

type Phase = 'setup' | 'session' | 'review'

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
  { label: '120 min', minutes: 120 },
]

const ENV_CHECKS = [
  'Phone off',
  'Notifications off',
  'Water ready',
  'Clear workspace',
  'Timer set',
  'Music/silence chosen',
]

interface PreSessionData {
  sessionGoal: string
  duration: number
  energyCheck: number
  environmentReady: string[]
  mindClear: number
}

interface PostSessionData {
  accomplished: string
  focusQuality: number
  distractionsCount: number
  energyAfter: number
  sessionWin: string
}

interface SessionEntry {
  id: string
  date: string
  pre: PreSessionData
  post: PostSessionData
  focusScore: number
  actualMinutes: number
}

const EMPTY_PRE: PreSessionData = {
  sessionGoal: '',
  duration: 25,
  energyCheck: 7,
  environmentReady: [],
  mindClear: 7,
}

const EMPTY_POST: PostSessionData = {
  accomplished: '',
  focusQuality: 7,
  distractionsCount: 0,
  energyAfter: 7,
  sessionWin: '',
}

function computeFocusScore(pre: PreSessionData, post: PostSessionData): number {
  return Math.round((post.focusQuality * 0.5 + pre.mindClear * 0.3 + pre.energyCheck * 0.2) * 10)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export default function FocusProtocol() {
  const { toastSuccess } = useToast()

  const [entries, setEntries] = useState<SessionEntry[]>([])
  const [phase, setPhase] = useState<Phase>('setup')
  const [showForm, setShowForm] = useState(false)
  const [pre, setPre] = useState<PreSessionData>(EMPTY_PRE)
  const [post, setPost] = useState<PostSessionData>(EMPTY_POST)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch {
      setEntries([])
    }
  }, [])

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            setRunning(false)
            setPhase('review')
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, secondsLeft])

  const saveEntries = (updated: SessionEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const startSession = () => {
    if (!pre.sessionGoal.trim()) return
    const secs = pre.duration * 60
    setTotalSeconds(secs)
    setSecondsLeft(secs)
    setStartTime(Date.now())
    setRunning(true)
    setPhase('session')
  }

  const endEarly = () => {
    setRunning(false)
    setPhase('review')
  }

  const submitReview = () => {
    const actualMinutes = Math.round((Date.now() - startTime) / 60000)
    const entry: SessionEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pre,
      post,
      focusScore: computeFocusScore(pre, post),
      actualMinutes,
    }
    saveEntries([entry, ...entries])
    toastSuccess('Focus session logged! Great work.')
    setPre(EMPTY_PRE)
    setPost(EMPTY_POST)
    setPhase('setup')
    setShowForm(false)
  }

  const toggleEnvCheck = (item: string) => {
    setPre(p => ({
      ...p,
      environmentReady: p.environmentReady.includes(item)
        ? p.environmentReady.filter(x => x !== item)
        : [...p.environmentReady, item],
    }))
  }

  // Stats
  const today = todayKey()
  const todayEntries = entries.filter(e => e.date.startsWith(today))
  const todayMinutes = todayEntries.reduce((sum, e) => sum + e.actualMinutes, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekEntries = entries.filter(e => new Date(e.date) >= weekAgo)
  const weekMinutes = weekEntries.reduce((sum, e) => sum + e.actualMinutes, 0)
  const avgQuality = weekEntries.length
    ? Math.round(weekEntries.reduce((s, e) => s + e.post.focusQuality, 0) / weekEntries.length * 10) / 10
    : 0

  const last5 = entries.slice(0, 5)

  // Progress ring
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const MOTIVATIONAL = [
    'Deep work is your superpower.',
    'Each minute of focus compounds.',
    'You are building who you are becoming.',
    'Stay in the zone. The world can wait.',
    'This session is an investment in your future self.',
  ]
  const mot = MOTIVATIONAL[Math.floor((Date.now() / 60000) % MOTIVATIONAL.length)]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-8 h-8 text-blue-400" />
            Focus Protocol
          </h1>
          <p className="text-slate-400 mt-1">Design and run your personal deep work sessions.</p>
        </div>
        {!showForm && phase === 'setup' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{todayMinutes}</div>
          <div className="text-xs text-slate-400 mt-1">Today's Focus (min)</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{Math.round(weekMinutes / 60 * 10) / 10}</div>
          <div className="text-xs text-slate-400 mt-1">Weekly Hours</div>
        </div>
        <div className="game-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgQuality}</div>
          <div className="text-xs text-slate-400 mt-1">Avg Quality (7d)</div>
        </div>
      </div>

      {/* PHASE: SESSION */}
      {phase === 'session' && (
        <div className="game-card p-8 text-center border border-blue-500/30 space-y-6">
          <div className="text-sm font-semibold text-blue-300 uppercase tracking-widest">Session Active</div>
          <div className="text-lg text-slate-300 italic">"{pre.sessionGoal}"</div>

          {/* Ring timer */}
          <div className="flex justify-center">
            <svg width={180} height={180} className="rotate-[-90deg]">
              <circle
                cx={90} cy={90} r={radius}
                stroke="#1e293b" strokeWidth={12} fill="none"
              />
              <circle
                cx={90} cy={90} r={radius}
                stroke="#3b82f6" strokeWidth={12} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute flex items-center justify-center" style={{ width: 180, height: 180 }}>
              <div>
                <div className="text-4xl font-bold text-white rotate-90" style={{ fontFamily: 'Orbitron, monospace', transform: 'rotate(0deg)' }}>
                  {formatTime(secondsLeft)}
                </div>
                <div className="text-xs text-slate-400 text-center mt-1">remaining</div>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-sm italic">{mot}</p>

          <button
            onClick={endEarly}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-sm transition-colors"
          >
            <Pause className="w-4 h-4" />
            End Early
          </button>
        </div>
      )}

      {/* PHASE: REVIEW */}
      {phase === 'review' && (
        <div className="game-card p-5 border border-green-500/30 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-green-400" />
            Post-Session Review
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">What Did You Actually Accomplish?</label>
            <textarea
              className="game-input w-full resize-none"
              rows={3}
              placeholder="Detail what you completed..."
              value={post.accomplished}
              onChange={e => setPost(p => ({ ...p, accomplished: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Focus Quality: {post.focusQuality}/10</label>
              <input type="range" min={1} max={10} value={post.focusQuality}
                onChange={e => setPost(p => ({ ...p, focusQuality: Number(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Energy After: {post.energyAfter}/10</label>
              <input type="range" min={1} max={10} value={post.energyAfter}
                onChange={e => setPost(p => ({ ...p, energyAfter: Number(e.target.value) }))}
                className="w-full accent-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Distractions Count</label>
            <input
              type="number" min={0} max={50}
              className="game-input w-32"
              value={post.distractionsCount}
              onChange={e => setPost(p => ({ ...p, distractionsCount: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Biggest Win This Session</label>
            <input
              className="game-input w-full"
              placeholder="What's the highlight?"
              value={post.sessionWin}
              onChange={e => setPost(p => ({ ...p, sessionWin: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Focus Score: <span className="text-blue-400 font-bold text-lg">{computeFocusScore(pre, post)}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <button
              onClick={submitReview}
              className="px-5 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
            >
              Save Session
            </button>
          </div>
        </div>
      )}

      {/* PHASE: SETUP FORM */}
      {phase === 'setup' && showForm && (
        <div className="game-card p-5 border border-blue-500/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Pre-Session Setup
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Session Goal *</label>
            <input
              className="game-input w-full"
              placeholder="What will you accomplish in this session?"
              value={pre.sessionGoal}
              onChange={e => setPre(p => ({ ...p, sessionGoal: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Duration</label>
              <select
                className="game-input w-full"
                value={pre.duration}
                onChange={e => setPre(p => ({ ...p, duration: Number(e.target.value) }))}
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d.label} value={d.minutes}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Energy Check: {pre.energyCheck}/10</label>
              <input type="range" min={1} max={10} value={pre.energyCheck}
                onChange={e => setPre(p => ({ ...p, energyCheck: Number(e.target.value) }))}
                className="w-full accent-blue-500 mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Environment Ready</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ENV_CHECKS.map(item => {
                const checked = pre.environmentReady.includes(item)
                return (
                  <button
                    key={item}
                    onClick={() => toggleEnvCheck(item)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                      checked
                        ? 'bg-blue-900/60 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {checked
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      : <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    }
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Mind Clarity: {pre.mindClear}/10</label>
            <input type="range" min={1} max={10} value={pre.mindClear}
              onChange={e => setPre(p => ({ ...p, mindClear: Number(e.target.value) }))}
              className="w-full accent-violet-500"
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-700">
            <button
              onClick={startSession}
              disabled={!pre.sessionGoal.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Session
            </button>
          </div>
        </div>
      )}

      {/* Last 5 sessions */}
      {phase === 'setup' && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Recent Sessions
          </h2>

          {last5.length === 0 ? (
            <div className="game-card p-10 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No sessions yet. Start your first focus block.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {last5.map(s => (
                <div key={s.id} className="game-card p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{s.pre.sessionGoal}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">{s.actualMinutes} min</span>
                        <span className="text-xs text-blue-400">Quality: {s.post.focusQuality}/10</span>
                        <span className="text-xs text-violet-400">Score: {s.focusScore}</span>
                        {s.post.sessionWin && (
                          <span className="text-xs text-green-400 truncate">Win: {s.post.sessionWin}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {phase === 'setup' && (
        <div className="game-card p-4 border border-blue-500/20 bg-blue-900/10">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Focus Protocol Principle</p>
              <p className="text-xs text-slate-400 mt-1">
                A focused hour outperforms a distracted day. Protect your deep work time like your most valuable asset.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
