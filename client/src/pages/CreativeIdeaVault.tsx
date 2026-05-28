import { useState, useMemo } from 'react'
import {
  Lightbulb, Plus, Trash2, Save, Star, TrendingUp,
  Target, Tag, Search, Edit3, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IdeaCategory = 'business' | 'creative' | 'personal' | 'technical' | 'social' | 'other'
type IdeaStage = 'seed' | 'sprout' | 'growing' | 'launched'
type ExcitementLevel = 1 | 2 | 3 | 4 | 5
type EffortLevel = 1 | 2 | 3

interface Idea {
  id: string
  title: string
  description: string
  category: IdeaCategory
  stage: IdeaStage
  excitement: ExcitementLevel
  effort: EffortLevel
  tags: string[]
  nextStep: string
  notes: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'creative_idea_vault'

const STAGES: IdeaStage[] = ['seed', 'sprout', 'growing', 'launched']

const STAGE_LABELS: Record<IdeaStage, string> = {
  seed: 'Seed 🌱',
  sprout: 'Sprout 🌿',
  growing: 'Growing 🌳',
  launched: 'Launched 🚀',
}

const STAGE_COLORS: Record<IdeaStage, string> = {
  seed: 'text-slate-300 bg-slate-700/60 border-slate-500/50',
  sprout: 'text-green-300 bg-green-900/40 border-green-500/50',
  growing: 'text-blue-300 bg-blue-900/40 border-blue-500/50',
  launched: 'text-violet-300 bg-violet-900/40 border-violet-500/50',
}

const STAGE_HEADER_COLORS: Record<IdeaStage, string> = {
  seed: 'text-slate-400 border-slate-600',
  sprout: 'text-green-400 border-green-600/60',
  growing: 'text-blue-400 border-blue-600/60',
  launched: 'text-violet-400 border-violet-600/60',
}

const STAGE_NEXT: Record<IdeaStage, IdeaStage | null> = {
  seed: 'sprout',
  sprout: 'growing',
  growing: 'launched',
  launched: null,
}

const CATEGORIES: IdeaCategory[] = ['business', 'creative', 'personal', 'technical', 'social', 'other']

const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  business: 'text-blue-400 bg-blue-900/30 border-blue-500/40',
  creative: 'text-pink-400 bg-pink-900/30 border-pink-500/40',
  personal: 'text-green-400 bg-green-900/30 border-green-500/40',
  technical: 'text-cyan-400 bg-cyan-900/30 border-cyan-500/40',
  social: 'text-orange-400 bg-orange-900/30 border-orange-500/40',
  other: 'text-slate-400 bg-slate-700/50 border-slate-500/40',
}

const EFFORT_LABELS: Record<EffortLevel, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function loadIdeas(): Idea[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Idea[]
  } catch {
    return []
  }
}

function saveIdeas(ideas: Idea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: ExcitementLevel
  onChange?: (v: ExcitementLevel) => void
  readonly?: boolean
}) {
  return (
    <div className="flex gap-0.5">
      {([1, 2, 3, 4, 5] as ExcitementLevel[]).map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`w-3.5 h-3.5 ${n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  )
}

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Idea>) => void
}

function IdeaCard({ idea, onDelete, onUpdate }: IdeaCardProps) {
  const { toastSuccess } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)

  const [draftDesc, setDraftDesc] = useState(idea.description)
  const [draftEffort, setDraftEffort] = useState<EffortLevel>(idea.effort)
  const [draftTags, setDraftTags] = useState(idea.tags.join(', '))
  const [draftNextStep, setDraftNextStep] = useState(idea.nextStep)
  const [draftNotes, setDraftNotes] = useState(idea.notes)

  const nextStage = STAGE_NEXT[idea.stage]

  const handleMoveNext = () => {
    if (!nextStage) return
    onUpdate(idea.id, { stage: nextStage, updatedAt: new Date().toISOString() })
    toastSuccess(`Idea moved to ${STAGE_LABELS[nextStage]}!`)
  }

  const handleSaveDetail = () => {
    const parsedTags = draftTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    onUpdate(idea.id, {
      description: draftDesc,
      effort: draftEffort,
      tags: parsedTags,
      nextStep: draftNextStep,
      notes: draftNotes,
      updatedAt: new Date().toISOString(),
    })
    setEditing(false)
    toastSuccess('Idea updated!')
  }

  const handleCancelEdit = () => {
    setDraftDesc(idea.description)
    setDraftEffort(idea.effort)
    setDraftTags(idea.tags.join(', '))
    setDraftNextStep(idea.nextStep)
    setDraftNotes(idea.notes)
    setEditing(false)
  }

  return (
    <div className="game-card p-3 flex flex-col gap-2 group hover:border-slate-600 transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[idea.category]}`}>
            {idea.category}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => { setExpanded(e => !e); setEditing(false) }}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
            title="Expand"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-slate-200 text-sm font-semibold leading-snug">{idea.title}</p>

      {/* Stars */}
      <StarRating value={idea.excitement} readonly />

      {/* Next step preview */}
      {idea.nextStep && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <Target className="w-3 h-3 flex-shrink-0 text-slate-500" />
          {idea.nextStep}
        </p>
      )}

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {idea.tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/60 text-slate-400 text-[10px] rounded-full"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expand panel */}
      {expanded && (
        <div className="pt-2 border-t border-slate-700/60 space-y-3">
          {editing ? (
            <>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Description</label>
                <textarea
                  className="game-input w-full text-xs resize-none min-h-[70px]"
                  value={draftDesc}
                  onChange={e => setDraftDesc(e.target.value)}
                  placeholder="Describe the idea..."
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Effort</label>
                <select
                  className="game-input text-xs w-full"
                  value={draftEffort}
                  onChange={e => setDraftEffort(Number(e.target.value) as EffortLevel)}
                >
                  {([1, 2, 3] as EffortLevel[]).map(n => (
                    <option key={n} value={n}>{EFFORT_LABELS[n]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Tags (comma-separated)</label>
                <input
                  className="game-input w-full text-xs"
                  value={draftTags}
                  onChange={e => setDraftTags(e.target.value)}
                  placeholder="e.g. startup, mvp, design"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Next Step</label>
                <input
                  className="game-input w-full text-xs"
                  value={draftNextStep}
                  onChange={e => setDraftNextStep(e.target.value)}
                  placeholder="What's the very next action?"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Notes</label>
                <textarea
                  className="game-input w-full text-xs resize-none min-h-[60px]"
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  placeholder="Extra thoughts, links, references..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDetail}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {idea.description && (
                <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>Effort: <span className="text-slate-300">{EFFORT_LABELS[idea.effort]}</span></span>
              </div>
              {idea.notes && (
                <p className="text-[11px] text-slate-400 italic">{idea.notes}</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
              >
                <Edit3 className="w-3 h-3" /> Edit Details
              </button>
            </>
          )}
        </div>
      )}

      {/* Move to next stage */}
      {nextStage && (
        <button
          onClick={handleMoveNext}
          className={`mt-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${STAGE_COLORS[nextStage]} hover:opacity-80`}
        >
          Move to {STAGE_LABELS[nextStage]} →
        </button>
      )}
      {!nextStage && (
        <span className="text-[10px] text-violet-400 font-semibold px-2 py-1 rounded-lg border border-violet-500/40 bg-violet-900/20 inline-block">
          Launched ✓
        </span>
      )}
    </div>
  )
}

const EMPTY_QUICK = {
  title: '',
  description: '',
  category: 'other' as IdeaCategory,
  excitement: 3 as ExcitementLevel,
}

export default function CreativeIdeaVault() {
  const { toastSuccess } = useToast()
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas)
  const [quickTitle, setQuickTitle] = useState(EMPTY_QUICK.title)
  const [quickDesc, setQuickDesc] = useState(EMPTY_QUICK.description)
  const [quickCategory, setQuickCategory] = useState<IdeaCategory>(EMPTY_QUICK.category)
  const [quickExcitement, setQuickExcitement] = useState<ExcitementLevel>(EMPTY_QUICK.excitement)
  const [filterCategory, setFilterCategory] = useState<IdeaCategory | 'all'>('all')
  const [searchQ, setSearchQ] = useState('')

  const persist = (updated: Idea[]) => {
    setIdeas(updated)
    saveIdeas(updated)
  }

  const handleAdd = () => {
    if (!quickTitle.trim()) return
    const now = new Date().toISOString()
    const idea: Idea = {
      id: uid(),
      title: quickTitle.trim(),
      description: quickDesc.trim(),
      category: quickCategory,
      stage: 'seed',
      excitement: quickExcitement,
      effort: 1,
      tags: [],
      nextStep: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    }
    persist([idea, ...ideas])
    setQuickTitle('')
    setQuickDesc('')
    setQuickExcitement(3)
    setQuickCategory('other')
    toastSuccess('Idea captured!', `"${idea.title}" added as a Seed`)
  }

  const handleDelete = (id: string) => {
    persist(ideas.filter(i => i.id !== id))
    toastSuccess('Idea removed')
  }

  const handleUpdate = (id: string, updates: Partial<Idea>) => {
    persist(ideas.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  // Stats
  const totalIdeas = ideas.length
  const stageCounts = STAGES.reduce<Record<IdeaStage, number>>((acc, s) => {
    acc[s] = ideas.filter(i => i.stage === s).length
    return acc
  }, { seed: 0, sprout: 0, growing: 0, launched: 0 })
  const avgExcitement = totalIdeas > 0
    ? (ideas.reduce((s, i) => s + i.excitement, 0) / totalIdeas).toFixed(1)
    : '—'
  const launchedCount = stageCounts.launched

  // Idea of the day: highest excitement seed/sprout
  const ideaOfDay = useMemo(() => {
    const candidates = ideas.filter(i => i.stage === 'seed' || i.stage === 'sprout')
    if (candidates.length === 0) return null
    return candidates.reduce((best, cur) => cur.excitement > best.excitement ? cur : best)
  }, [ideas])

  // Filtered ideas per stage
  const filteredIdeas = useMemo(() => {
    return ideas.filter(i => {
      if (filterCategory !== 'all' && i.category !== filterCategory) return false
      if (searchQ) {
        const q = searchQ.toLowerCase()
        const inTitle = i.title.toLowerCase().includes(q)
        const inDesc = i.description.toLowerCase().includes(q)
        const inTags = i.tags.some(t => t.toLowerCase().includes(q))
        if (!inTitle && !inDesc && !inTags) return false
      }
      return true
    })
  }, [ideas, filterCategory, searchQ])

  const ideasByStage = (stage: IdeaStage) =>
    filteredIdeas.filter(i => i.stage === stage).sort((a, b) => b.excitement - a.excitement)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Creative Idea Vault
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture, develop, and launch your best ideas</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalIdeas}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Total Ideas</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-slate-300" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stageCounts.seed + stageCounts.sprout}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">In Progress</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-300" style={{ fontFamily: 'Orbitron, monospace' }}>
            {avgExcitement}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Avg Excitement</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {launchedCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Launched</div>
        </div>
      </div>

      {/* Idea of the Day */}
      {ideaOfDay && (
        <div className="game-card p-4 border-yellow-500/30 glowing-border-gold">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Idea of the Day</span>
          </div>
          <p className="text-white font-semibold text-sm">{ideaOfDay.title}</p>
          {ideaOfDay.description && (
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{ideaOfDay.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <StarRating value={ideaOfDay.excitement} readonly />
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[ideaOfDay.category]}`}>
              {ideaOfDay.category}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STAGE_COLORS[ideaOfDay.stage]}`}>
              {STAGE_LABELS[ideaOfDay.stage]}
            </span>
          </div>
        </div>
      )}

      {/* Quick Capture */}
      <div className="game-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">Quick Capture</span>
        </div>
        <input
          className="game-input w-full text-sm"
          placeholder="Idea title..."
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && quickTitle.trim()) handleAdd() }}
        />
        <textarea
          className="game-input w-full text-sm resize-none min-h-[80px]"
          placeholder="Dump your idea... describe it freely, even rough thoughts count"
          value={quickDesc}
          onChange={e => setQuickDesc(e.target.value)}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="game-input text-sm flex-1 min-w-[120px]"
            value={quickCategory}
            onChange={e => setQuickCategory(e.target.value as IdeaCategory)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Excitement:</span>
            <StarRating value={quickExcitement} onChange={setQuickExcitement} />
          </div>
          <button
            onClick={handleAdd}
            disabled={!quickTitle.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Lightbulb className="w-4 h-4" /> Add Idea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            className="game-input w-full pl-9 text-sm"
            placeholder="Search ideas..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>
        <button
          onClick={() => setFilterCategory('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCategory === 'all' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCategory === cat ? CATEGORY_COLORS[cat] : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Kanban Columns */}
      {totalIdeas > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map(stage => {
            const stageIdeas = ideasByStage(stage)
            return (
              <div key={stage} className="flex flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${STAGE_HEADER_COLORS[stage]} bg-slate-800/50`}>
                  <span className="text-sm font-bold">{STAGE_LABELS[stage]}</span>
                  <span className="text-xs font-bold bg-slate-700 px-2 py-0.5 rounded-full">
                    {stageCounts[stage]}
                  </span>
                </div>

                {/* Cards */}
                {stageIdeas.length > 0 ? (
                  stageIdeas.map(idea => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    No ideas here yet
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <Lightbulb className="w-14 h-14 mx-auto mb-4 opacity-20 text-yellow-400" />
          <p className="text-lg font-medium text-slate-400 mb-1">No ideas yet</p>
          <p className="text-sm">Use the Quick Capture above to plant your first seed.</p>
        </div>
      )}

      {/* Stage breakdown footer */}
      {totalIdeas > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Pipeline Overview</span>
          </div>
          <div className="space-y-2">
            {STAGES.map(stage => {
              const count = stageCounts[stage]
              const pct = totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 flex-shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stage === 'seed' ? 'bg-slate-500' :
                        stage === 'sprout' ? 'bg-green-500' :
                        stage === 'growing' ? 'bg-blue-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
