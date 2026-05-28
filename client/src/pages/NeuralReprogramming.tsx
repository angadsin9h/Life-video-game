import { useState, useEffect } from 'react'
import { Brain, Zap, TrendingUp, TrendingDown, ArrowRight, Timer, Star, Award, Repeat, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'neural_reprogramming_log'

const REPROGRAMMING_METHODS = [
  'Affirmation', 'Visualization', 'Journaling', 'Therapy',
  'Coaching', 'Meditation', 'Action/Evidence', 'CBT reframe',
  'EFT/Tapping', 'Hypnosis', 'Reading', 'Community',
]

const METHOD_COLORS: Record<string, string> = {
  Affirmation: 'violet',
  Visualization: 'blue',
  Journaling: 'amber',
  Therapy: 'green',
  Coaching: 'teal',
  Meditation: 'indigo',
  'Action/Evidence': 'orange',
  'CBT reframe': 'sky',
  'EFT/Tapping': 'pink',
  Hypnosis: 'purple',
  Reading: 'rose',
  Community: 'emerald',
}

interface ReprogrammingEntry {
  id: string
  date: string
  limitingBelief: string
  evidenceForLimiting: string
  newEmpoweringBelief: string
  evidenceForEmpowering: string
  reprogrammingMethod: string
  sessionDuration: number
  beliefStrength: number
  bodyFeeling: string
  commitmentAction: string
  reprogramScore: number
}

function loadLog(): ReprogrammingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ReprogrammingEntry[]
  } catch {
    return []
  }
}

function saveLog(entries: ReprogrammingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function mostCommon(arr: string[]): [string, number][] {
  const freq: Record<string, number> = {}
  arr.forEach(v => { if (v) freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4)
}

export default function NeuralReprogramming() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<ReprogrammingEntry[]>([])

  const [limitingBelief, setLimitingBelief] = useState('')
  const [evidenceForLimiting, setEvidenceForLimiting] = useState('')
  const [newEmpoweringBelief, setNewEmpoweringBelief] = useState('')
  const [evidenceForEmpowering, setEvidenceForEmpowering] = useState('')
  const [reprogrammingMethod, setReprogrammingMethod] = useState('')
  const [sessionDuration, setSessionDuration] = useState(20)
  const [beliefStrength, setBeliefStrength] = useState(5)
  const [bodyFeeling, setBodyFeeling] = useState('')
  const [commitmentAction, setCommitmentAction] = useState('')

  useEffect(() => {
    setLog(loadLog())
  }, [])

  const reprogramScore = beliefStrength * 10

  function handleSave() {
    if (!limitingBelief.trim() || !newEmpoweringBelief.trim() || !reprogrammingMethod) return
    const entry: ReprogrammingEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      limitingBelief, evidenceForLimiting,
      newEmpoweringBelief, evidenceForEmpowering,
      reprogrammingMethod, sessionDuration, beliefStrength,
      bodyFeeling, commitmentAction,
      reprogramScore,
    }
    const updated = [entry, ...log]
    saveLog(updated)
    setLog(updated)
    toastSuccess('Session Logged', `Belief strength: ${beliefStrength}/10`)
    setLimitingBelief('')
    setEvidenceForLimiting('')
    setNewEmpoweringBelief('')
    setEvidenceForEmpowering('')
    setReprogrammingMethod('')
    setSessionDuration(20)
    setBeliefStrength(5)
    setBodyFeeling('')
    setCommitmentAction('')
  }

  const totalSessions = log.length
  const avgStrength = log.length
    ? Math.round(log.reduce((s, e) => s + e.beliefStrength, 0) / log.length * 10) / 10
    : 0

  // Trending: compare last 5 vs previous 5
  const last5Avg = log.slice(0, 5).length
    ? log.slice(0, 5).reduce((s, e) => s + e.beliefStrength, 0) / log.slice(0, 5).length
    : 0
  const prev5Avg = log.slice(5, 10).length
    ? log.slice(5, 10).reduce((s, e) => s + e.beliefStrength, 0) / log.slice(5, 10).length
    : 0
  const isTrendingUp = last5Avg >= prev5Avg

  const topMethods = mostCommon(log.map(e => e.reprogrammingMethod))
  const last5 = log.slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-violet-500/20">
            <Brain className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Neural Reprogramming</h1>
            <p className="text-slate-400 text-sm">Rewrite limiting beliefs, install empowering ones</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="game-card text-center">
            <Repeat className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-violet-300">{totalSessions}</div>
            <div className="text-xs text-slate-400">Total Sessions</div>
          </div>
          <div className="game-card text-center">
            <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-xl font-bold text-amber-300">{avgStrength}/10</div>
            <div className="text-xs text-slate-400">Avg Belief Strength</div>
          </div>
          <div className="game-card text-center">
            {isTrendingUp
              ? <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              : <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
            }
            <div className={`text-sm font-bold ${isTrendingUp ? 'text-green-300' : 'text-red-300'}`}>
              {isTrendingUp ? 'Improving' : 'Needs work'}
            </div>
            <div className="text-xs text-slate-400">Trend</div>
          </div>
        </div>

        {/* Top methods */}
        {topMethods.length > 0 && (
          <div className="game-card mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Top Methods Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {topMethods.map(([method, count]) => {
                const color = METHOD_COLORS[method] || 'violet'
                return (
                  <span key={method} className={`flex items-center gap-1 px-3 py-1.5 rounded-full bg-${color}-500/15 text-${color}-300 text-sm`}>
                    {method}
                    <span className={`text-xs text-${color}-500`}>×{count}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="game-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" /> New Session
          </h2>

          <div className="space-y-4">
            {/* Limiting belief section */}
            <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/20 space-y-3">
              <h3 className="text-sm font-medium text-red-300 flex items-center gap-1">
                <Zap className="w-4 h-4" /> The Old Story (Limiting Belief)
              </h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Limiting Belief *</label>
                <input
                  className="game-input w-full"
                  placeholder='e.g. "I am not smart enough..."'
                  value={limitingBelief}
                  onChange={e => setLimitingBelief(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Why you believed it</label>
                <input
                  className="game-input w-full"
                  placeholder="Evidence that supported this old story..."
                  value={evidenceForLimiting}
                  onChange={e => setEvidenceForLimiting(e.target.value)}
                />
              </div>
            </div>

            {/* New belief section */}
            <div className="p-4 rounded-xl bg-green-500/8 border border-green-500/20 space-y-3">
              <h3 className="text-sm font-medium text-green-300 flex items-center gap-1">
                <Star className="w-4 h-4" /> The New Story (Empowering Belief)
              </h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">New Empowering Belief *</label>
                <input
                  className="game-input w-full"
                  placeholder='e.g. "I am capable and continue to grow..."'
                  value={newEmpoweringBelief}
                  onChange={e => setNewEmpoweringBelief(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Proof it's true</label>
                <input
                  className="game-input w-full"
                  placeholder="Evidence that supports the new belief..."
                  value={evidenceForEmpowering}
                  onChange={e => setEvidenceForEmpowering(e.target.value)}
                />
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reprogramming Method *</label>
              <select
                className="game-input w-full"
                value={reprogrammingMethod}
                onChange={e => setReprogrammingMethod(e.target.value)}
              >
                <option value="">Select method...</option>
                {REPROGRAMMING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                <Timer className="w-3.5 h-3.5 inline mr-1" />
                Session Duration: {sessionDuration} min
              </label>
              <input
                type="range" min={5} max={60} step={5}
                className="w-full accent-violet-500"
                value={sessionDuration}
                onChange={e => setSessionDuration(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5 min</span><span>60 min</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Belief Strength After Session: {beliefStrength}/10</label>
              <input
                type="range" min={1} max={10}
                className="w-full accent-green-500"
                value={beliefStrength}
                onChange={e => setBeliefStrength(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Barely feel it</span><span>Deep conviction</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">How does the new belief feel in your body?</label>
              <input
                className="game-input w-full"
                placeholder="Spacious, grounded, expansive..."
                value={bodyFeeling}
                onChange={e => setBodyFeeling(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">One Action to Reinforce the New Belief</label>
              <input
                className="game-input w-full"
                placeholder="What will you do today to act from this new belief?"
                value={commitmentAction}
                onChange={e => setCommitmentAction(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-slate-400">Reprogram Score</span>
              <div className="text-xl font-bold text-violet-300">{reprogramScore}/100</div>
            </div>

            <button
              onClick={handleSave}
              disabled={!limitingBelief.trim() || !newEmpoweringBelief.trim() || !reprogrammingMethod}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" /> Log Session
            </button>
          </div>
        </div>

        {/* Last 5 transformations */}
        {last5.length > 0 && (
          <div className="game-card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> Recent Transformations
            </h3>
            <div className="space-y-4">
              {last5.map(entry => {
                const methodColor = METHOD_COLORS[entry.reprogrammingMethod] || 'violet'
                return (
                  <div key={entry.id} className="p-4 rounded-xl bg-slate-700/40 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-red-300 line-through opacity-70">"{entry.limitingBelief}"</p>
                        <div className="flex items-center gap-1 my-1">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                        </div>
                        <p className="text-sm text-green-300 font-medium">"{entry.newEmpoweringBelief}"</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-violet-300">{entry.reprogramScore}</div>
                        <div className="text-xs text-slate-400">{entry.beliefStrength}/10</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${methodColor}-500/20 text-${methodColor}-300`}>
                        {entry.reprogrammingMethod}
                      </span>
                      <span className="text-xs text-slate-500">{entry.sessionDuration} min</span>
                      <span className="text-xs text-slate-500 ml-auto">{new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    {entry.commitmentAction && (
                      <p className="text-xs text-amber-300 border-t border-slate-600 pt-2">
                        → {entry.commitmentAction}
                      </p>
                    )}
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
