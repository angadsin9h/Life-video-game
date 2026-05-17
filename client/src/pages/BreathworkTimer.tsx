import { useEffect, useRef, useState } from 'react'
import { Wind, Play, Pause, Square, Clock, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Phase {
  label: 'Inhale' | 'Hold' | 'Exhale' | 'Hold2'
  seconds: number
}

interface Technique {
  name: string
  description: string
  benefits: string
  phases: Phase[]
  rounds: number
}

interface SessionEntry {
  id: number
  technique: string
  duration: number // seconds
  completedAt: string
  rounds: number
}

const TECHNIQUES: Technique[] = [
  {
    name: 'Box Breathing',
    description: 'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s',
    benefits: 'Used by Navy SEALs for focus and stress relief',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold',   seconds: 4 },
      { label: 'Exhale', seconds: 4 },
      { label: 'Hold2',  seconds: 4 },
    ],
    rounds: 5,
  },
  {
    name: '4-7-8 Breathing',
    description: 'Inhale 4s · Hold 7s · Exhale 8s',
    benefits: 'Reduces anxiety and promotes deep sleep',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Hold',   seconds: 7 },
      { label: 'Exhale', seconds: 8 },
    ],
    rounds: 4,
  },
  {
    name: 'Wim Hof',
    description: 'Inhale 2s · Brief hold · Exhale 2s · Long hold 15s',
    benefits: 'Energizes body, boosts immune system, improves focus',
    phases: [
      { label: 'Inhale', seconds: 2  },
      { label: 'Hold',   seconds: 2  },
      { label: 'Exhale', seconds: 2  },
      { label: 'Hold2',  seconds: 15 },
    ],
    rounds: 3,
  },
  {
    name: 'Coherent Breathing',
    description: 'Inhale 5s · Exhale 5s',
    benefits: 'Maximizes heart rate variability, deep nervous system calm',
    phases: [
      { label: 'Inhale', seconds: 5 },
      { label: 'Exhale', seconds: 5 },
    ],
    rounds: 6,
  },
  {
    name: 'Equal Breathing',
    description: 'Inhale 4s · Exhale 4s',
    benefits: 'Beginner-friendly, balances nervous system',
    phases: [
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 4 },
    ],
    rounds: 6,
  },
]

type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

const PHASE_COLORS: Record<Phase['label'], string> = {
  Inhale: '#3b82f6',
  Hold:   '#f59e0b',
  Exhale: '#10b981',
  Hold2:  '#f59e0b',
}

const PHASE_DISPLAY: Record<Phase['label'], string> = {
  Inhale: 'Inhale',
  Hold:   'Hold',
  Exhale: 'Exhale',
  Hold2:  'Hold',
}

const LS_KEY = 'breathwork_history'

function loadHistory(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: SessionEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function BreathworkTimer() {
  const { toastSuccess } = useToast()

  const [techniqueIdx, setTechniqueIdx] = useState(0)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [history, setHistory] = useState<SessionEntry[]>(loadHistory)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Mutable refs so the interval closure always sees current values
  const phaseIdxRef = useRef(0)
  const phaseSecondsLeftRef = useRef(0)
  const currentRoundRef = useRef(1)
  const elapsedRef = useRef(0)
  const statusRef = useRef<TimerStatus>('idle')
  const techniqueRef = useRef(TECHNIQUES[0])

  const technique = TECHNIQUES[techniqueIdx]

  // Sync technique ref when selection changes
  useEffect(() => {
    techniqueRef.current = TECHNIQUES[techniqueIdx]
  }, [techniqueIdx])

  function resetState(tech?: Technique) {
    const t = tech ?? techniqueRef.current
    phaseIdxRef.current = 0
    phaseSecondsLeftRef.current = t.phases[0].seconds
    currentRoundRef.current = 1
    elapsedRef.current = 0
    setPhaseIdx(0)
    setPhaseSecondsLeft(t.phases[0].seconds)
    setCurrentRound(1)
    setElapsedSeconds(0)
  }

  function clearTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startInterval() {
    clearTimer()
    intervalRef.current = setInterval(() => {
      // Elapsed
      elapsedRef.current += 1
      setElapsedSeconds(elapsedRef.current)

      // Phase countdown
      const newLeft = phaseSecondsLeftRef.current - 1

      if (newLeft <= 0) {
        // Advance to next phase
        const t = techniqueRef.current
        const nextPhaseIdx = phaseIdxRef.current + 1

        if (nextPhaseIdx >= t.phases.length) {
          // End of a round
          const nextRound = currentRoundRef.current + 1

          if (nextRound > t.rounds) {
            // Session complete
            clearTimer()
            statusRef.current = 'done'
            setStatus('done')
            phaseIdxRef.current = 0
            phaseSecondsLeftRef.current = t.phases[0].seconds
            setPhaseIdx(0)
            setPhaseSecondsLeft(t.phases[0].seconds)

            const entry: SessionEntry = {
              id: Date.now(),
              technique: t.name,
              duration: elapsedRef.current,
              completedAt: new Date().toISOString(),
              rounds: t.rounds,
            }
            setHistory(prev => {
              const updated = [entry, ...prev].slice(0, 20)
              saveHistory(updated)
              return updated
            })
            toastSuccess('Session complete!', `${t.name} · ${t.rounds} rounds`)
            return
          }

          // Next round, reset to first phase
          currentRoundRef.current = nextRound
          setCurrentRound(nextRound)
          phaseIdxRef.current = 0
          phaseSecondsLeftRef.current = t.phases[0].seconds
          setPhaseIdx(0)
          setPhaseSecondsLeft(t.phases[0].seconds)
        } else {
          // Next phase within same round
          phaseIdxRef.current = nextPhaseIdx
          phaseSecondsLeftRef.current = t.phases[nextPhaseIdx].seconds
          setPhaseIdx(nextPhaseIdx)
          setPhaseSecondsLeft(t.phases[nextPhaseIdx].seconds)
        }
      } else {
        phaseSecondsLeftRef.current = newLeft
        setPhaseSecondsLeft(newLeft)
      }
    }, 1000)
  }

  function handleStart() {
    if (status === 'idle' || status === 'done') {
      resetState()
      statusRef.current = 'running'
      setStatus('running')
      // Give React a tick to apply reset state before starting interval
      setTimeout(() => startInterval(), 0)
    } else if (status === 'paused') {
      statusRef.current = 'running'
      setStatus('running')
      startInterval()
    }
  }

  function handlePause() {
    clearTimer()
    statusRef.current = 'paused'
    setStatus('paused')
  }

  function handleStop() {
    clearTimer()
    statusRef.current = 'idle'
    setStatus('idle')
    resetState()
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [])

  // Reset when technique changes while idle
  function selectTechnique(idx: number) {
    if (status !== 'idle' && status !== 'done') {
      handleStop()
    }
    setTechniqueIdx(idx)
    const t = TECHNIQUES[idx]
    techniqueRef.current = t
    phaseIdxRef.current = 0
    phaseSecondsLeftRef.current = t.phases[0].seconds
    currentRoundRef.current = 1
    elapsedRef.current = 0
    setPhaseIdx(0)
    setPhaseSecondsLeft(t.phases[0].seconds)
    setCurrentRound(1)
    setElapsedSeconds(0)
    setStatus('idle')
    statusRef.current = 'idle'
  }

  const currentPhase = technique.phases[phaseIdx]
  const phaseColor = PHASE_COLORS[currentPhase.label]
  const phaseName = PHASE_DISPLAY[currentPhase.label]
  const isRunning = status === 'running'

  // Circle pulse animation logic
  const isInhale = currentPhase.label === 'Inhale'
  const isExhale = currentPhase.label === 'Exhale'
  const isHold = currentPhase.label === 'Hold' || currentPhase.label === 'Hold2'

  const circleScale = (() => {
    if (!isRunning && status !== 'paused') return 1
    if (isInhale) return 1.3
    if (isExhale) return 0.85
    return 1.1 // hold
  })()

  const phaseDuration = currentPhase.seconds
  const transitionDuration = isHold ? 0.3 : phaseDuration

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          <Wind className="w-7 h-7 text-cyan-400" />
          Breathwork Timer
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Guided breathing for calm, focus, and energy</p>
      </div>

      {/* Technique selector */}
      <div className="game-card p-4">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Select Technique</div>
        <div className="space-y-2">
          {TECHNIQUES.map((t, i) => (
            <button
              key={t.name}
              onClick={() => selectTechnique(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                i === techniqueIdx
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
                </div>
                <div className="text-xs text-slate-600 ml-4 shrink-0">
                  {t.rounds} rounds
                </div>
              </div>
              {i === techniqueIdx && (
                <div className="text-xs text-cyan-600 mt-1.5">{t.benefits}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timer display */}
      <div className="game-card p-6 flex flex-col items-center gap-6">
        {/* Round counter */}
        <div className="flex items-center gap-3">
          {Array.from({ length: technique.rounds }, (_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i < currentRound || status === 'done'
                  ? phaseColor
                  : i === currentRound - 1 && isRunning
                    ? phaseColor
                    : '#334155',
                opacity: i < currentRound - 1 ? 0.4 : 1,
              }}
            />
          ))}
          <span className="text-xs text-slate-500 ml-1">
            Round {currentRound}/{technique.rounds}
          </span>
        </div>

        {/* Animated circle */}
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          {/* Outer glow */}
          {isRunning && (
            <div
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                background: phaseColor,
                opacity: 0.08,
                filter: 'blur(24px)',
                transform: `scale(${circleScale})`,
                transition: `transform ${transitionDuration}s ease-in-out`,
              }}
            />
          )}

          {/* Main circle */}
          <div
            className="rounded-full flex flex-col items-center justify-center shadow-2xl"
            style={{
              width: 180,
              height: 180,
              background: `radial-gradient(circle at 38% 32%, ${phaseColor}35, ${phaseColor}12)`,
              border: `2px solid ${phaseColor}50`,
              boxShadow: isRunning ? `0 0 48px ${phaseColor}30` : 'none',
              transform: `scale(${circleScale})`,
              transition: `transform ${transitionDuration}s ease-in-out, box-shadow 0.4s ease`,
            }}
          >
            {status === 'done' ? (
              <>
                <Check className="w-10 h-10 text-green-400 mb-1" />
                <div className="text-sm font-semibold text-green-400">Complete!</div>
              </>
            ) : status === 'idle' ? (
              <>
                <Wind className="w-8 h-8 text-slate-500 mb-1" />
                <div className="text-sm text-slate-500">Ready</div>
              </>
            ) : (
              <>
                <div
                  className="text-4xl font-bold"
                  style={{ fontFamily: 'Orbitron, monospace', color: phaseColor }}
                >
                  {status === 'paused' ? '—' : phaseSecondsLeft}
                </div>
                <div className="text-sm font-semibold mt-1" style={{ color: phaseColor }}>
                  {status === 'paused' ? 'Paused' : phaseName}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Phase indicator bar */}
        <div className="flex items-center gap-2 w-full justify-center">
          {technique.phases.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.max(24, p.seconds * 6)}px`,
                  background: isRunning && i === phaseIdx ? PHASE_COLORS[p.label] : '#334155',
                  boxShadow: isRunning && i === phaseIdx ? `0 0 6px ${PHASE_COLORS[p.label]}` : 'none',
                }}
              />
              <span className="text-[9px] text-slate-600">
                {PHASE_DISPLAY[p.label][0]}{p.seconds}
              </span>
            </div>
          ))}
        </div>

        {/* Elapsed time */}
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{fmtTime(elapsedSeconds)}</span>
          <span className="text-slate-700">·</span>
          <span>
            Total: {fmtTime(technique.phases.reduce((s, p) => s + p.seconds, 0) * technique.rounds)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={status === 'idle'}
            className="p-3 rounded-xl border transition-all"
            style={{
              background: status === 'idle' ? '#1e293b' : '#334155',
              borderColor: status === 'idle' ? '#1e293b' : '#475569',
              opacity: status === 'idle' ? 0.4 : 1,
              cursor: status === 'idle' ? 'not-allowed' : 'pointer',
            }}
            title="Stop"
          >
            <Square className="w-5 h-5 text-slate-400" />
          </button>

          {/* Pause */}
          <button
            onClick={handlePause}
            disabled={status !== 'running'}
            className="p-3 rounded-xl border transition-all"
            style={{
              background: status === 'running' ? '#334155' : '#1e293b',
              borderColor: status === 'running' ? '#475569' : '#1e293b',
              opacity: status === 'running' ? 1 : 0.4,
              cursor: status === 'running' ? 'pointer' : 'not-allowed',
            }}
            title="Pause"
          >
            <Pause className="w-5 h-5 text-slate-300" />
          </button>

          {/* Start / Resume */}
          <button
            onClick={handleStart}
            disabled={status === 'running'}
            className="px-7 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2 text-sm"
            style={{
              background: status === 'running'
                ? '#1e293b'
                : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              opacity: status === 'running' ? 0.4 : 1,
              cursor: status === 'running' ? 'not-allowed' : 'pointer',
            }}
          >
            <Play className="w-5 h-5" />
            {status === 'paused' ? 'Resume' : status === 'done' ? 'Again' : 'Start'}
          </button>
        </div>
      </div>

      {/* Session history */}
      {history.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Session History</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {history.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700"
              >
                <div>
                  <div className="text-sm text-slate-200 font-medium">{entry.technique}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(entry.completedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}{' '}
                    · {entry.rounds} rounds
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{
                      background: '#10b98120',
                      color: '#10b981',
                    }}
                  >
                    {fmtTime(entry.duration)}
                  </span>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
