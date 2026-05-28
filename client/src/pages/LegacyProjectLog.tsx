import { useState, useEffect } from 'react'
import { Globe, Plus, X, Clock, TrendingUp, Layers, Flag, Eye } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LegacyType =
  | 'Family'
  | 'Community'
  | 'Creative Work'
  | 'Knowledge'
  | 'Business'
  | 'Movement'
  | 'Teaching'
  | 'Art'
  | 'Service'
  | 'Relationship'
  | 'Environmental'
  | 'Spiritual'

type ProjectPhase =
  | 'Ideation'
  | 'Planning'
  | 'Building'
  | 'Growing'
  | 'Sustaining'
  | 'Complete'
  | 'Passed On'

interface LegacyEntry {
  id: string
  projectName: string
  legacyType: LegacyType
  whoItServes: string
  currentPhase: ProjectPhase
  hoursThisWeek: number
  progressUpdate: string
  obstacles: string
  nextMilestone: string
  whyThisMatters: string
  legacyScore: number
  date: string
  createdAt: string
}

const LEGACY_TYPES: LegacyType[] = [
  'Family', 'Community', 'Creative Work', 'Knowledge', 'Business',
  'Movement', 'Teaching', 'Art', 'Service', 'Relationship', 'Environmental', 'Spiritual',
]

const PROJECT_PHASES: ProjectPhase[] = [
  'Ideation', 'Planning', 'Building', 'Growing', 'Sustaining', 'Complete', 'Passed On',
]

const STORAGE_KEY = 'legacy_project_log'

const defaultForm = (): Omit<LegacyEntry, 'id' | 'createdAt'> => ({
  projectName: '',
  legacyType: 'Family',
  whoItServes: '',
  currentPhase: 'Building',
  hoursThisWeek: 0,
  progressUpdate: '',
  obstacles: '',
  nextMilestone: '',
  whyThisMatters: '',
  legacyScore: 7,
  date: new Date().toISOString().split('T')[0],
})

const TYPE_COLORS: Record<LegacyType, string> = {
  'Family': 'text-pink-400 bg-pink-900/30',
  'Community': 'text-green-400 bg-green-900/30',
  'Creative Work': 'text-violet-400 bg-violet-900/30',
  'Knowledge': 'text-blue-400 bg-blue-900/30',
  'Business': 'text-amber-400 bg-amber-900/30',
  'Movement': 'text-orange-400 bg-orange-900/30',
  'Teaching': 'text-cyan-400 bg-cyan-900/30',
  'Art': 'text-purple-400 bg-purple-900/30',
  'Service': 'text-emerald-400 bg-emerald-900/30',
  'Relationship': 'text-rose-400 bg-rose-900/30',
  'Environmental': 'text-teal-400 bg-teal-900/30',
  'Spiritual': 'text-indigo-400 bg-indigo-900/30',
}

const PHASE_COLORS: Record<ProjectPhase, string> = {
  'Ideation': 'text-slate-400',
  'Planning': 'text-blue-400',
  'Building': 'text-amber-400',
  'Growing': 'text-green-400',
  'Sustaining': 'text-violet-400',
  'Complete': 'text-emerald-400',
  'Passed On': 'text-pink-400',
}

function getMostRecentProject(entries: LegacyEntry[]): string | null {
  if (!entries.length) return null
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return sorted[0].projectName
}

export default function LegacyProjectLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LegacyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showVision, setShowVision] = useState(false)
  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: LegacyEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.projectName.trim()) return
    const entry: LegacyEntry = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Legacy entry logged — your impact compounds over time.')
  }

  const totalHours = entries.reduce((s, e) => s + e.hoursThisWeek, 0)
  const mostActive = getMostRecentProject(entries)

  // Group by legacyType
  const grouped: Partial<Record<LegacyType, LegacyEntry[]>> = {}
  for (const e of entries) {
    if (!grouped[e.legacyType]) grouped[e.legacyType] = []
    grouped[e.legacyType]!.push(e)
  }

  const visionEntries = entries.filter(e => e.whyThisMatters.trim().length > 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-emerald-400" />
            Legacy Project Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track projects and contributions that outlast you.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xl font-bold text-white">{totalHours}</span>
          </div>
          <div className="text-xs text-slate-500">Total Hours</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{Object.keys(grouped).length}</div>
          <div className="text-xs text-slate-500">Project Types</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Entries</div>
        </div>
      </div>

      {mostActive && (
        <div className="game-card p-3 border-l-2 border-emerald-500/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Most Active Project</div>
              <div className="text-sm font-semibold text-white">{mostActive}</div>
            </div>
          </div>
        </div>
      )}

      {/* 100-Year Vision Wall Toggle */}
      {visionEntries.length > 0 && (
        <button
          onClick={() => setShowVision(v => !v)}
          className="w-full game-card p-3 flex items-center justify-between hover:border-amber-500/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">100-Year Vision Wall</span>
          </div>
          <span className="text-xs text-slate-500">{showVision ? 'Hide' : `${visionEntries.length} entries`}</span>
        </button>
      )}

      {showVision && (
        <div className="space-y-2">
          {visionEntries.map(e => (
            <div key={e.id} className="game-card p-3 border border-amber-500/20 bg-amber-900/10">
              <div className="text-xs text-amber-400 font-semibold mb-1">{e.projectName}</div>
              <p className="text-sm text-slate-200 italic">"{e.whyThisMatters}"</p>
              <div className="text-xs text-slate-600 mt-1">{e.date}</div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Log Legacy Work</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={form.projectName}
            onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
            placeholder="Project name *"
            className="game-input w-full text-sm"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.legacyType}
              onChange={e => setForm(f => ({ ...f, legacyType: e.target.value as LegacyType }))}
              className="game-input text-sm"
            >
              {LEGACY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={form.currentPhase}
              onChange={e => setForm(f => ({ ...f, currentPhase: e.target.value as ProjectPhase }))}
              className="game-input text-sm"
            >
              {PROJECT_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <input
            value={form.whoItServes}
            onChange={e => setForm(f => ({ ...f, whoItServes: e.target.value }))}
            placeholder="Who benefits from this?"
            className="game-input w-full text-sm"
          />

          <div>
            <label className="text-xs text-slate-400 block mb-1">Hours this week: <span className="text-blue-300">{form.hoursThisWeek}h</span></label>
            <input
              type="number" min={0} max={168}
              value={form.hoursThisWeek}
              onChange={e => setForm(f => ({ ...f, hoursThisWeek: Number(e.target.value) }))}
              className="game-input w-full text-sm"
            />
          </div>

          <textarea
            value={form.progressUpdate}
            onChange={e => setForm(f => ({ ...f, progressUpdate: e.target.value }))}
            placeholder="What happened this week?"
            rows={3}
            className="game-input w-full text-sm resize-none"
          />

          <input
            value={form.obstacles}
            onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
            placeholder="Obstacles"
            className="game-input w-full text-sm"
          />
          <input
            value={form.nextMilestone}
            onChange={e => setForm(f => ({ ...f, nextMilestone: e.target.value }))}
            placeholder="Next milestone"
            className="game-input w-full text-sm"
          />

          <textarea
            value={form.whyThisMatters}
            onChange={e => setForm(f => ({ ...f, whyThisMatters: e.target.value }))}
            placeholder="The 100-year impact — why does this matter?"
            rows={2}
            className="game-input w-full text-sm resize-none"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Legacy Score: <span className="text-emerald-300">{form.legacyScore}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.legacyScore}
              onChange={e => setForm(f => ({ ...f, legacyScore: Number(e.target.value) }))}
              className="w-full h-1 accent-emerald-400"
            />
          </div>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
              Log Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects grouped by type */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects by Type</h2>
          {(Object.keys(grouped) as LegacyType[]).map(type => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TYPE_COLORS[type]}`}>{type}</span>
                <span className="text-xs text-slate-600">{grouped[type]!.length} entries</span>
              </div>
              <div className="space-y-2 pl-3">
                {grouped[type]!.slice(0, 3).map(e => (
                  <div key={e.id} className="game-card p-3 border-l-2 border-emerald-500/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-slate-200 font-semibold truncate">{e.projectName}</p>
                          <span className={`text-xs ${PHASE_COLORS[e.currentPhase]}`}>{e.currentPhase}</span>
                        </div>
                        {e.progressUpdate && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{e.progressUpdate}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-blue-300">{e.hoursThisWeek}h this week</span>
                          <span className="text-xs text-emerald-400">Score: {e.legacyScore}/10</span>
                        </div>
                        {e.nextMilestone && (
                          <div className="flex items-center gap-1 mt-1">
                            <Flag className="w-3 h-3 text-amber-400" />
                            <p className="text-xs text-amber-300 truncate">{e.nextMilestone}</p>
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
                {grouped[type]!.length > 3 && (
                  <div className="text-xs text-slate-600 pl-1">+{grouped[type]!.length - 3} more entries</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Every great legacy started as a single log entry.</p>
        </div>
      )}
    </div>
  )
}
