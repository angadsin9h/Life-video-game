import { useState, useEffect } from 'react'
import { Trophy, Plus, Star, BarChart3, Lightbulb, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Domain = 'Career' | 'Health' | 'Relationships' | 'Finance' | 'Learning' | 'Creative' | 'Personal' | 'Spiritual'
type Magnitude = 'Small' | 'Meaningful' | 'Significant' | 'Life-Changing'
type HowLong = 'Days' | 'Weeks' | 'Months' | 'Years'

interface SuccessEntry {
  id: string
  successTitle: string
  domain: Domain
  magnitude: Magnitude
  dateAchieved: string
  howLongItTook: HowLong
  keyActions: string
  mindsetUsed: string
  habitsThatHelped: string
  resourcesUsed: string
  biggestObstacleOvercome: string
  wouldDoAgain: string
  wouldDoDifferently: string
  lessonForOthers: string
  successScore: number
  createdAt: string
}

const STORAGE_KEY = 'success_blueprint_log'

const DOMAIN_COLORS: Record<Domain, string> = {
  Career: '#6366f1',
  Health: '#22c55e',
  Relationships: '#ec4899',
  Finance: '#f59e0b',
  Learning: '#3b82f6',
  Creative: '#f97316',
  Personal: '#a855f7',
  Spiritual: '#14b8a6',
}

const MAGNITUDE_COLORS: Record<Magnitude, string> = {
  'Small': '#64748b',
  'Meaningful': '#3b82f6',
  'Significant': '#a855f7',
  'Life-Changing': '#f59e0b',
}

const DOMAINS: Domain[] = ['Career', 'Health', 'Relationships', 'Finance', 'Learning', 'Creative', 'Personal', 'Spiritual']
const MAGNITUDES: Magnitude[] = ['Small', 'Meaningful', 'Significant', 'Life-Changing']
const HOW_LONGS: HowLong[] = ['Days', 'Weeks', 'Months', 'Years']

function topWords(items: string[]): string[] {
  const freq: Record<string, number> = {}
  items.forEach(s => {
    s.toLowerCase().split(/\W+/).filter(w => w.length > 4).forEach(w => {
      freq[w] = (freq[w] ?? 0) + 1
    })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w)
}

export default function SuccessBlueprintLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SuccessEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SuccessEntry, 'id' | 'createdAt'>>({
    successTitle: '',
    domain: 'Career',
    magnitude: 'Meaningful',
    dateAchieved: new Date().toISOString().split('T')[0],
    howLongItTook: 'Weeks',
    keyActions: '',
    mindsetUsed: '',
    habitsThatHelped: '',
    resourcesUsed: '',
    biggestObstacleOvercome: '',
    wouldDoAgain: '',
    wouldDoDifferently: '',
    lessonForOthers: '',
    successScore: 7,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SuccessEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const submit = () => {
    if (!form.successTitle.trim()) return
    const e: SuccessEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({
      ...f, successTitle: '', keyActions: '', mindsetUsed: '', habitsThatHelped: '',
      resourcesUsed: '', biggestObstacleOvercome: '', wouldDoAgain: '', wouldDoDifferently: '', lessonForOthers: '',
    }))
    setShowForm(false)
    toastSuccess('Success blueprint captured — your formula grows stronger!')
  }

  const last10 = entries.slice(0, 10)

  const domainCounts = DOMAINS.reduce<Record<Domain, number>>((acc, d) => {
    acc[d] = entries.filter(e => e.domain === d).length
    return acc
  }, {} as Record<Domain, number>)
  const maxDomainCount = Math.max(1, ...Object.values(domainCounts))

  const patternWords = topWords(entries.map(e => e.mindsetUsed).filter(Boolean))

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-amber-400" />
            Success Blueprint
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Reverse-engineer your successes to find your personal formula.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Successes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">
            {entries.filter(e => e.magnitude === 'Life-Changing').length}
          </div>
          <div className="text-xs text-slate-500">Life-Changing</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">
            {entries.length ? Math.round(entries.reduce((s, e) => s + e.successScore, 0) / entries.length) : 0}/10
          </div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log a Success</h3>
          <input value={form.successTitle} onChange={e => setForm(f => ({ ...f, successTitle: e.target.value }))}
            placeholder="Name this success *" className="game-input w-full text-sm" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as Domain }))} className="game-input text-sm">
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.magnitude} onChange={e => setForm(f => ({ ...f, magnitude: e.target.value as Magnitude }))} className="game-input text-sm">
              {MAGNITUDES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.dateAchieved} onChange={e => setForm(f => ({ ...f, dateAchieved: e.target.value }))} className="game-input text-sm" />
            <select value={form.howLongItTook} onChange={e => setForm(f => ({ ...f, howLongItTook: e.target.value as HowLong }))} className="game-input text-sm">
              {HOW_LONGS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <textarea value={form.keyActions} onChange={e => setForm(f => ({ ...f, keyActions: e.target.value }))}
            placeholder="Key actions that led to this?" rows={2} className="game-input w-full text-sm resize-none" />
          <input value={form.mindsetUsed} onChange={e => setForm(f => ({ ...f, mindsetUsed: e.target.value }))}
            placeholder="The belief that made it possible" className="game-input w-full text-sm" />
          <input value={form.habitsThatHelped} onChange={e => setForm(f => ({ ...f, habitsThatHelped: e.target.value }))}
            placeholder="Habits that helped" className="game-input w-full text-sm" />
          <input value={form.resourcesUsed} onChange={e => setForm(f => ({ ...f, resourcesUsed: e.target.value }))}
            placeholder="Resources used (time, money, people, tools)" className="game-input w-full text-sm" />
          <input value={form.biggestObstacleOvercome} onChange={e => setForm(f => ({ ...f, biggestObstacleOvercome: e.target.value }))}
            placeholder="Biggest obstacle overcome" className="game-input w-full text-sm" />
          <input value={form.wouldDoAgain} onChange={e => setForm(f => ({ ...f, wouldDoAgain: e.target.value }))}
            placeholder="What would you repeat?" className="game-input w-full text-sm" />
          <input value={form.wouldDoDifferently} onChange={e => setForm(f => ({ ...f, wouldDoDifferently: e.target.value }))}
            placeholder="What would you do differently?" className="game-input w-full text-sm" />
          <input value={form.lessonForOthers} onChange={e => setForm(f => ({ ...f, lessonForOthers: e.target.value }))}
            placeholder="If you taught this, what would you say?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Personal significance: {form.successScore}/10</p>
            <input type="range" min={1} max={10} value={form.successScore}
              onChange={e => setForm(f => ({ ...f, successScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save Blueprint</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="game-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" /> Domain Breakdown
            </h3>
            {DOMAINS.filter(d => domainCounts[d] > 0).map(d => (
              <div key={d} className="space-y-0.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{d}</span>
                  <span>{domainCounts[d]}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(domainCounts[d] / maxDomainCount) * 100}%`, background: DOMAIN_COLORS[d] }} />
                </div>
              </div>
            ))}
          </div>

          {patternWords.length > 0 && (
            <div className="game-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Your Success Patterns
              </h3>
              <p className="text-xs text-slate-500 mb-2">Most common mindset words:</p>
              <div className="flex flex-wrap gap-2">
                {patternWords.map(w => (
                  <span key={w} className="px-2 py-1 bg-amber-900/30 text-amber-300 rounded-lg text-xs font-medium capitalize">{w}</span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Timeline — Last 10</h3>
            {last10.map((e, i) => (
              <div key={e.id} className="game-card p-3 flex items-start gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: DOMAIN_COLORS[e.domain] }}>
                    {i + 1}
                  </div>
                  {i < last10.length - 1 && <div className="w-px flex-1 bg-slate-700 min-h-[1rem]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{e.successTitle}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: MAGNITUDE_COLORS[e.magnitude] + '30', color: MAGNITUDE_COLORS[e.magnitude] }}>{e.magnitude}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{e.domain}</span>
                    <span className="text-xs text-slate-500">{e.dateAchieved}</span>
                    <span className="text-xs text-amber-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3" /> {e.successScore}/10
                    </span>
                  </div>
                  {e.mindsetUsed && (
                    <p className="text-xs text-violet-300/70 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {e.mindsetUsed}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Every success leaves a clue. Start capturing yours.</p>
        </div>
      )}
    </div>
  )
}
