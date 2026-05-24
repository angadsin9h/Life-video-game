import { useState, useEffect } from 'react'
import { Heart, Plus, Shield, CheckCircle2, AlertCircle, Target, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ValueEntry {
  id: string
  date: string
  alignments: { value: string; score: number; lived: string; compromised: string }[]
  overallScore: number
  biggestMisalignment: string
  tomorrowCommitment: string
}

const VALUES_KEY = 'value_alignment_values'
const LOG_KEY = 'value_alignment_log'

function loadValues(): string[] {
  try {
    const saved = localStorage.getItem(VALUES_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function loadLog(): ValueEntry[] {
  try {
    const saved = localStorage.getItem(LOG_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function dotColor(score: number): string {
  if (score >= 8) return 'bg-green-400'
  if (score >= 6) return 'bg-blue-400'
  if (score >= 4) return 'bg-amber-400'
  return 'bg-red-400'
}

export default function ValueAlignmentLog() {
  const { toastSuccess } = useToast()
  const [values, setValues] = useState<string[]>(loadValues)
  const [setupMode, setSetupMode] = useState(false)
  const [setupInputs, setSetupInputs] = useState<string[]>(['', '', '', '', ''])
  const [log, setLog] = useState<ValueEntry[]>(loadLog)
  const [alignments, setAlignments] = useState<{ value: string; score: number; lived: string; compromised: string }[]>([])
  const [biggestMisalignment, setBiggestMisalignment] = useState('')
  const [tomorrowCommitment, setTomorrowCommitment] = useState('')
  const [showForm, setShowForm] = useState(false)

  const isSetup = values.length === 5 && values.every(v => v.trim())

  useEffect(() => {
    if (isSetup) {
      setAlignments(values.map(v => ({ value: v, score: 5, lived: '', compromised: '' })))
    }
  }, [values.join('|')])

  const handleSaveValues = () => {
    const trimmed = setupInputs.map(v => v.trim())
    if (trimmed.some(v => !v)) return
    setValues(trimmed)
    try { localStorage.setItem(VALUES_KEY, JSON.stringify(trimmed)) } catch {}
    setSetupMode(false)
    toastSuccess('Values saved!', 'Your 5 core values are set.')
  }

  const overallScore = alignments.length > 0
    ? Math.round((alignments.reduce((s, a) => s + a.score, 0) / alignments.length) * 10)
    : 0

  const handleSaveLog = () => {
    if (!isSetup) return
    const entry: ValueEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      alignments,
      overallScore,
      biggestMisalignment,
      tomorrowCommitment,
    }
    const updated = [entry, ...log]
    setLog(updated)
    try { localStorage.setItem(LOG_KEY, JSON.stringify(updated)) } catch {}
    setShowForm(false)
    setBiggestMisalignment('')
    setTomorrowCommitment('')
    toastSuccess('Alignment logged!', `Overall score: ${overallScore}`)
  }

  const last7 = log.slice(0, 7).reverse()

  if (!isSetup || setupMode) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-300 flex items-center gap-2">
              <Shield className="w-6 h-6" /> Value Alignment Log
            </h1>
            <p className="text-slate-400 text-sm mt-1">Define your 5 core values to get started</p>
          </div>
          <div className="game-card space-y-4">
            <h2 className="font-bold text-blue-300 flex items-center gap-2">
              <Star className="w-4 h-4" /> Set Up Your 5 Core Values
            </h2>
            {setupInputs.map((v, i) => (
              <div key={i}>
                <label className="text-xs text-slate-400 mb-1 block">Value {i + 1}</label>
                <input
                  className="game-input w-full"
                  placeholder={`e.g. ${['Integrity', 'Growth', 'Family', 'Health', 'Courage'][i]}`}
                  value={v}
                  onChange={e => {
                    const next = [...setupInputs]
                    next[i] = e.target.value
                    setSetupInputs(next)
                  }}
                />
              </div>
            ))}
            <button
              onClick={handleSaveValues}
              disabled={setupInputs.some(v => !v.trim())}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
            >
              Save My Values
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-300 flex items-center gap-2">
              <Shield className="w-6 h-6" /> Value Alignment Log
            </h1>
            <p className="text-slate-400 text-sm mt-1">Daily check-in on your core values</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setSetupInputs(values.map(v => v)); setSetupMode(true) }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs transition-colors"
            >
              Edit Values
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Today
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-blue-300">{log.length}</div>
            <div className="text-xs text-slate-400">Days Logged</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-green-300">
              {log.length > 0 ? Math.round(log.reduce((s, e) => s + e.overallScore, 0) / log.length) : '—'}
            </div>
            <div className="text-xs text-slate-400">Avg Alignment</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-amber-300">
              {log[0]?.overallScore ?? '—'}
            </div>
            <div className="text-xs text-slate-400">Last Score</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card space-y-5">
            <h2 className="font-bold text-blue-300 flex items-center gap-2">
              <Heart className="w-4 h-4" /> Today's Value Alignment Check-In
            </h2>

            {alignments.map((a, i) => (
              <div key={i} className="border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-200">{a.value}</span>
                  <span className="text-sm font-bold text-blue-300">{a.score}/10</span>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">How aligned were your actions with this value today?</label>
                  <input
                    type="range" min={1} max={10} step={1}
                    className="w-full accent-blue-500"
                    value={a.score}
                    onChange={e => {
                      const next = [...alignments]
                      next[i] = { ...next[i], score: Number(e.target.value) }
                      setAlignments(next)
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">One moment where you lived this value:</label>
                  <input
                    className="game-input w-full"
                    placeholder="Describe a moment..."
                    value={a.lived}
                    onChange={e => {
                      const next = [...alignments]
                      next[i] = { ...next[i], lived: e.target.value }
                      setAlignments(next)
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">One moment where you compromised this value:</label>
                  <input
                    className="game-input w-full"
                    placeholder="Describe a moment..."
                    value={a.compromised}
                    onChange={e => {
                      const next = [...alignments]
                      next[i] = { ...next[i], compromised: e.target.value }
                      setAlignments(next)
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
              <span className="text-sm text-slate-300">Overall Alignment Score</span>
              <span className="text-xl font-bold text-blue-300">{overallScore}/100</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Biggest misalignment today?</label>
              <input
                className="game-input w-full"
                placeholder="Where did you fall short?"
                value={biggestMisalignment}
                onChange={e => setBiggestMisalignment(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Tomorrow's value-action commitment</label>
              <input
                className="game-input w-full"
                placeholder="What will you do tomorrow to live your values?"
                value={tomorrowCommitment}
                onChange={e => setTomorrowCommitment(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSaveLog} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors">
                Save Alignment Log
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Last 7 Days Visual */}
        {last7.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-blue-300 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4" /> Last 7 Days Alignment
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <td className="text-slate-500 pr-3 w-24">Value</td>
                    {last7.map(e => (
                      <td key={e.id} className="text-center text-slate-500 pb-2 px-1">{e.date.slice(5)}</td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {values.map((v, vi) => (
                    <tr key={v}>
                      <td className="text-slate-300 pr-3 py-1 truncate max-w-[80px]">{v}</td>
                      {last7.map(e => {
                        const score = e.alignments[vi]?.score ?? 0
                        return (
                          <td key={e.id} className="text-center py-1 px-1">
                            <div className={`w-4 h-4 rounded-full mx-auto ${dotColor(score)}`} title={`${score}/10`} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400" /> &lt;4</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-400" /> 4-6</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400" /> 6-8</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-400" /> 8+</div>
            </div>
          </div>
        )}

        {/* Recent Log */}
        {log.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-blue-300 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4" /> Recent Entries
            </h2>
            <div className="space-y-2">
              {log.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                  <div>
                    <span className="text-sm text-slate-200">{e.date}</span>
                    {e.tomorrowCommitment && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{e.tomorrowCommitment}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-300">{e.overallScore}/100</div>
                    {e.biggestMisalignment && (
                      <div className="flex items-center gap-1 justify-end">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-300 truncate max-w-[100px]">{e.biggestMisalignment}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {log.length === 0 && (
          <div className="game-card text-center py-10 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No entries yet. Log your first alignment check-in!</p>
          </div>
        )}

      </div>
    </div>
  )
}
