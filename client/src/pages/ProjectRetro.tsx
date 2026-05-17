import { useState, useMemo } from 'react'
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp, Star, Check, X, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RetroType = 'Work' | 'Personal' | 'Learning' | 'Event' | 'Other'

interface RetroEntry {
  id: string
  projectName: string
  dateCompleted: string
  type: RetroType
  rating: number
  wentWell: string
  wentWrong: string
  keyLearnings: string
  actionItems: string
  createdAt: string
}

const STORAGE_KEY = 'project_retros'

const RETRO_TYPES: RetroType[] = ['Work', 'Personal', 'Learning', 'Event', 'Other']

const TYPE_COLORS: Record<RetroType, string> = {
  Work:     'text-blue-400 bg-blue-900/30 border-blue-500/40',
  Personal: 'text-green-400 bg-green-900/30 border-green-500/40',
  Learning: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/40',
  Event:    'text-pink-400 bg-pink-900/30 border-pink-500/40',
  Other:    'text-slate-400 bg-slate-700/60 border-slate-600/50',
}

function loadRetros(): RetroEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRetros(retros: RetroEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(retros))
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={onChange ? () => onChange(n) : undefined}
          className={`transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
            n <= value ? 'text-yellow-400' : 'text-slate-700'
          }`}
          title={onChange ? `Rate ${n}` : undefined}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  )
}

interface RetroCardProps {
  retro: RetroEntry
  onDelete: (id: string) => void
}

function RetroCard({ retro, onDelete }: RetroCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="game-card p-4">
      {/* Summary row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <StarRating value={retro.rating} />
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[retro.type]}`}>
              {retro.type}
            </span>
            {retro.dateCompleted && (
              <span className="text-[10px] text-slate-600">{formatDate(retro.dateCompleted)}</span>
            )}
          </div>
          <h3 className="text-slate-100 font-semibold text-sm">{retro.projectName}</h3>
          {!expanded && retro.keyLearnings && (
            <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{retro.keyLearnings}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-700 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(retro.id)}
            className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-slate-700 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
          {retro.wentWell && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                <Check className="w-3 h-3" /> What Went Well
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{retro.wentWell}</p>
            </div>
          )}
          {retro.wentWrong && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                <X className="w-3 h-3" /> What Went Wrong
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{retro.wentWrong}</p>
            </div>
          )}
          {retro.keyLearnings && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">
                <Star className="w-3 h-3" /> Key Learnings
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{retro.keyLearnings}</p>
            </div>
          )}
          {retro.actionItems && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                <Target className="w-3 h-3" /> Action Items
              </div>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{retro.actionItems}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  projectName: '',
  dateCompleted: '',
  type: 'Work' as RetroType,
  rating: 0,
  wentWell: '',
  wentWrong: '',
  keyLearnings: '',
  actionItems: '',
}

export default function ProjectRetro() {
  const { toastSuccess } = useToast()
  const [retros, setRetros] = useState<RetroEntry[]>(loadRetros)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showActionItems, setShowActionItems] = useState(false)

  const persist = (updated: RetroEntry[]) => {
    setRetros(updated)
    saveRetros(updated)
  }

  const handleAdd = () => {
    if (!form.projectName.trim()) return
    const entry: RetroEntry = {
      id: uid(),
      projectName: form.projectName.trim(),
      dateCompleted: form.dateCompleted,
      type: form.type,
      rating: form.rating,
      wentWell: form.wentWell.trim(),
      wentWrong: form.wentWrong.trim(),
      keyLearnings: form.keyLearnings.trim(),
      actionItems: form.actionItems.trim(),
      createdAt: new Date().toISOString(),
    }
    persist([entry, ...retros])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Retrospective saved!', form.projectName)
  }

  const handleDelete = (id: string) => {
    persist(retros.filter(r => r.id !== id))
    toastSuccess('Retro removed')
  }

  // Quick stats
  const stats = useMemo(() => {
    if (retros.length === 0) return { total: 0, avgRating: 0, mostCommonType: '—' }
    const total = retros.length
    const avgRating = retros.reduce((sum, r) => sum + r.rating, 0) / total
    const typeCounts = RETRO_TYPES.reduce<Record<RetroType, number>>((acc, t) => {
      acc[t] = retros.filter(r => r.type === t).length
      return acc
    }, {} as Record<RetroType, number>)
    const mostCommonType = (Object.entries(typeCounts) as [RetroType, number][])
      .sort((a, b) => b[1] - a[1])[0][0]
    return { total, avgRating, mostCommonType }
  }, [retros])

  const allActionItems = useMemo(() => {
    return retros
      .filter(r => r.actionItems)
      .map(r => ({ projectName: r.projectName, actionItems: r.actionItems, type: r.type }))
  }, [retros])

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-violet-400" />
            Project Retro
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document learnings from completed projects & events</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Retro'}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Total Retros</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats.total > 0 ? stats.avgRating.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Rating</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-cyan-400 mt-0.5" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats.mostCommonType}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Top Type</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 space-y-4 border-violet-500/20 glowing-border">
          <div className="space-y-3">
            <input
              autoFocus
              className="game-input w-full font-semibold"
              placeholder="Project / event name…"
              value={form.projectName}
              onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="game-input text-sm"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as RetroType }))}
              >
                {RETRO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="date"
                className="game-input text-sm"
                value={form.dateCompleted}
                onChange={e => setForm(f => ({ ...f, dateCompleted: e.target.value }))}
              />
            </div>
            {/* Star rating selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Overall rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={`transition-all hover:scale-110 ${n <= form.rating ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                ))}
              </div>
              {form.rating > 0 && (
                <span className="text-xs text-slate-500">{form.rating}/5</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5">
                <Check className="w-3 h-3" /> What went well?
              </label>
              <textarea
                rows={3}
                className="game-input w-full text-sm resize-none"
                placeholder="What worked, what you're proud of, wins…"
                value={form.wentWell}
                onChange={e => setForm(f => ({ ...f, wentWell: e.target.value }))}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                <X className="w-3 h-3" /> What went wrong?
              </label>
              <textarea
                rows={3}
                className="game-input w-full text-sm resize-none"
                placeholder="Mistakes, blockers, frustrations, things to avoid…"
                value={form.wentWrong}
                onChange={e => setForm(f => ({ ...f, wentWrong: e.target.value }))}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1.5">
                <Star className="w-3 h-3" /> Key learnings
              </label>
              <textarea
                rows={3}
                className="game-input w-full text-sm resize-none"
                placeholder="Insights, skills gained, things to remember…"
                value={form.keyLearnings}
                onChange={e => setForm(f => ({ ...f, keyLearnings: e.target.value }))}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                <Target className="w-3 h-3" /> Action items for next time
              </label>
              <textarea
                rows={3}
                className="game-input w-full text-sm resize-none"
                placeholder="Specific things to do differently next time…"
                value={form.actionItems}
                onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.projectName.trim()}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              Save Retrospective
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl border border-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action items export */}
      {retros.length > 0 && (
        <div className="game-card p-3">
          <button
            onClick={() => setShowActionItems(s => !s)}
            className="flex items-center justify-between w-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              All Action Items ({allActionItems.length} retro{allActionItems.length !== 1 ? 's' : ''})
            </span>
            {showActionItems ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showActionItems && (
            <div className="mt-3 space-y-3 border-t border-slate-700 pt-3">
              {allActionItems.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No action items yet — add them when creating a retro.</p>
              ) : (
                allActionItems.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">{item.projectName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[item.type]}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap pl-2 border-l border-cyan-500/30">
                      {item.actionItems}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Retro list */}
      {retros.length > 0 ? (
        <div className="space-y-3">
          {retros.map(retro => (
            <RetroCard key={retro.id} retro={retro} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <BarChart3 className="w-14 h-14 mx-auto mb-4 opacity-20 text-violet-400" />
          <p className="text-lg font-medium text-slate-400 mb-1">No retrospectives yet</p>
          <p className="text-sm mb-4">Document learnings from completed projects to grow faster over time.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors"
          >
            Write your first retro
          </button>
        </div>
      )}
    </div>
  )
}
