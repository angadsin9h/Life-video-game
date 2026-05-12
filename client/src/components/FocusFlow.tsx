import { useEffect, useRef, useState } from 'react'
import { X, Volume2, VolumeX, Wind, Droplets, Music } from 'lucide-react'

interface Props {
  onClose: () => void
  taskName: string
  category: string
  durationMinutes: number
}

type AmbientType = 'rain' | 'white' | 'brown' | 'silence'

const AMBIENT_LABELS: Record<AmbientType, { label: string; icon: React.ReactNode; desc: string }> = {
  rain:    { label: 'Rain',        icon: <Droplets className="w-4 h-4" />, desc: 'Gentle rainfall' },
  white:   { label: 'White Noise', icon: <Wind className="w-4 h-4" />,     desc: 'Steady focus noise' },
  brown:   { label: 'Brown Noise', icon: <Music className="w-4 h-4" />,    desc: 'Deep rumble' },
  silence: { label: 'Silence',     icon: <VolumeX className="w-4 h-4" />,  desc: 'Pure quiet' },
}

function createRainNode(ctx: AudioContext): AudioNode {
  const bufSize = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  // Generate rain-like noise (filtered white noise with spikes)
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 1.5 : 0.4)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.5
  src.connect(filter)
  src.start()
  return filter
}

function createNoiseNode(ctx: AudioContext, type: 'white' | 'brown'): AudioNode {
  const bufSize = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buf.getChannelData(0)
  if (type === 'white') {
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  } else {
    let b = 0
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1
      b = (b + 0.02 * white) / 1.02
      data[i] = b * 3.5
    }
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  src.start()
  return src
}

function pad(n: number) { return String(n).padStart(2, '0') }

const QUOTES = [
  "Deep work is the superpower of the 21st century.",
  "The successful warrior is the average man, with laser-like focus.",
  "One hour of focused work beats four hours of distracted effort.",
  "Flow state is where magic happens — protect this time.",
  "Every second of focus is a vote for the person you're becoming.",
]

export default function FocusFlow({ onClose, taskName, category, durationMinutes }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const [running, setRunning] = useState(false)
  const [ambient, setAmbient] = useState<AmbientType>('rain')
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<AudioNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = durationMinutes * 60
  const progress = (totalSeconds - secondsLeft) / totalSeconds
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const done = secondsLeft === 0

  const quote = QUOTES[Math.floor(Date.now() / 10000) % QUOTES.length]

  const startAudio = (type: AmbientType) => {
    stopAudio()
    if (type === 'silence') return
    try {
      const ctx = new AudioContext()
      const gain = ctx.createGain()
      gain.gain.value = muted ? 0 : volume
      gain.connect(ctx.destination)
      ctxRef.current = ctx
      gainRef.current = gain
      let node: AudioNode
      if (type === 'rain') node = createRainNode(ctx)
      else node = createNoiseNode(ctx, type as 'white' | 'brown')
      node.connect(gain)
      sourceRef.current = node
    } catch (_) {}
  }

  const stopAudio = () => {
    try { ctxRef.current?.close() } catch (_) {}
    ctxRef.current = null
    gainRef.current = null
    sourceRef.current = null
  }

  useEffect(() => {
    if (running && !done) startAudio(ambient)
    else if (!running) stopAudio()
    return stopAudio
  }, [running, ambient])

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = muted ? 0 : volume
  }, [muted, volume])

  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, done])

  const CAT_COLORS: Record<string, string> = {
    health: '#22c55e', mind: '#22d3ee', work: '#8b5cf6', social: '#facc15', growth: '#f97316'
  }
  const ringColor = CAT_COLORS[category] ?? '#8b5cf6'
  const circumference = 2 * Math.PI * 54

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors">
        <X className="w-6 h-6" />
      </button>

      {/* Task */}
      <div className="text-center mb-8">
        <div className="text-xs text-slate-600 uppercase tracking-widest mb-1">Deep Work Session</div>
        <h2 className="text-xl font-semibold text-slate-200">{taskName || 'Focus Session'}</h2>
        <div className="text-xs text-slate-500 mt-1 capitalize">{category}</div>
      </div>

      {/* Timer ring */}
      <div className="relative mb-8">
        <svg className="w-52 h-52 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#0f172a" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={done ? '#22c55e' : ringColor}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            className="transition-all duration-1000"
            style={{ filter: running && !done ? `drop-shadow(0 0 8px ${ringColor}60)` : 'none' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`text-5xl font-bold ${done ? 'text-green-400' : 'text-slate-100'}`}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {pad(mins)}:{pad(secs)}
          </div>
          <div className="text-xs text-slate-600 mt-2">
            {done ? '✓ Complete!' : running ? 'In flow...' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => { setSecondsLeft(durationMinutes * 60); setRunning(false) }}
          className="text-slate-600 hover:text-slate-400 transition-colors text-sm"
        >
          Reset
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          disabled={done}
          className={`px-8 py-3 rounded-full font-bold text-white transition-all hover:scale-105 disabled:opacity-40 ${
            running ? 'bg-orange-600 hover:bg-orange-500' : 'bg-violet-600 hover:bg-violet-500'
          }`}
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          {running ? 'PAUSE' : done ? 'DONE' : 'START'}
        </button>
      </div>

      {/* Ambient sound picker */}
      {running && (
        <div className="mb-6 space-y-3 w-full max-w-xs">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(AMBIENT_LABELS) as AmbientType[]).map(t => (
              <button
                key={t}
                onClick={() => setAmbient(t)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs transition-all ${
                  ambient === t
                    ? 'border-violet-500/60 bg-violet-600/20 text-violet-300'
                    : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {AMBIENT_LABELS[t].icon}
                <span>{AMBIENT_LABELS[t].label}</span>
              </button>
            ))}
          </div>
          {ambient !== 'silence' && (
            <div className="flex items-center gap-3">
              <button onClick={() => setMuted(m => !m)} className="text-slate-500 hover:text-slate-300">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                className="flex-1 accent-violet-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Motivational quote */}
      <p className="text-slate-700 text-xs text-center max-w-xs italic mt-auto">{quote}</p>

      {done && (
        <div className="text-center mt-4 space-y-2">
          <p className="text-green-400 font-semibold">🎉 Session complete!</p>
          <button onClick={onClose} className="game-btn-primary text-sm">Save & Return</button>
        </div>
      )}
    </div>
  )
}
