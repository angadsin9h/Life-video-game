import { useState, useEffect } from 'react'
import { Activity, Heart, AlertCircle, CheckCircle2, TrendingUp, MapPin, Zap, Brain } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'body_signal_log'

const SIGNAL_TYPES = [
  'Pain', 'Tension', 'Fatigue', 'Tingling', 'Warmth', 'Heaviness',
  'Lightness', 'Nausea', 'Hunger', 'Thirst', 'Restlessness',
  'Calm', 'Energized', 'Tight chest', 'Gut feeling',
]

const TIME_OF_DAY = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night']

interface BodySignal {
  id: string
  date: string
  signalType: string
  location: string
  intensity: number
  timeOfDay: string
  possibleMessage: string
  emotionLinked: string
  responseAction: string
  resolved: boolean
  signalScore: number
}

function calcScore(intensity: number): number {
  return (10 - intensity) * 10
}

function loadLog(): BodySignal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BodySignal[]
  } catch {
    return []
  }
}

function saveLog(entries: BodySignal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function mostCommon(arr: string[]): string {
  if (!arr.length) return '-'
  const freq: Record<string, number> = {}
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
}

const SIGNAL_COLOR: Record<string, string> = {
  Pain: 'red', Tension: 'orange', Fatigue: 'amber', Tingling: 'yellow',
  Warmth: 'orange', Heaviness: 'slate', Lightness: 'sky', Nausea: 'green',
  Hunger: 'amber', Thirst: 'blue', Restlessness: 'violet',
  Calm: 'teal', Energized: 'green', 'Tight chest': 'red', 'Gut feeling': 'purple',
}

export default function BodySignalLog() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<BodySignal[]>([])

  const [signalType, setSignalType] = useState('')
  const [location, setLocation] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [timeOfDay, setTimeOfDay] = useState('')
  const [possibleMessage, setPossibleMessage] = useState('')
  const [emotionLinked, setEmotionLinked] = useState('')
  const [responseAction, setResponseAction] = useState('')
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    setLog(loadLog())
  }, [])

  const score = calcScore(intensity)

  function handleSave() {
    if (!signalType || !location.trim()) return
    const entry: BodySignal = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      signalType, location, intensity, timeOfDay,
      possibleMessage, emotionLinked, responseAction, resolved,
      signalScore: score,
    }
    const updated = [entry, ...log]
    saveLog(updated)
    setLog(updated)
    toastSuccess('Body Signal Logged', `Score: ${score}/100`)
    setSignalType('')
    setLocation('')
    setIntensity(5)
    setTimeOfDay('')
    setPossibleMessage('')
    setEmotionLinked('')
    setResponseAction('')
    setResolved(false)
  }

  const last7 = log.slice(0, 7)
  const mostCommonType = mostCommon(log.map(e => e.signalType))
  const mostCommonLocation = mostCommon(log.map(e => e.location))
  const resolutionRate = log.length
    ? Math.round((log.filter(e => e.resolved).length / log.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-green-500/20">
            <Activity className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Body Signal Log</h1>
            <p className="text-slate-400 text-sm">Listen to what your body is telling you</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="game-card text-center">
            <Activity className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">{log.length}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="game-card text-center">
            <AlertCircle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-orange-300 truncate">{mostCommonType}</div>
            <div className="text-xs text-slate-400">Top Signal</div>
          </div>
          <div className="game-card text-center">
            <MapPin className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-xs font-bold text-blue-300 truncate">{mostCommonLocation}</div>
            <div className="text-xs text-slate-400">Top Location</div>
          </div>
          <div className="game-card text-center">
            <CheckCircle2 className="w-4 h-4 text-teal-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-teal-300">{resolutionRate}%</div>
            <div className="text-xs text-slate-400">Resolved</div>
          </div>
        </div>

        {/* Form */}
        <div className="game-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" /> Log a Body Signal
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Signal Type *</label>
                <select
                  className="game-input w-full"
                  value={signalType}
                  onChange={e => setSignalType(e.target.value)}
                >
                  <option value="">Select signal...</option>
                  {SIGNAL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Time of Day</label>
                <select
                  className="game-input w-full"
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value)}
                >
                  <option value="">Select time...</option>
                  {TIME_OF_DAY.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Body Location *</label>
              <input
                className="game-input w-full"
                placeholder="Where in your body? (e.g. chest, jaw, lower back)"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Intensity: {intensity}/10</label>
              <input
                type="range" min={1} max={10}
                className="w-full accent-green-500"
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Subtle</span><span>Intense</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Possible Message</label>
              <input
                className="game-input w-full"
                placeholder="What might your body be communicating?"
                value={possibleMessage}
                onChange={e => setPossibleMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Emotion Linked</label>
              <input
                className="game-input w-full"
                placeholder="What emotion might relate to this?"
                value={emotionLinked}
                onChange={e => setEmotionLinked(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Response Action</label>
              <input
                className="game-input w-full"
                placeholder="How will you listen and respond?"
                value={responseAction}
                onChange={e => setResponseAction(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setResolved(r => !r)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  resolved
                    ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}
              >
                {resolved ? <CheckCircle2 className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                {resolved ? 'Marked as Resolved' : 'Mark as Resolved'}
              </button>
              <div className="ml-auto text-right">
                <div className="text-lg font-bold text-green-300">{score}</div>
                <div className="text-xs text-slate-400">Signal Score</div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!signalType || !location.trim()}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" /> Log Signal
            </button>
          </div>
        </div>

        {/* Body's Top Messages */}
        {log.length > 0 && (
          <div className="game-card mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" /> Body's Top Messages
            </h3>
            <div className="space-y-1">
              {Array.from(
                log.reduce((acc, e) => {
                  if (e.possibleMessage) {
                    acc.set(e.possibleMessage, (acc.get(e.possibleMessage) || 0) + 1)
                  }
                  return acc
                }, new Map<string, number>())
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([msg, count]) => (
                  <div key={msg} className="flex items-center justify-between py-1">
                    <span className="text-sm text-slate-300 truncate mr-2">"{msg}"</span>
                    <span className="text-xs text-violet-400 font-medium shrink-0">×{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Last 7 entries */}
        {last7.length > 0 && (
          <div className="game-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Last 7 Signals
            </h3>
            <div className="space-y-3">
              {last7.map(entry => {
                const color = SIGNAL_COLOR[entry.signalType] || 'violet'
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <span className={`w-2 h-2 rounded-full bg-${color}-400`} />
                      {entry.resolved && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium text-${color}-300`}>{entry.signalType}</span>
                        <span className="text-xs text-slate-400">{entry.location}</span>
                        {entry.timeOfDay && <span className="text-xs text-slate-500">{entry.timeOfDay}</span>}
                      </div>
                      {entry.possibleMessage && (
                        <p className="text-xs text-slate-400 mt-1 truncate">"{entry.possibleMessage}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-green-300">{entry.signalScore}</div>
                      <div className="text-xs text-slate-500">int: {entry.intensity}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
