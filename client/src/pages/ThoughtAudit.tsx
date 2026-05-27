import { useState, useEffect } from 'react'
import { Brain, Plus, X, TrendingDown, TrendingUp, BarChart3, Lightbulb, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ThoughtType = 'Limiting' | 'Empowering' | 'Neutral' | 'Worry' | 'Fantasy' | 'Memory' | 'Judgment' | 'Planning' | 'Creative' | 'Analytical'
type Frequency = 'First time' | 'Occasional' | 'Regular' | 'Constant'
type Emotion = 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Excitement' | 'Peace' | 'Shame' | 'Guilt' | 'Hope' | 'Anxiety' | 'Confidence' | 'Confusion'
type TruthLevel = 'Definitely true' | 'Probably true' | 'Uncertain' | 'Probably false' | 'Definitely false'

interface ThoughtEntry {
  id: string
  date: string
  thoughtContent: string
  thoughtType: ThoughtType
  frequency: Frequency
  believability: number
  emotionItCreates: Emotion
  isItTrue: TruthLevel
  alternativeThought: string
  actionableInsight: string
  thoughtScore: number
}

const STORAGE_KEY = 'thought_audit_log'

const THOUGHT_TYPES: ThoughtType[] = ['Limiting', 'Empowering', 'Neutral', 'Worry', 'Fantasy', 'Memory', 'Judgment', 'Planning', 'Creative', 'Analytical']
const FREQUENCIES: Frequency[] = ['First time', 'Occasional', 'Regular', 'Constant']
const EMOTIONS: Emotion[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Excitement', 'Peace', 'Shame', 'Guilt', 'Hope', 'Anxiety', 'Confidence', 'Confusion']
const TRUTH_LEVELS: TruthLevel[] = ['Definitely true', 'Probably true', 'Uncertain', 'Probably false', 'Definitely false']

function computeThoughtScore(type: ThoughtType, believability: number): number {
  if (type === 'Empowering' || type === 'Creative' || type === 'Analytical') return 9 * 10
  if (type === 'Planning') return 7 * 10
  if (type === 'Neutral' || type === 'Memory' || type === 'Fantasy') return 5 * 10
  // Worry, Judgment, Limiting
  return (10 - believability) * 10
}

const TYPE_COLORS: Record<ThoughtType, string> = {
  Empowering: 'bg-green-500',
  Creative: 'bg-violet-500',
  Analytical: 'bg-blue-500',
  Planning: 'bg-amber-500',
  Neutral: 'bg-slate-400',
  Memory: 'bg-cyan-500',
  Fantasy: 'bg-pink-500',
  Worry: 'bg-red-500',
  Judgment: 'bg-orange-500',
  Limiting: 'bg-rose-600',
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ThoughtAudit() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ThoughtEntry[]>([])
  const [showForm, setShowForm] = useState(false)

  const [thoughtContent, setThoughtContent] = useState('')
  const [thoughtType, setThoughtType] = useState<ThoughtType>('Limiting')
  const [frequency, setFrequency] = useState<Frequency>('Occasional')
  const [believability, setBelievability] = useState(5)
  const [emotionItCreates, setEmotionItCreates] = useState<Emotion>('Anxiety')
  const [isItTrue, setIsItTrue] = useState<TruthLevel>('Uncertain')
  const [alternativeThought, setAlternativeThought] = useState('')
  const [actionableInsight, setActionableInsight] = useState('')

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  function save(updated: ThoughtEntry[]) {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function handleSubmit() {
    if (!thoughtContent.trim()) return
    const score = computeThoughtScore(thoughtType, believability)
    const entry: ThoughtEntry = {
      id: Date.now().toString(),
      date: todayStr(),
      thoughtContent: thoughtContent.trim(),
      thoughtType,
      frequency,
      believability,
      emotionItCreates,
      isItTrue,
      alternativeThought: alternativeThought.trim(),
      actionableInsight: actionableInsight.trim(),
      thoughtScore: score,
    }
    save([entry, ...entries])
    toastSuccess('Thought Audited', `Score: ${score}/100`)
    setThoughtContent('')
    setThoughtType('Limiting')
    setFrequency('Occasional')
    setBelievability(5)
    setEmotionItCreates('Anxiety')
    setIsItTrue('Uncertain')
    setAlternativeThought('')
    setActionableInsight('')
    setShowForm(false)
  }

  function removeEntry(id: string) {
    save(entries.filter(e => e.id !== id))
  }

  const last7 = entries.slice(0, 7)

  // Type breakdown
  const typeCounts: Partial<Record<ThoughtType, number>> = {}
  for (const e of entries) {
    typeCounts[e.thoughtType] = (typeCounts[e.thoughtType] ?? 0) + 1
  }
  const total = entries.length

  // Avg believability for limiting thoughts
  const limitingEntries = entries.filter(e => e.thoughtType === 'Limiting')
  const avgLimitingBelievability = limitingEntries.length
    ? Math.round((limitingEntries.reduce((s, e) => s + e.believability, 0) / limitingEntries.length) * 10) / 10
    : 0

  // Thought shift: limiting entries with alternativeThought
  const thoughtShifts = entries.filter(e =>
    (e.thoughtType === 'Limiting' || e.thoughtType === 'Worry' || e.thoughtType === 'Judgment') &&
    e.alternativeThought.length > 0
  ).length

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Thought Audit</h1>
              <p className="text-slate-400 text-sm">Notice, categorize, and transform your thoughts</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Audit Thought'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-violet-400">{total}</div>
            <div className="text-slate-400 text-xs mt-1">Total Thoughts</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-amber-400">{avgLimitingBelievability}</div>
            <div className="text-slate-400 text-xs mt-1">Avg Limiting Believability</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-green-400">{thoughtShifts}</div>
            <div className="text-slate-400 text-xs mt-1">Thought Shifts</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-blue-400">{limitingEntries.length}</div>
            <div className="text-slate-400 text-xs mt-1">Limiting Thoughts</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Audit a Thought
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">What's the thought?</label>
                <textarea
                  className="game-input w-full h-24 resize-none"
                  placeholder="Describe the thought as it appeared in your mind..."
                  value={thoughtContent}
                  onChange={e => setThoughtContent(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Thought Type</label>
                  <select className="game-input w-full" value={thoughtType} onChange={e => setThoughtType(e.target.value as ThoughtType)}>
                    {THOUGHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Frequency</label>
                  <select className="game-input w-full" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Emotion It Creates</label>
                  <select className="game-input w-full" value={emotionItCreates} onChange={e => setEmotionItCreates(e.target.value as Emotion)}>
                    {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Is It True?</label>
                  <select className="game-input w-full" value={isItTrue} onChange={e => setIsItTrue(e.target.value as TruthLevel)}>
                    {TRUTH_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Believability: <span className="text-violet-400 font-bold">{believability}/10</span>
                </label>
                <input
                  type="range" min={1} max={10} value={believability}
                  onChange={e => setBelievability(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Alternative Thought (more useful / accurate)</label>
                <input
                  className="game-input w-full"
                  placeholder="What's a more empowering way to see this?"
                  value={alternativeThought}
                  onChange={e => setAlternativeThought(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Actionable Insight</label>
                <input
                  className="game-input w-full"
                  placeholder="What will you do with this awareness?"
                  value={actionableInsight}
                  onChange={e => setActionableInsight(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-slate-400 text-sm">
                  Score preview: <span className="text-violet-400 font-bold">{computeThoughtScore(thoughtType, believability)}/100</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!thoughtContent.trim()}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
                >
                  Save Audit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Type Breakdown */}
          <div className="game-card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Thought Type Breakdown
            </h3>
            {total === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No thoughts audited yet</p>
            ) : (
              <div className="space-y-2">
                {THOUGHT_TYPES.filter(t => (typeCounts[t] ?? 0) > 0).map(type => {
                  const count = typeCounts[type] ?? 0
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{type}</span>
                        <span className="text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${TYPE_COLORS[type]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Thought Shift Stats */}
          <div className="game-card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-400" />
              Thought Shift Stats
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-green-400">{thoughtShifts}</div>
                <div className="text-slate-400 text-sm mt-1">Limiting thoughts reframed</div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300 text-sm">Limiting thought believability</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{avgLimitingBelievability}<span className="text-slate-500 text-sm">/10</span></div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Shift rate</span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {limitingEntries.length > 0 ? Math.round((thoughtShifts / limitingEntries.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Last 7 Entries */}
        <div className="game-card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            Recent Thought Audits
          </h3>
          {last7.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No thoughts audited yet. Start by clicking "Audit Thought".</p>
          ) : (
            <div className="space-y-3">
              {last7.map(entry => (
                <div key={entry.id} className="bg-slate-700/50 rounded-xl p-4 relative">
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3 pr-6">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${TYPE_COLORS[entry.thoughtType]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300">{entry.thoughtType}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300">{entry.emotionItCreates}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-300">{entry.frequency}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300">{entry.thoughtScore}/100</span>
                      </div>
                      <p className="text-slate-200 text-sm mb-1 line-clamp-2">{entry.thoughtContent}</p>
                      {entry.alternativeThought && (
                        <p className="text-green-400 text-xs mt-2">
                          <span className="text-slate-500">Alt: </span>{entry.alternativeThought}
                        </p>
                      )}
                      <div className="text-slate-500 text-xs mt-2">
                        Believability: {entry.believability}/10 · {entry.isItTrue} · {entry.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
