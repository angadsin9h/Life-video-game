import { useEffect, useRef, useState, useCallback } from 'react'
import { Volume2, VolumeX, Play, Square, Headphones } from 'lucide-react'

interface SoundLayer {
  id: string
  label: string
  emoji: string
  volume: number
  node: AudioBufferSourceNode | null
  gainNode: GainNode | null
}

type SoundType = 'rain' | 'whitenoise' | 'brown' | 'pink' | 'fire' | 'waves' | 'forest' | 'cafe' | 'space'

const SOUND_PRESETS = [
  { id: 'rain',       label: 'Rain',         emoji: '🌧️', color: 'text-blue-400' },
  { id: 'whitenoise', label: 'White Noise',  emoji: '🌊', color: 'text-white' },
  { id: 'brown',      label: 'Brown Noise',  emoji: '🤎', color: 'text-amber-600' },
  { id: 'pink',       label: 'Pink Noise',   emoji: '🩷', color: 'text-pink-400' },
  { id: 'fire',       label: 'Fireplace',    emoji: '🔥', color: 'text-orange-400' },
  { id: 'waves',      label: 'Ocean Waves',  emoji: '🏄', color: 'text-cyan-400' },
  { id: 'forest',     label: 'Forest',       emoji: '🌲', color: 'text-green-400' },
  { id: 'cafe',       label: 'Coffee Shop',  emoji: '☕', color: 'text-yellow-600' },
  { id: 'space',      label: 'Deep Space',   emoji: '🌌', color: 'text-violet-400' },
]

const FOCUS_PRESETS = [
  { name: 'Deep Focus', sounds: [{ id: 'brown', vol: 0.6 }, { id: 'rain', vol: 0.3 }], emoji: '🧠' },
  { name: 'Creative Flow', sounds: [{ id: 'cafe', vol: 0.5 }, { id: 'pink', vol: 0.2 }], emoji: '🎨' },
  { name: 'Meditation', sounds: [{ id: 'waves', vol: 0.5 }, { id: 'forest', vol: 0.3 }], emoji: '🧘' },
  { name: 'Night Study', sounds: [{ id: 'fire', vol: 0.4 }, { id: 'rain', vol: 0.4 }], emoji: '🌙' },
  { name: 'Power Hour', sounds: [{ id: 'whitenoise', vol: 0.7 }], emoji: '⚡' },
  { name: 'Zen Space', sounds: [{ id: 'space', vol: 0.6 }, { id: 'forest', vol: 0.2 }], emoji: '☯️' },
]

function generateNoise(ctx: AudioContext, type: SoundType, duration: number = 3): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const bufferSize = sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate)
  const data = buffer.getChannelData(0)

  if (type === 'whitenoise') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
  } else if (type === 'brown') {
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else {
    // Simulate rain/waves/fire/forest/cafe/space with layered noise
    const isRain = type === 'rain', isWaves = type === 'waves'
    const isFire = type === 'fire', isCafe = type === 'cafe'
    for (let i = 0; i < bufferSize; i++) {
      let s = Math.random() * 2 - 1
      if (isRain) {
        // Add periodic splash patterns
        const t = i / sampleRate
        s = s * 0.3 + Math.sin(t * 120) * 0.1 * (Math.random() > 0.997 ? 3 : 0.1)
      } else if (isWaves) {
        const t = i / sampleRate
        s = s * 0.2 + Math.sin(t * 0.3) * 0.6 * (Math.random() * 0.5 + 0.5)
      } else if (isFire) {
        const t = i / sampleRate
        s = s * 0.5 + Math.sin(t * 15 + Math.random()) * 0.3
      } else if (isCafe) {
        s = s * 0.15
      } else {
        s = s * (type === 'space' ? 0.08 : 0.25)
      }
      data[i] = s
    }
  }
  return buffer
}

export default function AmbientFocus() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourcesRef = useRef<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map())
  const [playing, setPlaying] = useState<Map<string, number>>(new Map())
  const [masterVol, setMasterVol] = useState(0.7)
  const masterGainRef = useRef<GainNode | null>(null)
  const [timerMins, setTimerMins] = useState(25)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      masterGainRef.current = audioCtxRef.current.createGain()
      masterGainRef.current.gain.value = masterVol
      masterGainRef.current.connect(audioCtxRef.current.destination)
    }
    return audioCtxRef.current
  }, [masterVol])

  const playSound = useCallback((soundId: string, volume: number) => {
    const ctx = getCtx()
    // Stop existing
    const existing = sourcesRef.current.get(soundId)
    if (existing) { existing.source.stop(); sourcesRef.current.delete(soundId) }

    const buffer = generateNoise(ctx, soundId as SoundType)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(masterGainRef.current!)
    source.start()
    sourcesRef.current.set(soundId, { source, gain })

    setPlaying(prev => { const n = new Map(prev); n.set(soundId, volume); return n })
  }, [getCtx])

  const stopSound = useCallback((soundId: string) => {
    const existing = sourcesRef.current.get(soundId)
    if (existing) { existing.source.stop(); sourcesRef.current.delete(soundId) }
    setPlaying(prev => { const n = new Map(prev); n.delete(soundId); return n })
  }, [])

  const toggleSound = useCallback((soundId: string) => {
    if (playing.has(soundId)) {
      stopSound(soundId)
    } else {
      playSound(soundId, 0.5)
    }
  }, [playing, playSound, stopSound])

  const setVolume = (soundId: string, vol: number) => {
    const existing = sourcesRef.current.get(soundId)
    if (existing) {
      existing.gain.gain.value = vol
    }
    setPlaying(prev => { const n = new Map(prev); n.set(soundId, vol); return n })
  }

  const applyPreset = (preset: typeof FOCUS_PRESETS[0]) => {
    // Stop all current sounds
    sourcesRef.current.forEach((_, id) => stopSound(id))
    // Apply preset
    preset.sounds.forEach(s => playSound(s.id, s.vol))
  }

  const stopAll = () => {
    sourcesRef.current.forEach((_, id) => stopSound(id))
    setPlaying(new Map())
  }

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = masterVol
    }
  }, [masterVol])

  const startTimer = () => {
    setTimeLeft(timerMins * 60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(null)
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    audioCtxRef.current?.close()
  }, [])

  const anyPlaying = playing.size > 0
  const timerDisplay = timeLeft !== null
    ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`
    : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Headphones className="w-7 h-7 text-violet-400" />
          Focus Sounds
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Ambient noise generated locally — no downloads needed</p>
      </div>

      {/* Master controls */}
      <div className="game-card p-4 border border-violet-500/20">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={stopAll} disabled={!anyPlaying}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              anyPlaying ? 'bg-red-600/30 text-red-400 border border-red-500/30 hover:bg-red-600/50' : 'bg-slate-800 text-slate-600 border border-slate-700'
            }`}>
            <Square className="w-4 h-4" />
            Stop All
          </button>
          <div className="flex-1 flex items-center gap-2">
            {masterVol === 0 ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-violet-400" />}
            <input type="range" min="0" max="1" step="0.05" value={masterVol}
              onChange={e => setMasterVol(parseFloat(e.target.value))}
              className="flex-1 accent-violet-500" />
            <span className="text-xs text-slate-500 w-8">{Math.round(masterVol * 100)}%</span>
          </div>
        </div>

        {/* Timer */}
        {timerDisplay ? (
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{timerDisplay}</div>
            <div className="text-xs text-slate-500">Focus timer</div>
            <button onClick={stopTimer} className="ml-auto text-xs text-red-400 hover:text-red-300">Stop</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Timer:</span>
            {[15, 25, 45, 60].map(m => (
              <button key={m} onClick={() => { setTimerMins(m); }}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${timerMins === m ? 'bg-violet-600/30 text-violet-400 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 bg-slate-800'}`}>
                {m}m
              </button>
            ))}
            <button onClick={startTimer}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors">
              <Play className="w-3 h-3" /> Start
            </button>
          </div>
        )}
      </div>

      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FOCUS_PRESETS.map(preset => (
            <button key={preset.name} onClick={() => applyPreset(preset)}
              className="game-card p-3 text-left hover:border-violet-500/50 transition-all group">
              <div className="text-2xl mb-1">{preset.emoji}</div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-violet-300">{preset.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {preset.sounds.map(s => SOUND_PRESETS.find(p => p.id === s.id)?.label).join(' + ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual sounds */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sounds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SOUND_PRESETS.map(sound => {
            const isOn = playing.has(sound.id)
            const vol = playing.get(sound.id) ?? 0.5
            return (
              <div key={sound.id} className={`game-card p-3 transition-all ${isOn ? 'border-violet-500/40 bg-violet-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSound(sound.id)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      isOn ? 'bg-violet-600/30 border border-violet-500/50 scale-110' : 'bg-slate-800 border border-slate-700 hover:scale-105'
                    }`}>
                    {sound.emoji}
                  </button>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${isOn ? sound.color : 'text-slate-400'}`}>{sound.label}</div>
                    {isOn && (
                      <input type="range" min="0" max="1" step="0.05" value={vol}
                        onChange={e => setVolume(sound.id, parseFloat(e.target.value))}
                        className="w-full mt-1 accent-violet-500 h-1" />
                    )}
                  </div>
                  {isOn && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-0.5 rounded-full bg-violet-400 animate-pulse`}
                          style={{ height: `${8 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-slate-700 text-center">
        Sounds are procedurally generated in your browser · No external requests
      </p>
    </div>
  )
}
