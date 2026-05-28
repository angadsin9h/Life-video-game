import { useState, useEffect } from 'react'
import { Brain, Plus, X, Lightbulb, TrendingDown, TrendingUp, BarChart3, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ThoughtType = 'Limiting' | 'Empowering' | 'Neutral' | 'Worry' | 'Fantasy' | 'Memory' | 'Judgment' | 'Planning' | 'Creative' | 'Analytical'
type FrequencyType = 'First time' | 'Occasional' | 'Regular' | 'Constant'
type EmotionType = 'Fear' | 'Anger' | 'Sadness' | 'Joy' | 'Excitement' | 'Peace' | 'Shame' | 'Guilt' | 'Hope' | 'Anxiety' | 'Confidence' | 'Confusion'
type TruthType = 'Definitely true' | 'Probably true' | 'Uncertain' | 'Probably false' | 'Definitely false'

interface ThoughtEntry {
  id: string
  thoughtContent: string
  thoughtType: ThoughtType
  frequency: FrequencyType
  believability: number
  emotionItCreates: EmotionType
  isItTrue: TruthType
  alternativeThought: string
  actionableInsight: string
  thoughtScore: number
  date: string
}

const STORAGE_KEY = 'thought_audit_log'

const THOUGHT_TYPES: ThoughtType[] = ['Limiting', 'Empowering', 'Neutral', 'Worry', 'Fantasy', 'Memory', 'Judgment', 'Planning', 'Creative', 'Analytical']
const FREQUENCIES: FrequencyType[] = ['First time', 'Occasional', 'Regular', 'Constant']
const EMOTIONS: EmotionType[] = ['Fear', 'Anger', 'Sadness', 'Joy', 'Excitement', 'Peace', 'Shame', 'Guilt', 'Hope', 'Anxiety', 'Confidence', 'Confusion']
const TRUTHS: TruthType[] = ['Definitely true', 'Probably true', 'Uncertain', 'Probably false', 'Definitely false']

function computeScore(type: ThoughtType, believability: number): number {
  if (type === 'Empowering' || type === 'Creative' || type === 'Analytical') return 9 * 10
  if (type === 'Planning') return 7 * 10
  if (type === 'Neutral' || type === 'Memory' || type === 'Fantasy') return 5 * 10
  return (10 - believability) * 10
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const TYPE_COLORS: Record<ThoughtType, string> = {
  Limiting: 'bg-red-500',
  Empowering: 'bg-green-500',
  Neutral: 'bg-slate-400',
  Worry: 'bg-orange-500',
  Fantasy: 'bg-purple-400',
  Memory: 'bg-blue-400',
  Judgment: 'bg-amber-500',
  Planning: 'bg-cyan-500',
  Creative: 'bg-violet-500',
  Analytical: 'bg-teal-500',
}

export default function MindReset() {
  const { toastSuccess } = useToast()

  const [entries, setEntries] = useState<ThoughtEntry[]>([])
  const [showForm, setShowForm] = useState(false)

  const [thoughtContent, setThoughtContent] = useState('')
  const [thoughtType, setThoughtType] = useState<ThoughtType>('Limiting')
  const [frequency, setFrequency] = useState<FrequencyType>('Occasional')
  const [believability, setBelievability] = useState(5)
  const [emotionItCreates, setEmotionItCreates] = useState<EmotionType>('Fear')
  const [isItTrue, setIsItTrue] = useState<TruthType>('Uncertain')
  const [alternativeThought, setAlternativeThought] = useState('')
  const [actionableInsight, setActionableInsight] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setEntries(JSON.parse(stored))
    } catch { /**/ }
  }, [])

  function save(updated: ThoughtEntry[]) {
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /**/ }
  }

  function handleSubmit() {
    if (!thoughtContent.trim()) return
    const score = computeScore(thoughtType, believability)
    const entry: ThoughtEntry = {
      id: Date.now().toString(),
      thoughtContent: thoughtContent.trim(),
      thoughtType,
      frequency,
      believability,
      emotionItCreates,
      isItTrue,
      alternativeThought: alternativeThought.trim(),
      actionableInsight: actionableInsight.trim(),
      thoughtScore: score,
      date: todayStr(),
    }
    save([entry, ...entries])
    toastSuccess('Thought audited!', `Score: ${score}/100`)
    setThoughtContent('')
    setThoughtType('Limiting')
    setFrequency('Occasional')
    setBelievability(5)
    setEmotionItCreates('Fear')
    setIsItTrue('Uncertain')
    setAlternativeThought('')
    setActionableInsight('')
    setShowForm(false)
  }

  function deleteEntry(id: string) {
    save(entries.filter(e => e.id !== id))
  }

  const last7 = entries.slice(0, 7)

  // Type breakdown
  const typeCounts: Partial<Record<ThoughtType, number>> = {}
  for (const e of entries) {
    typeCounts[e.thoughtType] = (typeCounts[e.thoughtType] ?? 0) + 1
  }
  const maxTypeCount = Math.max(...Object.values(typeCounts), 1)

  // Avg believability for limiting
  const limiting = entries.filter(e => e.thoughtType === 'Limiting')
  const avgLimitingBelief = limiting.length
    ? Math.round((limiting.reduce((s, e) => s + e.believability, 0) / limiting.length) * 10) / 10
    : 0

  // Thought shift stat: limiting entries that have an alternativeThought
  const thoughtShifts = limiting.filter(e => e.alternativeThought.length > 0).length

  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-xl">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mind Reset</h1>
              <p className="text-slate-400 text-sm">Notice, categorize & transform your thoughts</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors font-medium"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Audit Thought'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">{entries.length}</div>
            <div className="text-xs text-slate-400 mt-1">Total Audits</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{avgLimitingBelief || '—'}</div>
            <div className="text-xs text-slate-400 mt-1">Avg Limiting Belief</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{thoughtShifts}</div>
            <div className="text-xs text-slate-400 mt-1">Thought Shifts</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{limiting.length}</div>
            <div className="text-xs text-slate-400 mt-1">Limiting Thoughts</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-violet-300 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" /> Audit a Thought
            </h2>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">What's the thought?</label>
              <textarea
                className="game-input w-full h-24 resize-none"
                placeholder="Write the thought exactly as it appears in your mind..."
                value={thoughtContent}
                onChange={e => setThoughtContent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Thought Type</label>
                <select className="game-input w-full" value={thoughtType} onChange={e => setThoughtType(e.target.value as ThoughtType)}>
                  {THOUGHT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Frequency</label>
                <select className="game-input w-full" value={frequency} onChange={e => setFrequency(e.target.value as FrequencyType)}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Emotion It Creates</label>
                <select className="game-input w-full" value={emotionItCreates} onChange={e => setEmotionItCreates(e.target.value as EmotionType)}>
                  {EMOTIONS.map(em => <option key={em}>{em}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Is It True?</label>
                <select className="game-input w-full" value={isItTrue} onChange={e => setIsItTrue(e.target.value as TruthType)}>
                  {TRUTHS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">
                Believability: <span className="text-violet-300 font-bold">{believability}/10</span>
              </label>
              <input
                type="range" min={1} max={10} step={1}
                value={believability}
                onChange={e => setBelievability(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Alternative Thought (more useful / accurate)</label>
              <input
                className="game-input w-full"
                placeholder="Reframe it..."
                value={alternativeThought}
                onChange={e => setAlternativeThought(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Actionable Insight</label>
              <input
                className="game-input w-full"
                placeholder="What will you do with this awareness?"
                value={actionableInsight}
                onChange={e => setActionableInsight(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Projected score: <span className={`font-bold ${scoreColor(computeScore(thoughtType, believability))}`}>{computeScore(thoughtType, believability)}/100</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!thoughtContent.trim()}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Audit
              </button>
            </div>
          </div>
        )}

        {/* Type Breakdown */}
        {entries.length > 0 && (
          <div className="game-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Thought Type Breakdown
            </h2>
            <div className="space-y-2">
              {THOUGHT_TYPES.filter(t => typeCounts[t]).map(type => (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-slate-400 text-right">{type}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${TYPE_COLORS[type]} rounded-full transition-all`}
                      style={{ width: `${((typeCounts[type] ?? 0) / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-300 w-6 text-right">{typeCounts[type]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last 7 Entries */}
        {last7.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" /> Last 7 Thought Audits
            </h2>
            {last7.map(entry => (
              <div key={entry.id} className="game-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.thoughtType]} bg-opacity-20 text-white`}>
                        {entry.thoughtType}
                      </span>
                      <span className="text-xs text-slate-400">{entry.frequency}</span>
                      <span className="text-xs text-slate-500">{entry.date}</span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">&ldquo;{entry.thoughtContent}&rdquo;</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span>Believe: <span className="text-amber-400">{entry.believability}/10</span></span>
                      <span>Emotion: <span className="text-blue-400">{entry.emotionItCreates}</span></span>
                      <span>Truth: <span className="text-slate-300">{entry.isItTrue}</span></span>
                    </div>
                    {entry.alternativeThought && (
                      <div className="flex items-start gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg p-2">
                        <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{entry.alternativeThought}</span>
                      </div>
                    )}
                    {entry.actionableInsight && (
                      <div className="flex items-start gap-2 text-xs text-cyan-400 bg-cyan-500/10 rounded-lg p-2">
                        <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{entry.actionableInsight}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`text-lg font-bold ${scoreColor(entry.thoughtScore)}`}>{entry.thoughtScore}</div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <div className="game-card p-12 text-center space-y-3">
            <Brain className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400">No thoughts audited yet.</p>
            <p className="text-slate-500 text-sm">Start by clicking &ldquo;Audit Thought&rdquo; above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
