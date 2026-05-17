import { useState, useMemo } from 'react'
import { Lightbulb, Plus, Trash2, ChevronRight, Star, Calendar, X, Target } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Category = 'Business' | 'Creative' | 'Personal' | 'Tech' | 'Social' | 'Learning' | 'Health' | 'Finance'
type Stage = 'Seed' | 'Sprout' | 'Growing' | 'Mature' | 'Archived'

interface IdeaNote {
  text: string
  createdAt: string
}

interface Idea {
  id: string
  title: string
  description: string
  category: Category
  stage: Stage
  createdAt: string
  notes: IdeaNote[]
}

const STORAGE_KEY = 'idea_incubator'

const CATEGORIES: Category[] = ['Business', 'Creative', 'Personal', 'Tech', 'Social', 'Learning', 'Health', 'Finance']

const STAGES: Stage[] = ['Seed', 'Sprout', 'Growing', 'Mature', 'Archived']

const STAGE_NEXT: Record<Stage, Stage | null> = {
  Seed: 'Sprout',
  Sprout: 'Growing',
  Growing: 'Mature',
  Mature: 'Archived',
  Archived: null,
}

const STAGE_COLORS: Record<Stage, string> = {
  Seed:     'text-slate-400 bg-slate-700/60 border-slate-600/50',
  Sprout:   'text-green-400 bg-green-900/30 border-green-500/40',
  Growing:  'text-cyan-400 bg-cyan-900/30 border-cyan-500/40',
  Mature:   'text-yellow-400 bg-yellow-900/30 border-yellow-500/40',
  Archived: 'text-slate-500 bg-slate-800/60 border-slate-700/50',
}

const CATEGORY_COLORS: Record<Category, string> = {
  Business: 'text-blue-400 bg-blue-900/30 border-blue-500/40',
  Creative: 'text-pink-400 bg-pink-900/30 border-pink-500/40',
  Personal: 'text-green-400 bg-green-900/30 border-green-500/40',
  Tech:     'text-cyan-400 bg-cyan-900/30 border-cyan-500/40',
  Social:   'text-orange-400 bg-orange-900/30 border-orange-500/40',
  Learning: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/40',
  Health:   'text-emerald-400 bg-emerald-900/30 border-emerald-500/40',
  Finance:  'text-violet-400 bg-violet-900/30 border-violet-500/40',
}

function loadIdeas(): Idea[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveIdeas(ideas: Idea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function formatNoteTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

const STAGE_ALL = 'All' as const
type StageFilter = Stage | typeof STAGE_ALL

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
  onAdvance: (id: string) => void
  onAddNote: (id: string, text: string) => void
  onConvert: (id: string) => void
}

function IdeaCard({ idea, onDelete, onAdvance, onAddNote, onConvert }: IdeaCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [noteText, setNoteText] = useState('')

  const nextStage = STAGE_NEXT[idea.stage]
  const days = daysSince(idea.createdAt)

  const handleAddNote = () => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    onAddNote(idea.id, trimmed)
    setNoteText('')
  }

  return (
    <div className="game-card p-4 flex flex-col gap-3 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[idea.category]}`}>
            {idea.category}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STAGE_COLORS[idea.stage]}`}>
            {idea.stage}
          </span>
        </div>
        <button
          onClick={() => onDelete(idea.id)}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title & description */}
      <div>
        <h3 className="text-slate-100 font-semibold text-sm leading-snug">{idea.title}</h3>
        {idea.description && (
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{idea.description}</p>
        )}
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-3 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(idea.createdAt)}
        </span>
        <span>{days === 0 ? 'Today' : `${days}d ago`}</span>
        {idea.notes.length > 0 && (
          <span className="text-slate-500">{idea.notes.length} note{idea.notes.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {nextStage && (
          <button
            onClick={() => onAdvance(idea.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg border border-slate-600 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Advance to {nextStage}
          </button>
        )}
        {idea.stage === 'Mature' && (
          <button
            onClick={() => onConvert(idea.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs rounded-lg border border-yellow-500/30 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            Convert to Project
          </button>
        )}
        <button
          onClick={() => setShowNotes(s => !s)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors ml-auto"
        >
          <Star className="w-3 h-3" />
          {showNotes ? 'Hide Notes' : 'Notes'}
        </button>
      </div>

      {/* Notes section */}
      {showNotes && (
        <div className="border-t border-slate-700 pt-3 space-y-2">
          {idea.notes.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {idea.notes.map((note, i) => (
                <div key={i} className="text-xs bg-slate-700/40 rounded-lg p-2">
                  <p className="text-slate-300 leading-relaxed">{note.text}</p>
                  <p className="text-slate-600 mt-1">{formatNoteTime(note.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="game-input flex-1 text-xs py-1.5"
              placeholder="Add a note or update…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Personal' as Category,
  stage: 'Seed' as Stage,
}

export default function IdeaIncubator() {
  const { toastSuccess } = useToast()
  const [ideas, setIdeas] = useState<Idea[]>(loadIdeas)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [stageFilter, setStageFilter] = useState<StageFilter>(STAGE_ALL)

  const persist = (updated: Idea[]) => {
    setIdeas(updated)
    saveIdeas(updated)
  }

  const handleAdd = () => {
    if (!form.title.trim()) return
    const newIdea: Idea = {
      id: uid(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      stage: form.stage,
      createdAt: new Date().toISOString(),
      notes: [],
    }
    persist([newIdea, ...ideas])
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('Idea captured!', `${form.category} · ${form.stage}`)
  }

  const handleDelete = (id: string) => {
    persist(ideas.filter(i => i.id !== id))
    toastSuccess('Idea removed')
  }

  const handleAdvance = (id: string) => {
    const updated = ideas.map(i => {
      if (i.id !== id) return i
      const next = STAGE_NEXT[i.stage]
      if (!next) return i
      return { ...i, stage: next }
    })
    persist(updated)
    const idea = ideas.find(i => i.id === id)
    if (idea) {
      const next = STAGE_NEXT[idea.stage]
      if (next) toastSuccess('Stage advanced!', `${idea.title} → ${next}`)
    }
  }

  const handleAddNote = (id: string, text: string) => {
    const updated = ideas.map(i => {
      if (i.id !== id) return i
      return {
        ...i,
        notes: [...i.notes, { text, createdAt: new Date().toISOString() }],
      }
    })
    persist(updated)
    toastSuccess('Note added!')
  }

  const handleConvert = (id: string) => {
    const idea = ideas.find(i => i.id === id)
    if (idea) toastSuccess('Convert to Project', `"${idea.title}" is ready to become a project!`)
  }

  const stageCounts = useMemo(() => {
    const counts: Record<Stage, number> = { Seed: 0, Sprout: 0, Growing: 0, Mature: 0, Archived: 0 }
    ideas.forEach(i => { counts[i.stage]++ })
    return counts
  }, [ideas])

  const filtered = useMemo(() => {
    if (stageFilter === STAGE_ALL) return ideas
    return ideas.filter(i => i.stage === stageFilter)
  }, [ideas, stageFilter])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Idea Incubator
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Grow raw ideas into mature projects</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showForm
              ? 'bg-slate-700 text-slate-300 border border-slate-600'
              : 'bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-500'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Idea'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {STAGES.map(stage => (
          <div key={stage} className="game-card p-3 text-center">
            <div className={`text-xl font-bold ${STAGE_COLORS[stage].split(' ')[0]}`} style={{ fontFamily: 'Orbitron, monospace' }}>
              {stageCounts[stage]}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stage}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="game-card p-4 space-y-3 border-yellow-500/20 glowing-border-gold">
          <input
            autoFocus
            className="game-input w-full font-semibold"
            placeholder="Idea title…"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <textarea
            rows={3}
            className="game-input w-full text-sm resize-none"
            placeholder="Describe the idea, the problem it solves, or the opportunity…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="game-input text-sm"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="game-input text-sm"
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
            >
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.title.trim()}
              className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" /> Capture Idea
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-xl border border-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stage filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setStageFilter(STAGE_ALL)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            stageFilter === STAGE_ALL
              ? 'bg-slate-600 text-slate-200 border border-slate-500'
              : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
          }`}
        >
          All ({ideas.length})
        </button>
        {STAGES.map(stage => (
          <button
            key={stage}
            onClick={() => setStageFilter(stage)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              stageFilter === stage
                ? `${STAGE_COLORS[stage]} border`
                : 'bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700'
            }`}
          >
            {stage} ({stageCounts[stage]})
          </button>
        ))}
      </div>

      {/* Ideas grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onDelete={handleDelete}
              onAdvance={handleAdvance}
              onAddNote={handleAddNote}
              onConvert={handleConvert}
            />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Lightbulb className="w-14 h-14 mx-auto mb-4 opacity-20 text-yellow-400" />
          <p className="text-lg font-medium text-slate-400 mb-1">No ideas yet</p>
          <p className="text-sm mb-4">Start planting seeds — every big project started as a rough idea.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-xl transition-colors"
          >
            Plant your first idea
          </button>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20 text-yellow-400" />
          <p className="text-sm">No ideas in the <span className="text-slate-400 font-medium">{stageFilter}</span> stage.</p>
          <button
            onClick={() => setStageFilter(STAGE_ALL)}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline transition-colors"
          >
            Show all ideas
          </button>
        </div>
      )}
    </div>
  )
}
