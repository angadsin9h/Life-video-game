import { useState, useEffect } from 'react'
import { Lightbulb, Plus, X, CheckCircle2, Circle, Target, TrendingUp, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ExperimentCategory =
  | 'Sleep'
  | 'Nutrition'
  | 'Exercise'
  | 'Mindset'
  | 'Habits'
  | 'Relationships'
  | 'Work'
  | 'Spirituality'
  | 'Environment'
  | 'Social'

type TestDuration = '3 days' | '7 days' | '14 days' | '30 days'

type ExperimentResult =
  | 'Too early'
  | 'Promising'
  | 'Mixed'
  | 'Not working'
  | 'Working well'
  | 'Confirmed'
  | 'Rejected'

interface LabEntry {
  id: string
  hypothesis: string
  category: ExperimentCategory
  testDuration: TestDuration
  startDate: string
  dailyObservation: string
  measuredOutcome: string
  currentResult: ExperimentResult
  confidenceLevel: number
  conclusion: string
  willContinue: boolean
  experimentScore: number
  date: string
  createdAt: string
}

const CATEGORIES: ExperimentCategory[] = [
  'Sleep', 'Nutrition', 'Exercise', 'Mindset', 'Habits',
  'Relationships', 'Work', 'Spirituality', 'Environment', 'Social',
]

const TEST_DURATIONS: TestDuration[] = ['3 days', '7 days', '14 days', '30 days']

const RESULTS: ExperimentResult[] = [
  'Too early', 'Promising', 'Mixed', 'Not working', 'Working well', 'Confirmed', 'Rejected',
]

const STORAGE_KEY = 'life_lab_log'

const defaultForm = (): Omit<LabEntry, 'id' | 'createdAt' | 'experimentScore'> => ({
  hypothesis: '',
  category: 'Habits',
  testDuration: '7 days',
  startDate: new Date().toISOString().split('T')[0],
  dailyObservation: '',
  measuredOutcome: '',
  currentResult: 'Too early',
  confidenceLevel: 5,
  conclusion: '',
  willContinue: false,
  date: new Date().toISOString().split('T')[0],
})

const RESULT_COLORS: Record<ExperimentResult, string> = {
  'Too early': 'text-slate-400 bg-slate-800/50',
  'Promising': 'text-blue-400 bg-blue-900/30',
  'Mixed': 'text-amber-400 bg-amber-900/30',
  'Not working': 'text-red-400 bg-red-900/30',
  'Working well': 'text-green-400 bg-green-900/30',
  'Confirmed': 'text-emerald-400 bg-emerald-900/30',
  'Rejected': 'text-red-500 bg-red-900/40',
}

const CATEGORY_COLORS: Record<ExperimentCategory, string> = {
  'Sleep': 'text-indigo-400',
  'Nutrition': 'text-green-400',
  'Exercise': 'text-orange-400',
  'Mindset': 'text-violet-400',
  'Habits': 'text-blue-400',
  'Relationships': 'text-pink-400',
  'Work': 'text-amber-400',
  'Spirituality': 'text-cyan-400',
  'Environment': 'text-teal-400',
  'Social': 'text-rose-400',
}

function isActive(entry: LabEntry): boolean {
  return entry.currentResult === 'Too early' || entry.currentResult === 'Promising' || entry.currentResult === 'Mixed' || entry.currentResult === 'Working well'
}

function isComplete(entry: LabEntry): boolean {
  return entry.currentResult === 'Confirmed' || entry.currentResult === 'Rejected' || entry.currentResult === 'Not working'
}

export default function LifeLab() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LabEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())
  const [activeTab, setActiveTab] = useState<'active' | 'complete' | 'confirmed' | 'rejected' | 'recent'>('recent')

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: LabEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.hypothesis.trim()) return
    const entry: LabEntry = {
      id: Date.now().toString(),
      ...form,
      experimentScore: form.confidenceLevel * 10,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Experiment logged — your life is the lab.')
  }

  const activeEntries = entries.filter(isActive)
  const completeEntries = entries.filter(isComplete)
  const confirmedEntries = entries.filter(e => e.willContinue && e.currentResult === 'Confirmed')
  const rejectedEntries = entries.filter(e => e.currentResult === 'Rejected')
  const last5 = entries.slice(0, 5)

  const tabData = {
    recent: last5,
    active: activeEntries,
    complete: completeEntries,
    confirmed: confirmedEntries,
    rejected: rejectedEntries,
  }

  const currentEntries = tabData[activeTab]

  const liveScore = form.confidenceLevel * 10

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Life Lab
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Test hypotheses about what makes your life better.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Experiment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="game-card p-2 text-center">
          <div className="text-lg font-bold text-blue-400">{activeEntries.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-2 text-center">
          <div className="text-lg font-bold text-slate-400">{completeEntries.length}</div>
          <div className="text-xs text-slate-500">Done</div>
        </div>
        <div className="game-card p-2 text-center">
          <div className="text-lg font-bold text-emerald-400">{confirmedEntries.length}</div>
          <div className="text-xs text-slate-500">Confirmed</div>
        </div>
        <div className="game-card p-2 text-center">
          <div className="text-lg font-bold text-red-400">{rejectedEntries.length}</div>
          <div className="text-xs text-slate-500">Rejected</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Experiment</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={form.hypothesis}
            onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
            placeholder='Hypothesis (e.g. "If I sleep by 10pm, I\'ll have more energy") *'
            className="game-input w-full text-sm"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as ExperimentCategory }))}
              className="game-input text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={form.testDuration}
              onChange={e => setForm(f => ({ ...f, testDuration: e.target.value as TestDuration }))}
              className="game-input text-sm"
            >
              {TEST_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="game-input w-full text-sm"
              />
            </div>
            <select
              value={form.currentResult}
              onChange={e => setForm(f => ({ ...f, currentResult: e.target.value as ExperimentResult }))}
              className="game-input text-sm self-end"
            >
              {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <input
            value={form.measuredOutcome}
            onChange={e => setForm(f => ({ ...f, measuredOutcome: e.target.value }))}
            placeholder="What will you measure?"
            className="game-input w-full text-sm"
          />

          <textarea
            value={form.dailyObservation}
            onChange={e => setForm(f => ({ ...f, dailyObservation: e.target.value }))}
            placeholder="What are you noticing? (daily observation)"
            rows={2}
            className="game-input w-full text-sm resize-none"
          />

          <textarea
            value={form.conclusion}
            onChange={e => setForm(f => ({ ...f, conclusion: e.target.value }))}
            placeholder="Conclusion — what did you learn?"
            rows={2}
            className="game-input w-full text-sm resize-none"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">
              Confidence Level: <span className="text-yellow-300">{form.confidenceLevel}/10</span>
              {' '}→ Experiment Score: <span className="text-green-400">{liveScore}</span>
            </p>
            <input
              type="range" min={1} max={10} value={form.confidenceLevel}
              onChange={e => setForm(f => ({ ...f, confidenceLevel: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.willContinue}
              onChange={e => setForm(f => ({ ...f, willContinue: e.target.checked }))}
              className="w-4 h-4 accent-yellow-500"
            />
            <span className="text-sm text-slate-300">Will continue this experiment</span>
          </label>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
              Log Experiment
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(['recent', 'active', 'complete', 'confirmed', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-yellow-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'recent' ? 'Recent' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'recent' && (
              <span className="ml-1 text-slate-500">({tabData[tab].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {currentEntries.map(e => (
          <div key={e.id} className="game-card p-3 border-l-2 border-yellow-500/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  {e.willContinue && e.currentResult === 'Confirmed'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    : e.currentResult === 'Rejected'
                    ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    : <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  }
                  <p className="text-sm text-slate-200 font-medium flex-1">{e.hypothesis}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5 pl-6">
                  <span className={`text-xs font-semibold ${CATEGORY_COLORS[e.category]}`}>{e.category}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${RESULT_COLORS[e.currentResult]}`}>{e.currentResult}</span>
                  <span className="text-xs text-slate-500">{e.testDuration}</span>
                  <span className="text-xs text-yellow-400 font-semibold">Score: {e.experimentScore}</span>
                </div>
                {e.measuredOutcome && (
                  <p className="text-xs text-slate-500 mt-1 pl-6 truncate">
                    <Target className="w-3 h-3 inline mr-0.5" />
                    {e.measuredOutcome}
                  </p>
                )}
                {e.dailyObservation && (
                  <p className="text-xs text-slate-400 mt-0.5 pl-6 line-clamp-2">{e.dailyObservation}</p>
                )}
                {e.conclusion && (
                  <p className="text-xs text-emerald-300/80 mt-0.5 pl-6 line-clamp-2 italic">"{e.conclusion}"</p>
                )}
                {e.willContinue && (
                  <div className="flex items-center gap-1 mt-1 pl-6">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Continuing</span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{e.date}</div>
                <button
                  onClick={() => save(entries.filter(x => x.id !== e.id))}
                  className="text-slate-700 hover:text-red-400 mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {currentEntries.length === 0 && !showForm && (
          <div className="text-center py-10 text-slate-500">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {activeTab === 'recent' && 'Your life is a lab. Run your first experiment.'}
              {activeTab === 'active' && 'No active experiments. Start one!'}
              {activeTab === 'complete' && 'No completed experiments yet.'}
              {activeTab === 'confirmed' && 'No confirmed hypotheses yet. Keep experimenting!'}
              {activeTab === 'rejected' && 'No rejected hypotheses. Failure is data too.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
