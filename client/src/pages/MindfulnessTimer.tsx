import { useState, useEffect, useRef } from 'react'
import { Wind, Play, Pause, RotateCcw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MindfulnessType = 'breath' | 'body-scan' | 'open-awareness' | 'loving-kindness' | 'visualization' | 'mantra' | 'gratitude' | 'movement'

interface SessionLog {
  id: string
  sessionType: MindfulnessType
  durationMinutes: number
  quality: number
  note: string
  date: string
}

const TYPE_CONFIG: Record<MindfulnessType, { label: string; emoji: string; color: string; instruction: string }> = {
  breath:            { label: 'Breath Awareness',   emoji: '🌬️', color: '#3b82f6', instruction: 'Focus on the natural rhythm of your breath. When your mind wanders, gently return to the breath.' },
  'body-scan':       { label: 'Body Scan',          emoji: '🧘', color: '#6366f1', instruction: 'Move awareness slowly from head to toe, noticing sensations without judgment.' },
  'open-awareness':  { label: 'Open Awareness',     emoji: '👁️', color: '#a855f7', instruction: 'Rest in pure awareness. Let thoughts, sounds, and sensations arise and pass without attachment.' },
  'loving-kindness': { label: 'Loving Kindness',    emoji: '❤️', color: '#ec4899', instruction: 'Send love and goodwill to yourself, loved ones, neutral people, and all beings.' },
  visualization:     { label: 'Visualization',      emoji: '🌟', color: '#f59e0b', instruction: 'Vividly imagine your ideal life, goals achieved, or a peaceful sanctuary.' },
  mantra:            { label: 'Mantra',              emoji: '🔮', color: '#84cc16', instruction: 'Silently repeat your chosen word or phrase in sync with your breath.' },
  gratitude:         { label: 'Gratitude',           emoji: '💛', color: '#22c55e', instruction: 'Rest in feeling grateful. Let warmth and appreciation fill your body.' },
  movement:          { label: 'Mindful Movement',   emoji: '🌊', color: '#0ea5e9', instruction: 'Move slowly and intentionally, staying fully present in each movement.' },
}

const DURATIONS = [3, 5, 10, 15, 20, 30, 45, 60]
const STORAGE_KEY = 'mindfulness_sessions'

export default function MindfulnessTimer() {
  const { toastSuccess } = useToast()
  const [sessions, setSessions] = useState<SessionLog[]>([])
  const [sessionType, setSessionType] = useState<MindfulnessType>('breath')
  const [duration, setDuration] = useState(10)
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [quality, setQuality] = useState(7)
  const [note, setNote] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try { setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  useEffect(() => {
    if (!isRunning) { return }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false)
          setIsComplete(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])

  const reset = () => {
    setIsRunning(false)
    setIsComplete(false)
    setTimeLeft(duration * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const handleDurationChange = (d: number) => {
    setDuration(d)
    setTimeLeft(d * 60)
    setIsRunning(false)
    setIsComplete(false)
  }

  const saveSession = () => {
    const s: SessionLog = {
      id: Date.now().toString(), sessionType, durationMinutes: duration,
      quality, note, date: new Date().toISOString().split('T')[0],
    }
    const updated = [s, ...sessions]
    setSessions(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setIsComplete(false)
    setNote('')
    toastSuccess('Session saved — mind trained 🧘')
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = 1 - timeLeft / (duration * 60)
  const t = TYPE_CONFIG[sessionType]
  const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Wind className="w-7 h-7 text-blue-400" />
          Mindfulness Timer
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Guided mindfulness sessions. Train your mind daily.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{totalMinutes}m</div>
          <div className="text-xs text-slate-500">Total Time</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">
            {sessions.length ? Math.round(sessions.reduce((s, sess) => s + sess.quality, 0) / sessions.length) : 0}/10
          </div>
          <div className="text-xs text-slate-500">Avg Quality</div>
        </div>
      </div>

      <div className="game-card p-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(TYPE_CONFIG) as [MindfulnessType, typeof TYPE_CONFIG.breath][]).map(([k, c]) => (
            <button key={k} onClick={() => { setSessionType(k); reset() }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${sessionType === k ? 'text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              style={sessionType === k ? { background: c.color } : {}}>
              {c.emoji}
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">{t.label}</p>
          <p className="text-xs text-slate-400 italic mb-3">{t.instruction}</p>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {DURATIONS.map(d => (
            <button key={d} onClick={() => handleDurationChange(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${duration === d ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {d}m
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="2" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={t.color} strokeWidth="2"
                strokeDasharray={`${progress * 100} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsRunning(r => !r)} disabled={isComplete}
              className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button onClick={reset} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isComplete && (
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <p className="text-center text-green-400 text-sm font-semibold">Session complete! 🎉</p>
            <div>
              <p className="text-xs text-slate-500 mb-1">Quality: {quality}/10</p>
              <input type="range" min={1} max={10} value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Any insights or notes?" className="game-input w-full text-sm" />
            <button onClick={saveSession} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
              Save Session
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {sessions.slice(0, 5).map(s => {
          const c = TYPE_CONFIG[s.sessionType]
          return (
            <div key={s.id} className="game-card p-3 flex items-center gap-3">
              <span className="text-lg">{c.emoji}</span>
              <div className="flex-1">
                <span className="text-xs text-white">{c.label}</span>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{s.durationMinutes}min</span>
                  <span className="text-xs text-blue-400">⭐ {s.quality}/10</span>
                  <span className="text-xs text-slate-600">{s.date}</span>
                </div>
                {s.note && <p className="text-xs text-slate-400 mt-0.5 italic">{s.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
