import { useState, useEffect } from 'react'
import { TrendingUp, Plus, BookOpen, Star, ChevronRight, Award, Layers, CheckCircle2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface GrowthEntry {
  id: string
  date: string
  growthArea: string
  growthType: string
  title: string
  story: string
  beforeState: string
  afterState: string
  evidenceOfGrowth: string
  whatItCost: string
  wisdomGained: string
  growthScore: number
}

const GROWTH_AREAS = [
  'Mindset', 'Skills', 'Habits', 'Relationships', 'Health',
  'Career', 'Finances', 'Creativity', 'Spirituality', 'Emotional',
]

const GROWTH_TYPES = [
  'Breakthrough', 'Insight', 'Skill Gained', 'Habit Formed', 'Obstacle Overcome',
  'Lesson Learned', 'Perspective Shift', 'Fear Conquered', 'Milestone Reached', 'Identity Update',
]

const AREA_COLORS: Record<string, string> = {
  Mindset: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Skills: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Habits: 'bg-green-500/20 text-green-300 border-green-500/30',
  Relationships: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Health: 'bg-red-500/20 text-red-300 border-red-500/30',
  Career: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Finances: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Creativity: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Spirituality: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  Emotional: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

const STORAGE_KEY = 'growth_journal_log'

const defaultForm: Omit<GrowthEntry, 'id' | 'date'> = {
  growthArea: 'Mindset',
  growthType: 'Breakthrough',
  title: '',
  story: '',
  beforeState: '',
  afterState: '',
  evidenceOfGrowth: '',
  whatItCost: '',
  wisdomGained: '',
  growthScore: 5,
}

export default function GrowthJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GrowthEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<GrowthEntry, 'id' | 'date'>>(defaultForm)
  const [expandedArea, setExpandedArea] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const persist = (updated: GrowthEntry[]) => {
    setEntries(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    if (form.story.length < 50) {
      return
    }
    const entry: GrowthEntry = {
      ...form,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
    }
    persist([entry, ...entries])
    setForm(defaultForm)
    setShowForm(false)
    toastSuccess('Growth moment logged!', `+${form.growthScore * 10} Growth XP`)
  }

  const grouped = GROWTH_AREAS.reduce<Record<string, GrowthEntry[]>>((acc, area) => {
    acc[area] = entries.filter(e => e.growthArea === area)
    return acc
  }, {})

  const mostGrownArea = GROWTH_AREAS.reduce((best, area) =>
    (grouped[area].length > (grouped[best]?.length ?? 0) ? area : best), GROWTH_AREAS[0])

  const last10 = entries.slice(0, 10)

  const isComplete = form.title.trim() && form.story.length >= 50

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-violet-300 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Growth Journal
            </h1>
            <p className="text-slate-400 text-sm mt-1">Document every leap forward</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Growth
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-violet-300">{entries.length}</div>
            <div className="text-xs text-slate-400">Total Moments</div>
          </div>
          <div className="game-card text-center">
            <div className="text-lg font-bold text-green-300 truncate">{mostGrownArea}</div>
            <div className="text-xs text-slate-400">Most Grown</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-amber-300">
              {entries.length > 0 ? (entries.reduce((s, e) => s + e.growthScore, 0) / entries.length).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-slate-400">Avg Score</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="game-card space-y-4">
            <h2 className="font-bold text-violet-300 flex items-center gap-2">
              <Star className="w-4 h-4" /> New Growth Moment
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Growth Area</label>
                <select
                  className="game-input w-full"
                  value={form.growthArea}
                  onChange={e => setForm({ ...form, growthArea: e.target.value })}
                >
                  {GROWTH_AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Growth Type</label>
                <select
                  className="game-input w-full"
                  value={form.growthType}
                  onChange={e => setForm({ ...form, growthType: e.target.value })}
                >
                  {GROWTH_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Title</label>
              <input
                className="game-input w-full"
                placeholder="Short title for this growth moment"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Full Story <span className="text-slate-500">({form.story.length}/50 min)</span>
              </label>
              <textarea
                className="game-input w-full min-h-[100px] resize-none"
                placeholder="Tell the full story of this growth moment..."
                value={form.story}
                onChange={e => setForm({ ...form, story: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Before State</label>
                <input className="game-input w-full" placeholder="How were you before?" value={form.beforeState} onChange={e => setForm({ ...form, beforeState: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">After State</label>
                <input className="game-input w-full" placeholder="Who are you now?" value={form.afterState} onChange={e => setForm({ ...form, afterState: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Evidence of Growth</label>
              <input className="game-input w-full" placeholder="What proof do you have this changed you?" value={form.evidenceOfGrowth} onChange={e => setForm({ ...form, evidenceOfGrowth: e.target.value })} />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">What It Cost</label>
              <input className="game-input w-full" placeholder="What did you sacrifice or endure?" value={form.whatItCost} onChange={e => setForm({ ...form, whatItCost: e.target.value })} />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Wisdom Gained</label>
              <input className="game-input w-full" placeholder="One sentence wisdom..." value={form.wisdomGained} onChange={e => setForm({ ...form, wisdomGained: e.target.value })} />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                <span>Growth Score</span>
                <span className="text-violet-300 font-bold">{form.growthScore}/10</span>
              </label>
              <input
                type="range" min={1} max={10} step={1}
                className="w-full accent-violet-500"
                value={form.growthScore}
                onChange={e => setForm({ ...form, growthScore: Number(e.target.value) })}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!isComplete}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors"
              >
                Save Growth Moment
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
            {form.story.length > 0 && form.story.length < 50 && (
              <p className="text-amber-400 text-xs text-center">Story needs at least 50 characters to count as complete</p>
            )}
          </div>
        )}

        {/* Breakthrough Timeline */}
        {last10.length > 0 && (
          <div className="game-card">
            <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4" /> Breakthrough Timeline
            </h2>
            <div className="space-y-3">
              {last10.map((entry, i) => (
                <div key={entry.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-violet-500 mt-1 flex-shrink-0" />
                    {i < last10.length - 1 && <div className="w-0.5 flex-1 bg-violet-500/20 mt-1 min-h-[20px]" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">{entry.date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${AREA_COLORS[entry.growthArea] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {entry.growthArea}
                      </span>
                      <span className="text-xs text-slate-500">{entry.growthType}</span>
                    </div>
                    <p className="text-sm text-slate-200 mt-0.5">{entry.title}</p>
                    {entry.wisdomGained && (
                      <p className="text-xs text-violet-300/80 italic mt-0.5">"{entry.wisdomGained}"</p>
                    )}
                  </div>
                  <div className="text-xs font-bold text-violet-400">{entry.growthScore}/10</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Library */}
        <div className="game-card">
          <h2 className="font-bold text-violet-300 flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" /> Growth Library
          </h2>
          <div className="space-y-2">
            {GROWTH_AREAS.map(area => {
              const areaEntries = grouped[area]
              if (areaEntries.length === 0) return null
              const isOpen = expandedArea === area
              return (
                <div key={area} className="border border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedArea(isOpen ? null : area)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${AREA_COLORS[area] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {area}
                      </span>
                      <span className="text-sm text-slate-400">{areaEntries.length} moment{areaEntries.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 space-y-2 border-t border-slate-700">
                      {areaEntries.map(e => (
                        <div key={e.id} className="flex items-start gap-2 pt-2">
                          <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-slate-200">{e.title}</p>
                            <p className="text-xs text-slate-500">{e.date} · {e.growthType} · Score {e.growthScore}/10</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {entries.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No growth moments yet. Log your first breakthrough!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
