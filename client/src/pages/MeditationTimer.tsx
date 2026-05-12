import { useEffect, useRef, useState, useCallback } from 'react'
import { Wind, Play, Square, Volume2, VolumeX, ChevronDown } from 'lucide-react'

interface Session {
  name: string
  duration: number
  description: string
  inhale: number
  hold1: number
  exhale: number
  hold2: number
  color: string
  emoji: string
}

const SESSIONS: Session[] = [
  { name: 'Box Breathing', duration: 5, description: 'Equal parts — calm the nervous system', inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: '#06b6d4', emoji: '⬜' },
  { name: '4-7-8 Breath', duration: 5, description: 'Relaxation technique for sleep and anxiety', inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: '#8b5cf6', emoji: '🌙' },
  { name: 'Wim Hof Prep', duration: 3, description: 'Power breathing warm-up', inhale: 2, hold1: 0, exhale: 2, hold2: 0, color: '#f97316', emoji: '🔥' },
  { name: 'Coherent Breath', duration: 10, description: '5 breaths/min for HRV optimization', inhale: 6, hold1: 0, exhale: 6, hold2: 0, color: '#22c55e', emoji: '💚' },
  { name: 'Triangle Breath', duration: 5, description: 'Focus and clarity', inhale: 4, hold1: 4, exhale: 4, hold2: 0, color: '#eab308', emoji: '🔺' },
]

const AMBIENT = [
  { id: 'none', label: 'Silent', emoji: '🔇' },
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'bowl', label: 'Singing Bowl', emoji: '🎵' },
]

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2'
const PHASE_LABELS: Record<Phase, string> = { inhale: 'Inhale', hold1: 'Hold', exhale: 'Exhale', hold2: 'Hold' }

export default function MeditationTimer() {
  const [selectedSession, setSelectedSession] = useState<Session>(SESSIONS[0])
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<Phase>('inhale')
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(SESSIONS[0].inhale)
  const [totalTimeLeft, setTotalTimeLeft] = useState(SESSIONS[0].duration * 60)
  const [cycleCount, setCycleCount] = useState(0)
  const [ambient, setAmbient] = useState('none')
  const [breathScale, setBreathScale] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<Phase>('inhale')
  const phaseTimeRef = useRef(SESSIONS[0].inhale)
  const totalTimeRef = useRef(SESSIONS[0].duration * 60)
  const sessionRef = useRef(SESSIONS[0])

  const nextPhase = useCallback(() => {
    const s = sessionRef.current
    const phases: Phase[] = ['inhale', 'hold1', 'exhale', 'hold2'].filter(p => {
      if (p === 'hold1') return s.hold1 > 0
      if (p === 'hold2') return s.hold2 > 0
      return true
    }) as Phase[]

    const curIdx = phases.indexOf(phaseRef.current)
    const nextIdx = (curIdx + 1) % phases.length
    const nextP = phases[nextIdx]
    const nextDuration = s[nextP as keyof Session] as number

    phaseRef.current = nextP
    phaseTimeRef.current = nextDuration
    setPhase(nextP)
    setPhaseTimeLeft(nextDuration)

    if (nextIdx === 0) {
      setCycleCount(c => c + 1)
    }

    // Animate breath circle
    if (nextP === 'inhale') setBreathScale(1.6)
    else if (nextP === 'exhale') setBreathScale(1)
    else setBreathScale(prevScale => prevScale)
  }, [])

  const start = () => {
    sessionRef.current = selectedSession
    phaseRef.current = 'inhale'
    phaseTimeRef.current = selectedSession.inhale
    totalTimeRef.current = selectedSession.duration * 60
    setPhase('inhale')
    setPhaseTimeLeft(selectedSession.inhale)
    setTotalTimeLeft(selectedSession.duration * 60)
    setCycleCount(0)
    setBreathScale(1.6)
    setRunning(true)
  }

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setBreathScale(1)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      totalTimeRef.current -= 1
      setTotalTimeLeft(totalTimeRef.current)

      if (totalTimeRef.current <= 0) {
        stop()
        return
      }

      phaseTimeRef.current -= 1
      setPhaseTimeLeft(phaseTimeRef.current)

      if (phaseTimeRef.current <= 0) {
        nextPhase()
      }
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, nextPhase])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const phaseProgress = running
    ? ((sessionRef.current[phase as keyof Session] as number || 1) - phaseTimeLeft) / (sessionRef.current[phase as keyof Session] as number || 1)
    : 0

  const circumference = 2 * Math.PI * 90

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Wind className="w-7 h-7 text-cyan-400" />
          Meditation Timer
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Guided breathing for mindfulness and calm</p>
      </div>

      {/* Session selector */}
      {!running && (
        <div className="grid grid-cols-1 gap-2">
          {SESSIONS.map(s => (
            <button key={s.name} onClick={() => setSelectedSession(s)}
              className={`game-card p-3 text-left transition-all ${selectedSession.name === s.name ? 'border-2' : 'hover:border-slate-600'}`}
              style={selectedSession.name === s.name ? { borderColor: s.color } : {}}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={selectedSession.name === s.name ? { color: s.color } : { color: '#e2e8f0' }}>
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                </div>
                <div className="text-xs text-slate-600">
                  {s.inhale}s / {s.hold1 > 0 ? s.hold1 + 's / ' : ''}{s.exhale}s{s.hold2 > 0 ? ' / ' + s.hold2 + 's' : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Timer circle */}
      {running ? (
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-56 h-56">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle cx="100" cy="100" r="90" fill="none" strokeWidth="8"
                stroke={selectedSession.color}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - phaseProgress)}
                strokeLinecap="round"
                className="transition-all duration-1000" />
            </svg>

            {/* Breath circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full transition-all duration-1000"
                style={{
                  width: `${breathScale * 60}px`,
                  height: `${breathScale * 60}px`,
                  backgroundColor: selectedSession.color + '40',
                  border: `2px solid ${selectedSession.color}`,
                }} />
            </div>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-slate-200" style={{ color: selectedSession.color }}>
                {PHASE_LABELS[phase]}
              </div>
              <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                {phaseTimeLeft}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-slate-300 font-semibold">{selectedSession.name}</div>
            <div className="text-slate-500 text-sm">Cycle {cycleCount + 1} · {formatTime(totalTimeLeft)} remaining</div>
          </div>

          <button onClick={stop}
            className="flex items-center gap-2 px-6 py-3 bg-red-600/30 hover:bg-red-600/50 text-red-400 border border-red-500/30 rounded-xl font-semibold transition-colors">
            <Square className="w-4 h-4" /> End Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Duration & settings */}
          <div className="game-card p-4 flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Duration</div>
              <div className="flex gap-1.5">
                {[3, 5, 10, 15, 20].map(m => (
                  <button key={m} onClick={() => setSelectedSession(s => ({ ...s, duration: m }))}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSession.duration === m ? 'text-white' : 'text-slate-500 hover:text-slate-300 bg-slate-800'
                    }`}
                    style={selectedSession.duration === m ? { backgroundColor: selectedSession.color } : {}}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={start}
            className="w-full py-4 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
            style={{ backgroundColor: selectedSession.color, boxShadow: `0 4px 20px ${selectedSession.color}40` }}>
            <Play className="w-6 h-6" fill="white" />
            Start {selectedSession.duration}min Session
          </button>
        </div>
      )}

      {/* Tips */}
      {!running && (
        <div className="game-card p-3 text-xs text-slate-600 text-center">
          Find a comfortable position · Close your eyes · Follow the breathing guide
        </div>
      )}
    </div>
  )
}
