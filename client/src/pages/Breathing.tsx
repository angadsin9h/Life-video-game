import { useEffect, useRef, useState, useCallback } from 'react'
import { Wind, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface Pattern {
  name: string
  description: string
  phases: { label: string; duration: number; color: string }[]
  rounds: number
  benefit: string
}

const PATTERNS: Pattern[] = [
  {
    name: '4-7-8 Relaxing',
    description: 'Inhale 4s • Hold 7s • Exhale 8s',
    benefit: 'Reduces anxiety, promotes sleep',
    rounds: 4,
    phases: [
      { label: 'Inhale', duration: 4, color: '#8b5cf6' },
      { label: 'Hold', duration: 7, color: '#06b6d4' },
      { label: 'Exhale', duration: 8, color: '#10b981' },
    ],
  },
  {
    name: 'Box Breathing',
    description: 'Inhale 4s • Hold 4s • Exhale 4s • Hold 4s',
    benefit: 'Focus, stress relief, used by Navy SEALs',
    rounds: 5,
    phases: [
      { label: 'Inhale', duration: 4, color: '#8b5cf6' },
      { label: 'Hold', duration: 4, color: '#06b6d4' },
      { label: 'Exhale', duration: 4, color: '#10b981' },
      { label: 'Hold', duration: 4, color: '#f59e0b' },
    ],
  },
  {
    name: '4-4 Calm',
    description: 'Inhale 4s • Exhale 4s',
    benefit: 'Simple, ideal for beginners',
    rounds: 6,
    phases: [
      { label: 'Inhale', duration: 4, color: '#8b5cf6' },
      { label: 'Exhale', duration: 4, color: '#10b981' },
    ],
  },
  {
    name: '5-5 Coherence',
    description: 'Inhale 5s • Exhale 5s',
    benefit: 'Heart rate variability, deep calm',
    rounds: 6,
    phases: [
      { label: 'Inhale', duration: 5, color: '#8b5cf6' },
      { label: 'Exhale', duration: 5, color: '#10b981' },
    ],
  },
  {
    name: 'Energizing 2-1-4',
    description: 'Inhale 2s • Hold 1s • Exhale 4s',
    benefit: 'Morning energy boost',
    rounds: 8,
    phases: [
      { label: 'Inhale', duration: 2, color: '#f59e0b' },
      { label: 'Hold', duration: 1, color: '#8b5cf6' },
      { label: 'Exhale', duration: 4, color: '#10b981' },
    ],
  },
]

const CIRCLE_MIN = 80
const CIRCLE_MAX = 160

export default function Breathing() {
  const [patternIdx, setPatternIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0) // 0..1
  const [roundsDone, setRoundsDone] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [done, setDone] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const rafRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(0)
  const phaseStartRef = useRef<number>(0)
  const totalSecondsRef = useRef<number>(0)
  const stateRef = useRef({ phaseIdx: 0, roundsDone: 0 })

  const pattern = PATTERNS[patternIdx]

  const totalPhases = pattern.phases.length
  const totalRounds = pattern.rounds
  const totalDuration = pattern.phases.reduce((s, p) => s + p.duration, 0) * totalRounds

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setRunning(false)
    setPhaseIdx(0)
    setPhaseProgress(0)
    setRoundsDone(0)
    setTotalSeconds(0)
    setDone(false)
    stateRef.current = { phaseIdx: 0, roundsDone: 0 }
    totalSecondsRef.current = 0
  }, [])

  useEffect(() => { reset() }, [patternIdx, reset])

  const tick = useCallback((ts: number) => {
    const elapsed = (ts - phaseStartRef.current) / 1000
    const totalElapsed = (ts - startTimeRef.current) / 1000
    totalSecondsRef.current = totalElapsed
    setTotalSeconds(Math.floor(totalElapsed))

    const { phaseIdx: pIdx, roundsDone: rDone } = stateRef.current
    const phase = pattern.phases[pIdx]
    const progress = Math.min(elapsed / phase.duration, 1)
    setPhaseProgress(progress)

    if (elapsed >= phase.duration) {
      const nextPhase = (pIdx + 1) % totalPhases
      const nextRound = nextPhase === 0 ? rDone + 1 : rDone

      if (nextPhase === 0 && nextRound >= totalRounds) {
        setRunning(false)
        setDone(true)
        setPhaseIdx(0)
        setPhaseProgress(1)
        return
      }

      stateRef.current = { phaseIdx: nextPhase, roundsDone: nextRound }
      setPhaseIdx(nextPhase)
      setRoundsDone(nextRound)
      phaseStartRef.current = ts
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [pattern, totalPhases, totalRounds])

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    rafRef.current = requestAnimationFrame((ts) => {
      startTimeRef.current = ts - totalSecondsRef.current * 1000
      phaseStartRef.current = ts
      rafRef.current = requestAnimationFrame(tick)
    })
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, tick])

  const currentPhase = pattern.phases[phaseIdx]
  const isInhale = currentPhase.label === 'Inhale'
  const isExhale = currentPhase.label === 'Exhale'

  const circleSize = (() => {
    if (isInhale) return CIRCLE_MIN + (CIRCLE_MAX - CIRCLE_MIN) * phaseProgress
    if (isExhale) return CIRCLE_MAX - (CIRCLE_MAX - CIRCLE_MIN) * phaseProgress
    return (phaseIdx === 0 || pattern.phases[phaseIdx - 1]?.label === 'Inhale') ? CIRCLE_MAX : CIRCLE_MIN
  })()

  const glowColor = currentPhase.color
  const secondsLeft = Math.max(0, Math.ceil(currentPhase.duration - phaseProgress * currentPhase.duration))
  const phaseName = running || done ? currentPhase.label : 'Ready'
  const overallProgress = totalDuration > 0 ? Math.min(totalSecondsRef.current / totalDuration, 1) : 0

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Wind className="w-8 h-8 text-cyan-400" />
          Breathing
        </h1>
        <p className="text-slate-400 mt-1">Calm your nervous system in minutes</p>
      </div>

      {/* Pattern selector */}
      <div className="w-full max-w-md">
        <button
          onClick={() => setShowSelector(s => !s)}
          className="w-full game-card p-4 flex items-center justify-between"
        >
          <div className="text-left">
            <div className="font-semibold text-slate-200">{pattern.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{pattern.description}</div>
          </div>
          {showSelector ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showSelector && (
          <div className="mt-1 game-card p-2 space-y-1">
            {PATTERNS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => { setPatternIdx(i); setShowSelector(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  i === patternIdx ? 'bg-violet-600/20 text-violet-400' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">{p.benefit}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Animated circle */}
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
        {/* Outer ring pulse */}
        {running && (
          <div
            className="absolute rounded-full opacity-20 transition-all"
            style={{
              width: circleSize + 40,
              height: circleSize + 40,
              background: glowColor,
              filter: `blur(20px)`,
              transitionDuration: '100ms',
            }}
          />
        )}

        {/* Phase rings */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border opacity-10"
            style={{
              width: circleSize + i * 20,
              height: circleSize + i * 20,
              borderColor: glowColor,
              transitionDuration: '100ms',
            }}
          />
        ))}

        {/* Main circle */}
        <div
          className="rounded-full flex flex-col items-center justify-center transition-all shadow-2xl"
          style={{
            width: circleSize,
            height: circleSize,
            background: `radial-gradient(circle at 40% 35%, ${glowColor}40, ${glowColor}15)`,
            border: `2px solid ${glowColor}60`,
            boxShadow: running ? `0 0 40px ${glowColor}40` : 'none',
            transitionDuration: '100ms',
          }}
        >
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
            {running ? secondsLeft : done ? '✓' : ''}
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: glowColor }}>
            {phaseName}
          </div>
          {running && (
            <div className="text-xs text-slate-400 mt-0.5">
              Round {roundsDone + 1}/{totalRounds}
            </div>
          )}
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex items-center gap-3">
        {pattern.phases.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: running && i === phaseIdx ? p.color : '#334155',
                boxShadow: running && i === phaseIdx ? `0 0 6px ${p.color}` : 'none',
              }}
            />
            <span className="text-xs text-slate-600">{p.label[0]}{p.duration}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{fmtTime(Math.floor(totalSecondsRef.current))}</span>
            <span>{fmtTime(totalDuration)}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${overallProgress * 100}%`, background: 'linear-gradient(to right, #8b5cf6, #06b6d4)' }}
            />
          </div>
        </div>
      )}

      {/* Done message */}
      {done && (
        <div className="game-card p-4 text-center max-w-md w-full border border-green-500/30 bg-green-900/10">
          <div className="text-2xl mb-1">🌊</div>
          <div className="text-green-400 font-semibold">Session complete!</div>
          <div className="text-sm text-slate-400 mt-1">{totalRounds} rounds of {pattern.name} — {fmtTime(totalDuration)} of focused breathing.</div>
          <div className="text-xs text-slate-500 mt-2">{pattern.benefit}</div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => { setRunning(r => !r); if (done) { reset(); setTimeout(() => setRunning(true), 50) } }}
          className="px-8 py-3 rounded-xl font-semibold text-white transition-all flex items-center gap-2"
          style={{
            background: running ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            border: running ? '1px solid #475569' : '1px solid transparent',
          }}
        >
          {running ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> {done ? 'Again' : 'Start'}</>}
        </button>
      </div>

      {/* Info */}
      {!running && !done && (
        <div className="game-card p-4 max-w-md w-full text-center">
          <div className="text-sm text-slate-400">{pattern.benefit}</div>
          <div className="text-xs text-slate-600 mt-1">
            {totalRounds} rounds · ~{fmtTime(totalDuration)} total
          </div>
        </div>
      )}
    </div>
  )
}
