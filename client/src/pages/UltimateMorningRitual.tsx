import { useState, useEffect, useRef, useCallback } from 'react'
import { Sun, Play, Pause, SkipForward, RotateCcw, CheckCircle, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface RitualStep {
  id: string
  title: string
  subtitle: string
  instruction: string
  duration: number   // seconds
  emoji: string
  color: string
  tip: string
  dataKey?: string   // localStorage key to pull personalised content from
  dataField?: string // field to read
}

const BASE_STEPS: RitualStep[] = [
  {
    id: 'breathe', emoji: '🌬️', color: '#3b82f6',
    title: 'Ground & Breathe',
    subtitle: 'Inhale 4 · Hold 4 · Exhale 6',
    instruction: 'Sit upright. Feel your feet on the floor. Take 5 slow, deliberate breaths. On each exhale, release yesterday completely.',
    duration: 90,
    tip: 'Box breathing activates your parasympathetic nervous system within 60 seconds.',
  },
  {
    id: 'gratitude', emoji: '🙏', color: '#22c55e',
    title: 'Deep Gratitude',
    subtitle: 'Feel it, don\'t just think it',
    instruction: 'Bring to mind 3 things you are genuinely grateful for. Don\'t rush — let each one land in your chest. Add the physical sensation of thankfulness.',
    duration: 120,
    tip: 'Gratitude floods the brain with dopamine and serotonin. Do it slowly for maximum effect.',
    dataKey: 'gratitude_to_self_log',
    dataField: 'whatYouAppreciate',
  },
  {
    id: 'identity', emoji: '⚔️', color: '#a855f7',
    title: 'Declare Your Identity',
    subtitle: 'Who are you becoming?',
    instruction: 'Say aloud (or write) your identity statement. "I am someone who..." State it with full conviction. Your brain believes what you repeat.',
    duration: 60,
    tip: 'Identity-based habits outperform goal-based ones by 3x over the long term.',
    dataKey: 'willpower_log',
    dataField: 'identityStatement',
  },
  {
    id: 'goals', emoji: '🎯', color: '#f97316',
    title: 'See Your Goals',
    subtitle: 'Read and feel each one',
    instruction: 'Read your top 3 goals. For each one, close your eyes and vividly see yourself having already achieved it. Notice how it feels in your body.',
    duration: 120,
    tip: 'Mental rehearsal activates the same neural pathways as physical practice.',
    dataKey: 'inspired_action_log',
    dataField: 'action',
  },
  {
    id: 'affirmations', emoji: '💫', color: '#ec4899',
    title: 'Power Affirmations',
    subtitle: 'Speak with certainty',
    instruction: 'Read your affirmations aloud. Speak slowly. Feel each one as already true. If you don\'t have written affirmations, create 3 right now.',
    duration: 90,
    tip: 'Affirmations spoken aloud are 4x more effective than ones read silently.',
    dataKey: 'daily_affirmations_log',
    dataField: 'affirmation',
  },
  {
    id: 'visualize', emoji: '🔮', color: '#6366f1',
    title: 'Victory Visualization',
    subtitle: 'See your ideal day unfolding',
    instruction: 'Close your eyes. See your perfect day from start to finish: your energy, your wins, how you show up for others. Make it vivid. Make it real.',
    duration: 180,
    tip: 'Elite athletes use visualization daily. Your brain cannot distinguish a vivid mental rehearsal from reality.',
  },
  {
    id: 'intention', emoji: '🌅', color: '#f59e0b',
    title: 'Set Today\'s Intention',
    subtitle: 'One word that guides your day',
    instruction: 'Choose one word or phrase that will anchor you today. Write it somewhere you\'ll see it. Let it be the filter for every decision you make.',
    duration: 60,
    tip: '"How you do anything is how you do everything." Your intention shapes everything.',
    dataKey: 'daily_intentions_log',
    dataField: 'intention',
  },
  {
    id: 'move', emoji: '💪', color: '#ef4444',
    title: 'Move Your Body',
    subtitle: '5 minutes of primal movement',
    instruction: 'Stand up NOW. Do 10 jumping jacks, shake your arms, roll your shoulders, jump in place, do 5 push-ups. Get your blood moving. Signal to your body: today we perform.',
    duration: 300,
    tip: 'Morning movement raises cortisol (helpful in AM), dopamine, and BDNF — your brain\'s growth factor.',
  },
  {
    id: 'mission', emoji: '🚀', color: '#10b981',
    title: 'Launch',
    subtitle: 'You are ready',
    instruction: 'Take one final deep breath. Look at your word or phrase for today. Say aloud: "Today I show up fully. Today I make it count." Then begin.',
    duration: 30,
    tip: 'The first hour of your day sets the trajectory for all that follows.',
  },
]

const STORAGE_KEY = 'morning_ritual_log'
const STREAK_KEY = 'morning_ritual_streak'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function playTone(freq: number, duration: number) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* audio not available */ }
}

export default function UltimateMorningRitual() {
  const { toastSuccess } = useToast()
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState(BASE_STEPS[0].duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [personalData, setPersonalData] = useState<Record<string, string>>({})
  const [streakData, setStreakData] = useState({ streak: 0, lastDate: '' })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load personal data from other pages
  useEffect(() => {
    const data: Record<string, string> = {}
    for (const step of BASE_STEPS) {
      if (!step.dataKey || !step.dataField) continue
      try {
        const entries = JSON.parse(localStorage.getItem(step.dataKey) || '[]')
        if (Array.isArray(entries) && entries.length > 0) {
          const val = entries[0][step.dataField]
          if (typeof val === 'string' && val.trim()) data[step.id] = val
        }
      } catch { /**/ }
    }
    setPersonalData(data)

    try {
      const s = JSON.parse(localStorage.getItem(STREAK_KEY) || '{"streak":0,"lastDate":""}')
      setStreakData(s)
    } catch { /**/ }
  }, [])

  const advance = useCallback((stepIdx: number) => {
    if (stepIdx >= BASE_STEPS.length - 1) {
      setIsRunning(false)
      setIsComplete(true)
      playTone(880, 1.5)

      // Update streak
      const today = new Date().toISOString().split('T')[0]
      const prev = streakData
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const newStreak = prev.lastDate === yesterday ? prev.streak + 1
        : prev.lastDate === today ? prev.streak : 1
      const newData = { streak: newStreak, lastDate: today }
      localStorage.setItem(STREAK_KEY, JSON.stringify(newData))
      setStreakData(newData)

      // Log the ritual
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      logs.unshift({ id: Date.now().toString(), date: today, completedAt: new Date().toISOString() })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 90)))
      toastSuccess('Morning ritual complete — you have already won today before it began 🌅')
    } else {
      setCurrentStep(stepIdx + 1)
      setTimeLeft(BASE_STEPS[stepIdx + 1].duration)
      setIsRunning(true)
      playTone(440, 0.3)
    }
  }, [streakData, toastSuccess])

  // Timer tick
  useEffect(() => {
    if (!isRunning) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning])

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && isRunning) advance(currentStep)
  }, [timeLeft, isRunning, currentStep, advance])

  const step = BASE_STEPS[currentStep]
  const totalDuration = BASE_STEPS.reduce((s, st) => s + st.duration, 0)
  const elapsed = BASE_STEPS.slice(0, currentStep).reduce((s, st) => s + st.duration, 0)
    + (step.duration - timeLeft)
  const overallPct = Math.round((elapsed / totalDuration) * 100)

  const ritualLogs = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })()

  // ── Not started screen ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Morning Ritual
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            A complete guided morning practice — {Math.round(totalDuration / 60)} minutes to own your day.
          </p>
        </div>

        {/* Streak & stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="game-card p-3">
            <div className="text-xl font-bold text-yellow-400">🔥 {streakData.streak}</div>
            <div className="text-xs text-slate-500">Day Streak</div>
          </div>
          <div className="game-card p-3">
            <div className="text-xl font-bold text-white">{ritualLogs.length}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="game-card p-3">
            <div className="text-xl font-bold text-amber-400">{BASE_STEPS.length}</div>
            <div className="text-xs text-slate-500">Steps</div>
          </div>
        </div>

        {/* Step preview */}
        <div className="game-card p-4 space-y-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Today's Ritual</div>
          {BASE_STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
              <span className="text-lg w-7 text-center">{s.emoji}</span>
              <div className="flex-1">
                <span className="text-sm text-slate-300">{s.title}</span>
                <span className="text-xs text-slate-600 ml-2">{formatTime(s.duration)}</span>
              </div>
              <div className="text-xs text-slate-600">#{i + 1}</div>
            </div>
          ))}
        </div>

        <button onClick={() => { setStarted(true); setIsRunning(true); playTone(528, 0.5) }}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
          <Sun className="w-5 h-5" />
          Begin Your Morning
        </button>
      </div>
    )
  }

  // ── Complete screen ─────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="space-y-5 max-w-lg mx-auto text-center">
        <div className="game-card p-8 border border-yellow-500/30">
          <div className="text-6xl mb-4">🌅</div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            Ritual Complete
          </h2>
          <p className="text-slate-400 mb-4">
            You have already done what most people won't do today.<br />
            That's your edge. Now go use it.
          </p>
          <div className="text-3xl font-bold text-yellow-400 mb-1">🔥 {streakData.streak} days</div>
          <div className="text-sm text-slate-500 mb-6">morning ritual streak</div>
          <button onClick={() => { setStarted(false); setIsComplete(false); setCurrentStep(0); setTimeLeft(BASE_STEPS[0].duration); setIsRunning(false) }}
            className="px-6 py-3 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl font-semibold">
            <RotateCcw className="inline w-4 h-4 mr-2" />
            Reset for Tomorrow
          </button>
        </div>
      </div>
    )
  }

  // ── Active ritual ───────────────────────────────────────────────────────────
  const pct = (timeLeft / step.duration) * 100
  const circumference = 2 * Math.PI * 54

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Overall progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Step {currentStep + 1} of {BASE_STEPS.length}</span>
          <span>{overallPct}% complete</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${overallPct}%`, background: step.color }} />
        </div>
      </div>

      {/* Main step card */}
      <div className="game-card p-6 border text-center" style={{ borderColor: step.color + '40' }}>
        {/* Circular timer */}
        <div className="relative w-36 h-36 mx-auto mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
              stroke={step.color}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 6px ${step.color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl mb-0.5">{step.emoji}</div>
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">{step.title}</h2>
        <p className="text-sm font-medium mb-3" style={{ color: step.color }}>{step.subtitle}</p>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">{step.instruction}</p>

        {/* Personalised content from other pages */}
        {personalData[step.id] && (
          <div className="rounded-xl p-3 mb-4 text-sm italic text-slate-300"
            style={{ background: step.color + '15', borderLeft: `3px solid ${step.color}` }}>
            From your logs: "{personalData[step.id]}"
          </div>
        )}

        {/* Tip */}
        <div className="text-xs text-slate-600 bg-slate-800/60 rounded-lg p-2">
          💡 {step.tip}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={() => setIsRunning(r => !r)}
          className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: step.color }}>
          {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
        </button>
        <button onClick={() => advance(currentStep)}
          className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl flex items-center gap-2">
          <SkipForward className="w-4 h-4" /> Skip
        </button>
      </div>

      {/* Upcoming steps */}
      <div className="game-card p-3">
        <div className="text-xs text-slate-600 uppercase tracking-widest mb-2">Coming up</div>
        <div className="space-y-1">
          {BASE_STEPS.slice(currentStep + 1, currentStep + 4).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 text-xs text-slate-500">
              <span>{s.emoji}</span>
              <span>{s.title}</span>
              <span className="ml-auto text-slate-700">{formatTime(s.duration)}</span>
              {i === 0 && <ChevronRight className="w-3 h-3 text-slate-700" />}
            </div>
          ))}
          {currentStep >= BASE_STEPS.length - 2 && (
            <div className="flex items-center gap-2 text-xs text-yellow-600">
              <CheckCircle className="w-3 h-3" /> Final step approaching
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
