import { useState, useEffect } from 'react'
import { Target, Star, Compass, Zap, Brain, TrendingUp, Plus, Trash2, Save, CheckCircle, Lightbulb, Edit3, ChevronRight, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MissionData {
  whyStatements: string[]
  coreValues: string[]
  howPrinciples: string[]
  strengths: string[]
  whatResults: string[]
  impactArea: string
  missionStatement: string
  lastUpdated: string
}

const STORAGE_KEY = 'personal_mission'

const PRESET_VALUES = [
  'Growth', 'Integrity', 'Freedom', 'Impact', 'Love',
  'Creativity', 'Health', 'Excellence', 'Service', 'Wisdom',
  'Courage', 'Connection', 'Adventure', 'Legacy', 'Balance',
  'Joy', 'Truth', 'Authenticity', 'Discipline', 'Presence',
]

const PRESET_STRENGTHS = [
  'Teaching', 'Building', 'Creating', 'Leading', 'Healing',
  'Connecting', 'Analyzing', 'Inspiring', 'Protecting', 'Solving',
]

const IMPACT_AREAS = [
  { value: 'family', label: 'Family', emoji: '🏠' },
  { value: 'community', label: 'Community', emoji: '🌍' },
  { value: 'world', label: 'World', emoji: '🌐' },
  { value: 'myself', label: 'Myself', emoji: '🌱' },
  { value: 'my field', label: 'My Field', emoji: '⚙️' },
]

const STEPS = ['Why', 'How', 'What', 'Mission'] as const
type Step = 0 | 1 | 2 | 3

const defaultMission = (): MissionData => ({
  whyStatements: ['', '', ''],
  coreValues: [],
  howPrinciples: ['', '', ''],
  strengths: [],
  whatResults: ['', '', ''],
  impactArea: 'world',
  missionStatement: '',
  lastUpdated: '',
})

export default function PersonalMission() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<MissionData>(defaultMission())
  const [step, setStep] = useState<Step>(0)
  const [editingMission, setEditingMission] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as MissionData
        setData(parsed)
      }
    } catch { /**/ }
  }, [])

  const persist = (next: MissionData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const updateWhy = (i: number, val: string) => {
    const arr = [...data.whyStatements]
    arr[i] = val
    persist({ ...data, whyStatements: arr })
  }

  const toggleValue = (v: string) => {
    const has = data.coreValues.includes(v)
    if (!has && data.coreValues.length >= 5) return
    persist({ ...data, coreValues: has ? data.coreValues.filter(x => x !== v) : [...data.coreValues, v] })
  }

  const updateHow = (i: number, val: string) => {
    const arr = [...data.howPrinciples]
    arr[i] = val
    persist({ ...data, howPrinciples: arr })
  }

  const toggleStrength = (s: string) => {
    const has = data.strengths.includes(s)
    if (!has && data.strengths.length >= 3) return
    persist({ ...data, strengths: has ? data.strengths.filter(x => x !== s) : [...data.strengths, s] })
  }

  const updateWhat = (i: number, val: string) => {
    const arr = [...data.whatResults]
    arr[i] = val
    persist({ ...data, whatResults: arr })
  }

  const autoGenerate = () => {
    const why = data.whyStatements[0].trim() || 'live with purpose'
    const how = data.howPrinciples[0].trim() || 'acting with intention'
    const what = data.whatResults[0].trim() || 'I create lasting positive change'
    const generated = `To ${why} by ${how} so that ${what}.`
    persist({ ...data, missionStatement: generated, lastUpdated: new Date().toISOString() })
    setEditingMission(false)
    toastSuccess('Mission statement generated!')
  }

  const saveMission = () => {
    if (!data.missionStatement.trim()) return
    persist({ ...data, lastUpdated: new Date().toISOString() })
    setEditingMission(false)
    toastSuccess('Mission statement saved!')
  }

  const clearMission = () => {
    persist({ ...data, missionStatement: '', lastUpdated: '' })
    toastSuccess('Mission cleared — start fresh')
  }

  const stepColor = ['text-amber-400', 'text-cyan-400', 'text-emerald-400', 'text-violet-400']
  const stepBg = ['bg-amber-500/20 border-amber-500/30', 'bg-cyan-500/20 border-cyan-500/30', 'bg-emerald-500/20 border-emerald-500/30', 'bg-violet-500/20 border-violet-500/30']
  const stepActiveBg = ['bg-amber-700 hover:bg-amber-600', 'bg-cyan-700 hover:bg-cyan-600', 'bg-emerald-700 hover:bg-emerald-600', 'bg-violet-700 hover:bg-violet-600']

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-amber-400" />
            Personal Mission
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Discover your WHY, HOW, and WHAT using the Start With Why framework.</p>
        </div>
      </div>

      {/* Mission Card (if saved) */}
      {data.missionStatement && (
        <div
          className="game-card p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(245,158,11,0.10) 50%, rgba(16,185,129,0.10) 100%)',
            borderColor: 'rgba(139,92,246,0.4)',
          }}
        >
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setEditingMission(true)}
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-white"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearMission}
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">My Mission</span>
          </div>
          {editingMission ? (
            <div className="space-y-2">
              <textarea
                value={data.missionStatement}
                onChange={e => setData(d => ({ ...d, missionStatement: e.target.value }))}
                className="game-input w-full h-20 resize-none text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveMission} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-xs font-semibold">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => setEditingMission(false)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-xl text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-white text-base font-medium leading-relaxed italic">"{data.missionStatement}"</p>
          )}
          {data.lastUpdated && (
            <p className="text-xs text-slate-500 mt-2">
              Updated {new Date(data.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Step Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i as Step)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              step === i
                ? `${stepActiveBg[i]} text-white`
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="hidden sm:inline">{s}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      {step === 0 && (
        <div className={`game-card p-4 space-y-4 border ${stepBg[0]}`}>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Step 1 — Your WHY</h2>
          </div>
          <p className="text-xs text-slate-400">Your core purpose and belief. What drives everything you do?</p>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Complete each: "I believe..."</p>
            {data.whyStatements.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-amber-400 font-bold mt-2.5 w-4 shrink-0">{i + 1}.</span>
                <textarea
                  value={s}
                  onChange={e => updateWhy(i, e.target.value)}
                  placeholder={`I believe...${i === 0 ? ' (your primary belief)' : ''}`}
                  className="game-input w-full h-12 resize-none text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Select up to 5 core values</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_VALUES.map(v => {
                const sel = data.coreValues.includes(v)
                return (
                  <button
                    key={v}
                    onClick={() => toggleValue(v)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      sel
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-amber-500/50'
                    } ${!sel && data.coreValues.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
            {data.coreValues.length > 0 && (
              <p className="text-xs text-amber-400">{data.coreValues.length}/5 selected: {data.coreValues.join(', ')}</p>
            )}
          </div>

          <button
            onClick={() => setStep(1)}
            className={`w-full py-2 ${stepActiveBg[0]} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1`}
          >
            Next: Your HOW <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className={`game-card p-4 space-y-4 border ${stepBg[1]}`}>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Step 2 — Your HOW</h2>
          </div>
          <p className="text-xs text-slate-400">The specific actions and values that guide how you show up.</p>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Complete each: "I do this by..."</p>
            {data.howPrinciples.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-cyan-400 font-bold mt-2.5 w-4 shrink-0">{i + 1}.</span>
                <input
                  value={p}
                  onChange={e => updateHow(i, e.target.value)}
                  placeholder={`I do this by...${i === 0 ? ' (your primary method)' : ''}`}
                  className="game-input w-full text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Pick your top 3 strengths</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_STRENGTHS.map(s => {
                const sel = data.strengths.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleStrength(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      sel
                        ? 'bg-cyan-700 border-cyan-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500/50'
                    } ${!sel && data.strengths.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            {data.strengths.length > 0 && (
              <p className="text-xs text-cyan-400">{data.strengths.length}/3 selected: {data.strengths.join(', ')}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
            <button
              onClick={() => setStep(2)}
              className={`flex-1 py-2 ${stepActiveBg[1]} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1`}
            >
              Next: Your WHAT <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={`game-card p-4 space-y-4 border ${stepBg[2]}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Step 3 — Your WHAT</h2>
          </div>
          <p className="text-xs text-slate-400">The results and outputs you create for others.</p>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Complete each: "So that..."</p>
            {data.whatResults.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-emerald-400 font-bold mt-2.5 w-4 shrink-0">{i + 1}.</span>
                <input
                  value={r}
                  onChange={e => updateWhat(i, e.target.value)}
                  placeholder={`So that...${i === 0 ? ' (your primary outcome)' : ''}`}
                  className="game-input w-full text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">Primary impact area</p>
            <div className="grid grid-cols-5 gap-1.5">
              {IMPACT_AREAS.map(a => (
                <button
                  key={a.value}
                  onClick={() => persist({ ...data, impactArea: a.value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                    data.impactArea === a.value
                      ? 'bg-emerald-700/40 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-base">{a.emoji}</span>
                  <span className="text-[10px] leading-tight text-center">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
            <button
              onClick={() => setStep(3)}
              className={`flex-1 py-2 ${stepActiveBg[2]} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1`}
            >
              Build Mission <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={`game-card p-4 space-y-4 border ${stepBg[3]}`}>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Step 4 — Your Mission</h2>
          </div>
          <p className="text-xs text-slate-400">Auto-generate a draft from your inputs, then refine it.</p>

          {/* Summary of inputs */}
          <div className="space-y-2 bg-slate-900/50 rounded-xl p-3">
            <div className="grid grid-cols-1 gap-2">
              {data.whyStatements.filter(s => s.trim()).length > 0 && (
                <div>
                  <p className="text-[10px] text-amber-400 font-semibold uppercase mb-1">WHY</p>
                  {data.whyStatements.filter(s => s.trim()).map((s, i) => (
                    <p key={i} className="text-xs text-slate-300">• I believe {s}</p>
                  ))}
                </div>
              )}
              {data.howPrinciples.filter(p => p.trim()).length > 0 && (
                <div>
                  <p className="text-[10px] text-cyan-400 font-semibold uppercase mb-1">HOW</p>
                  {data.howPrinciples.filter(p => p.trim()).map((p, i) => (
                    <p key={i} className="text-xs text-slate-300">• I do this by {p}</p>
                  ))}
                </div>
              )}
              {data.whatResults.filter(r => r.trim()).length > 0 && (
                <div>
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase mb-1">WHAT</p>
                  {data.whatResults.filter(r => r.trim()).map((r, i) => (
                    <p key={i} className="text-xs text-slate-300">• So that {r}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={autoGenerate}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" /> Auto-Generate from Inputs
          </button>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Your mission statement (edit freely)</p>
            <textarea
              value={data.missionStatement}
              onChange={e => setData(d => ({ ...d, missionStatement: e.target.value }))}
              placeholder="To [your why] by [your how] so that [your what]..."
              className="game-input w-full h-24 resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Back</button>
            <button
              onClick={saveMission}
              className={`flex-1 py-2 ${stepActiveBg[3]} text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2`}
            >
              <CheckCircle className="w-4 h-4" /> Save My Mission
            </button>
          </div>
        </div>
      )}

      {/* Progress indicators */}
      <div className="game-card p-3">
        <p className="text-xs text-slate-500 font-medium mb-2">Framework completion</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'WHY', done: data.whyStatements.some(s => s.trim()) && data.coreValues.length > 0, color: 'bg-amber-500' },
            { label: 'HOW', done: data.howPrinciples.some(p => p.trim()) && data.strengths.length > 0, color: 'bg-cyan-500' },
            { label: 'WHAT', done: data.whatResults.some(r => r.trim()), color: 'bg-emerald-500' },
            { label: 'MISSION', done: !!data.missionStatement.trim(), color: 'bg-violet-500' },
          ].map(({ label, done, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full ${done ? color : 'bg-slate-700'}`} />
              <span className={`text-[10px] ${done ? 'text-white' : 'text-slate-600'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Values & Strengths summary */}
      {(data.coreValues.length > 0 || data.strengths.length > 0) && (
        <div className="game-card p-3 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">Your identity anchors</p>
          </div>
          {data.coreValues.length > 0 && (
            <div>
              <p className="text-[10px] text-amber-400 uppercase font-semibold mb-1">Core Values</p>
              <div className="flex flex-wrap gap-1">
                {data.coreValues.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">{v}</span>
                ))}
              </div>
            </div>
          )}
          {data.strengths.length > 0 && (
            <div>
              <p className="text-[10px] text-cyan-400 uppercase font-semibold mb-1">Top Strengths</p>
              <div className="flex flex-wrap gap-1">
                {data.strengths.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state if nothing started */}
      {!data.missionStatement && !data.whyStatements.some(s => s.trim()) && (
        <div className="text-center py-8 text-slate-600">
          <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start with Step 1 — discover your WHY, and everything else follows.</p>
          <button
            onClick={() => setStep(0)}
            className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Begin the Journey
          </button>
        </div>
      )}
    </div>
  )
}
