import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ContentType = 'insight' | 'framework' | 'story' | 'lesson' | 'opinion' | 'research' | 'prediction' | 'how-to' | 'case-study' | 'manifesto'
type ContentStatus = 'draft' | 'developing' | 'ready' | 'published' | 'shelved'
type ContentPlatform = 'blog' | 'linkedin' | 'twitter' | 'newsletter' | 'podcast' | 'book' | 'talk' | 'course' | 'other'

interface ThoughtLeadershipEntry {
  id: string
  contentType: ContentType
  status: ContentStatus
  platform: ContentPlatform
  title: string
  coreIdea: string
  uniqueAngle: string
  targetAudience: string
  keyPoints: string
  callToAction: string
  relevance: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<ContentType, { label: string; emoji: string; color: string }> = {
  insight:      { label: 'Insight',      emoji: '💡', color: '#f59e0b' },
  framework:    { label: 'Framework',    emoji: '🗺️', color: '#3b82f6' },
  story:        { label: 'Story',        emoji: '📖', color: '#ec4899' },
  lesson:       { label: 'Lesson',       emoji: '📚', color: '#6366f1' },
  opinion:      { label: 'Opinion',      emoji: '🎯', color: '#f97316' },
  research:     { label: 'Research',     emoji: '🔬', color: '#84cc16' },
  prediction:   { label: 'Prediction',   emoji: '🔮', color: '#a855f7' },
  'how-to':     { label: 'How-To',       emoji: '⚙️', color: '#22c55e' },
  'case-study': { label: 'Case Study',   emoji: '📊', color: '#0ea5e9' },
  manifesto:    { label: 'Manifesto',    emoji: '📜', color: '#ef4444' },
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  draft:      { label: 'Draft',      color: '#94a3b8' },
  developing: { label: 'Developing', color: '#f59e0b' },
  ready:      { label: 'Ready',      color: '#22c55e' },
  published:  { label: 'Published',  color: '#a855f7' },
  shelved:    { label: 'Shelved',    color: '#ef4444' },
}

const PLATFORM_CONFIG: Record<ContentPlatform, { label: string; emoji: string }> = {
  blog:       { label: 'Blog',       emoji: '✍️' },
  linkedin:   { label: 'LinkedIn',   emoji: '💼' },
  twitter:    { label: 'Twitter/X',  emoji: '🐦' },
  newsletter: { label: 'Newsletter', emoji: '📧' },
  podcast:    { label: 'Podcast',    emoji: '🎙️' },
  book:       { label: 'Book',       emoji: '📚' },
  talk:       { label: 'Talk/Talk',  emoji: '🎤' },
  course:     { label: 'Course',     emoji: '🎓' },
  other:      { label: 'Other',      emoji: '📌' },
}

const STORAGE_KEY = 'thought_leadership'

export default function ThoughtLeadership() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ThoughtLeadershipEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ThoughtLeadershipEntry, 'id' | 'createdAt'>>({
    contentType: 'insight', status: 'draft', platform: 'linkedin',
    title: '', coreIdea: '', uniqueAngle: '', targetAudience: '',
    keyPoints: '', callToAction: '', relevance: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ThoughtLeadershipEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: ThoughtLeadershipEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', coreIdea: '', uniqueAngle: '', targetAudience: '', keyPoints: '', callToAction: '' }))
    setShowForm(false)
    toastSuccess('Idea captured — share your thinking with the world 💡')
  }

  const published = entries.filter(e => e.status === 'published').length
  const ready = entries.filter(e => e.status === 'ready').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            Thought Leadership
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture and develop your ideas for public sharing.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Idea
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Ideas</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{ready}</div>
          <div className="text-xs text-slate-500">Ready</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{published}</div>
          <div className="text-xs text-slate-500">Published</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture Idea</h3>
          <div className="flex gap-2">
            <select value={form.contentType} onChange={e => setForm(f => ({ ...f, contentType: e.target.value as ContentType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ContentType, typeof TYPE_CONFIG.insight][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as ContentPlatform }))} className="game-input text-sm flex-1">
              {(Object.entries(PLATFORM_CONFIG) as [ContentPlatform, typeof PLATFORM_CONFIG.blog][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Headline / title *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.coreIdea} onChange={e => setForm(f => ({ ...f, coreIdea: e.target.value }))}
            placeholder="Core idea — what's the central argument or insight?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.uniqueAngle} onChange={e => setForm(f => ({ ...f, uniqueAngle: e.target.value }))}
            placeholder="Unique angle — what makes your take different?" className="game-input w-full text-sm" />
          <input value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
            placeholder="Target audience" className="game-input w-full text-sm" />
          <input value={form.keyPoints} onChange={e => setForm(f => ({ ...f, keyPoints: e.target.value }))}
            placeholder="Key supporting points" className="game-input w-full text-sm" />
          <input value={form.callToAction} onChange={e => setForm(f => ({ ...f, callToAction: e.target.value }))}
            placeholder="Call to action for the reader" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ContentStatus, typeof STATUS_CONFIG.draft][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Relevance: {form.relevance}/10</p>
              <input type="range" min={1} max={10} value={form.relevance}
                onChange={e => setForm(f => ({ ...f, relevance: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400 mt-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save Idea</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TYPE_CONFIG[e.contentType]
          const s = STATUS_CONFIG[e.status]
          const p = PLATFORM_CONFIG[e.platform]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{t.label}</span>
                  <span className="text-xs">{p.emoji}</span>
                  <span className="text-xs text-yellow-400">⭐ {e.relevance}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{e.title}</p>
                {e.coreIdea && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{e.coreIdea}</p>}
                {e.uniqueAngle && <p className="text-xs text-yellow-300/80 mt-0.5">Angle: {e.uniqueAngle}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your ideas deserve to be heard. Capture them. Share them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
