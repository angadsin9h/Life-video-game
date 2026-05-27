import { useState, useMemo } from 'react'
import { Shield, Brain, Target, ChevronRight, TrendingDown, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'fear_inventory_log'

const FEAR_CATEGORIES = [
  'Failure', 'Rejection', 'Abandonment', 'Death', 'Illness', 'Loss',
  'Change', 'Success', 'Vulnerability', 'Judgment', 'Uncertainty',
  'Financial', 'Conflict', 'Intimacy', 'Being Seen',
] as const

type FearCategory = typeof FEAR_CATEGORIES[number]

const ROOT_AGES = ['Childhood', 'Teenage', 'Adult', 'Unknown'] as const
type RootAge = typeof ROOT_AGES[number]

interface FearEntry {
  id: string
  date: string
  fearStatement: string
  fearCategory: FearCategory
  rootAge: RootAge
  howItLimitsYou: string
  worstCaseReality: string
  evidenceAgainstFear: string
  courageMicroStep: string
  fearStrength: number
  fearStrengthAfter: number
  fearScore: number
}

function loadEntries(): FearEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FearEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: FearEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

const CATEGORY_COLORS: Record<string, string> = {
  Failure: 'bg-red-500/20 text-red-400 border-red-500/30',
  Rejection: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Abandonment: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Death: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Illness: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Loss: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Change: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Success: 'bg-green-500/20 text-green-400 border-green-500/30',
  Vulnerability: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Judgment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Uncertainty: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Financial: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Conflict: 'bg-red-700/20 text-red-300 border-red-700/30',
  Intimacy: 'bg-pink-700/20 text-pink-300 border-pink-700/30',
  'Being Seen': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

export default function FearInventoryLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FearEntry[]>(loadEntries)

  const [fearStatement, setFearStatement] = useState('')
  const [fearCategory, setFearCategory] = useState<FearCategory>('Failure')
  const [rootAge, setRootAge] = useState<RootAge>('Unknown')
  const [howItLimitsYou, setHowItLimitsYou] = useState('')
  const [worstCaseReality, setWorstCaseReality] = useState('')
  const [evidenceAgainstFear, setEvidenceAgainstFear] = useState('')
  const [courageMicroStep, setCourageMicroStep] = useState('')
  const [fearStrength, setFearStrength] = useState(7)
  const [fearStrengthAfter, setFearStrengthAfter] = useState(5)

  const fearScore = Math.round((10 - fearStrengthAfter) * 10)

  const categoryBreakdown = useMemo(() => {
    const map: Partial<Record<FearCategory, number>> = {}
    for (const e of entries) {
      map[e.fearCategory] = (map[e.fearCategory] ?? 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [entries])

  const avgBefore = useMemo(() => {
    if (entries.length === 0) return 0
    return Math.round(entries.reduce((s, e) => s + e.fearStrength, 0) / entries.length * 10) / 10
  }, [entries])

  const avgAfter = useMemo(() => {
    if (entries.length === 0) return 0
    return Math.round(entries.reduce((s, e) => s + e.fearStrengthAfter, 0) / entries.length * 10) / 10
  }, [entries])

  const fearsFaced = useMemo(() => {
    return entries.filter(e => e.fearStrengthAfter < e.fearStrength).length
  }, [entries])

  const last5 = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [entries])

  function handleSave() {
    if (!fearStatement.trim()) return
    const entry: FearEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      fearStatement,
      fearCategory,
      rootAge,
      howItLimitsYou,
      worstCaseReality,
      evidenceAgainstFear,
      courageMicroStep,
      fearStrength,
      fearStrengthAfter,
      fearScore,
    }
    const updated = [...entries, entry]
    saveEntries(updated)
    setEntries(updated)
    setFearStatement('')
    setHowItLimitsYou('')
    setWorstCaseReality('')
    setEvidenceAgainstFear('')
    setCourageMicroStep('')
    setFearStrength(7)
    setFearStrengthAfter(5)
    toastSuccess('Fear inventory logged!', `Score: ${fearScore}/100`)
  }

  const reduction = avgBefore > 0 ? Math.round(((avgBefore - avgAfter) / avgBefore) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Shield className="w-8 h-8 text-violet-400" />
          Fear Inventory Log
        </h1>
        <p className="text-slate-400 mt-1">Map, face, and dissolve your fears systematically</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Target className="w-6 h-6 text-violet-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{fearsFaced}</div>
          <div className="text-xs text-slate-500">Fears Faced</div>
        </div>
        <div className="game-card p-4 text-center">
          <TrendingDown className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{reduction}%</div>
          <div className="text-xs text-slate-500">Avg Reduction</div>
        </div>
        <div className="game-card p-4 text-center">
          <Brain className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-500">Total Mapped</div>
        </div>
      </div>

      {/* Before vs After */}
      {entries.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Strength Before vs After Reframing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Avg Strength Before</div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(avgBefore / 10) * 100}%` }} />
              </div>
              <div className="text-sm font-bold text-red-400 mt-1">{avgBefore}/10</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Avg Strength After</div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(avgAfter / 10) * 100}%` }} />
              </div>
              <div className="text-sm font-bold text-green-400 mt-1">{avgAfter}/10</div>
            </div>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3">Fear Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map(([cat, count]) => (
              <span key={cat} className={`px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[cat] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                {cat} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Map a Fear
        </h3>

        <div>
          <label className="text-sm text-slate-300 block mb-1">I am afraid of...</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="State your fear clearly..."
            value={fearStatement}
            onChange={e => setFearStatement(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-300 block mb-1">Fear Category</label>
            <select
              className="game-input w-full"
              value={fearCategory}
              onChange={e => setFearCategory(e.target.value as FearCategory)}
            >
              {FEAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1">Root Age</label>
            <select
              className="game-input w-full"
              value={rootAge}
              onChange={e => setRootAge(e.target.value as RootAge)}
            >
              {ROOT_AGES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">How It Limits You</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="What does this fear stop you from doing?"
            value={howItLimitsYou}
            onChange={e => setHowItLimitsYou(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">Worst Case Reality</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="If this fear came true, what would ACTUALLY happen?"
            value={worstCaseReality}
            onChange={e => setWorstCaseReality(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">Evidence Against the Fear</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="Proof this fear is not as certain as it feels..."
            value={evidenceAgainstFear}
            onChange={e => setEvidenceAgainstFear(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 block mb-1">Courage Micro-Step</label>
          <input
            type="text"
            className="game-input w-full"
            placeholder="The smallest action that would face this fear..."
            value={courageMicroStep}
            onChange={e => setCourageMicroStep(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-slate-300">Fear Strength (Before)</label>
            <span className="text-sm font-bold text-red-400">{fearStrength}</span>
          </div>
          <input
            type="range" min={1} max={10} value={fearStrength}
            onChange={e => setFearStrength(Number(e.target.value))}
            className="w-full accent-red-500"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-slate-300">Fear Strength (After Reframing)</label>
            <span className="text-sm font-bold text-green-400">{fearStrengthAfter}</span>
          </div>
          <input
            type="range" min={1} max={10} value={fearStrengthAfter}
            onChange={e => setFearStrengthAfter(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div>
            <span className="text-sm text-slate-400">Fear Score</span>
            <div className="text-3xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              {fearScore}<span className="text-lg text-slate-500">/100</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Log Fear
          </button>
        </div>
      </div>

      {/* Last 5 entries */}
      {last5.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">Recent Fears Mapped</h3>
          <div className="space-y-3">
            {last5.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-lg">
                <div className="text-center min-w-[48px]">
                  <div className="text-lg font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entry.fearScore}</div>
                  <div className="text-xs text-slate-600">{entry.date.slice(5)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{entry.fearStatement}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs border ${CATEGORY_COLORS[entry.fearCategory] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {entry.fearCategory}
                    </span>
                    <span className="text-xs text-slate-500">
                      {entry.fearStrength} → {entry.fearStrengthAfter}
                      {entry.fearStrengthAfter < entry.fearStrength && (
                        <span className="text-green-400 ml-1">↓ faced</span>
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
