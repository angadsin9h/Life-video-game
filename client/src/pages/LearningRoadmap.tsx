import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LearningDomain = 'technical' | 'creative' | 'business' | 'science' | 'humanities' | 'health' | 'philosophy' | 'language' | 'financial' | 'other'
type LearningFormat = 'book' | 'course' | 'podcast' | 'mentor' | 'practice' | 'community' | 'youtube' | 'bootcamp' | 'research' | 'project'
type MasteryLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'

interface LearningPath {
  id: string
  domain: LearningDomain
  format: LearningFormat
  mastery: MasteryLevel
  subject: string
  whyLearning: string
  resources: string
  milestones: string
  currentProgress: string
  hoursPerWeek: number
  progressPct: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<LearningDomain, { label: string; emoji: string; color: string }> = {
  technical:  { label: 'Technical',   emoji: '💻', color: '#3b82f6' },
  creative:   { label: 'Creative',    emoji: '🎨', color: '#f97316' },
  business:   { label: 'Business',    emoji: '💼', color: '#22c55e' },
  science:    { label: 'Science',     emoji: '🔬', color: '#6366f1' },
  humanities: { label: 'Humanities',  emoji: '📜', color: '#f59e0b' },
  health:     { label: 'Health',      emoji: '💪', color: '#ef4444' },
  philosophy: { label: 'Philosophy',  emoji: '🦉', color: '#a855f7' },
  language:   { label: 'Language',    emoji: '🌍', color: '#0ea5e9' },
  financial:  { label: 'Financial',   emoji: '💰', color: '#84cc16' },
  other:      { label: 'Other',       emoji: '📚', color: '#94a3b8' },
}

const FORMAT_CONFIG: Record<LearningFormat, { label: string; emoji: string }> = {
  book:      { label: 'Book',       emoji: '📖' },
  course:    { label: 'Course',     emoji: '🎓' },
  podcast:   { label: 'Podcast',    emoji: '🎧' },
  mentor:    { label: 'Mentor',     emoji: '🧑‍🏫' },
  practice:  { label: 'Practice',   emoji: '⚡' },
  community: { label: 'Community',  emoji: '👥' },
  youtube:   { label: 'YouTube',    emoji: '📺' },
  bootcamp:  { label: 'Bootcamp',   emoji: '🏕️' },
  research:  { label: 'Research',   emoji: '🔍' },
  project:   { label: 'Project',    emoji: '🛠️' },
}

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; pct: number }> = {
  beginner:     { label: 'Beginner',     color: '#94a3b8', pct: 10 },
  intermediate: { label: 'Intermediate', color: '#3b82f6', pct: 40 },
  advanced:     { label: 'Advanced',     color: '#22c55e', pct: 70 },
  expert:       { label: 'Expert',       color: '#f59e0b', pct: 90 },
  master:       { label: 'Master',       color: '#a855f7', pct: 100 },
}

const STORAGE_KEY = 'learning_roadmap'

export default function LearningRoadmap() {
  const { toastSuccess } = useToast()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LearningPath, 'id' | 'createdAt'>>({
    domain: 'technical', format: 'book', mastery: 'beginner',
    subject: '', whyLearning: '', resources: '', milestones: '',
    currentProgress: '', hoursPerWeek: 5, progressPct: 0,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setPaths(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LearningPath[]) => { setPaths(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.subject.trim()) return
    const p: LearningPath = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([p, ...paths])
    setForm(f => ({ ...f, subject: '', whyLearning: '', resources: '', milestones: '', currentProgress: '', progressPct: 0 }))
    setShowForm(false)
    toastSuccess('Learning path added — knowledge compounds 📚')
  }

  const totalHours = paths.reduce((s, p) => s + p.hoursPerWeek, 0)
  const avgProgress = paths.length ? Math.round(paths.reduce((s, p) => s + p.progressPct, 0) / paths.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Learning Roadmap
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map your learning paths. Track mastery across domains.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{paths.length}</div>
          <div className="text-xs text-slate-500">Paths</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{totalHours}h/wk</div>
          <div className="text-xs text-slate-500">Weekly Study</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgProgress}%</div>
          <div className="text-xs text-slate-500">Avg Progress</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Learning Path</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as LearningDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [LearningDomain, typeof DOMAIN_CONFIG.technical][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value as LearningFormat }))} className="game-input text-sm flex-1">
              {(Object.entries(FORMAT_CONFIG) as [LearningFormat, typeof FORMAT_CONFIG.book][]).map(([k, f]) => (
                <option key={k} value={k}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="What are you learning? *" className="game-input w-full text-sm" autoFocus />
          <input value={form.whyLearning} onChange={e => setForm(f => ({ ...f, whyLearning: e.target.value }))}
            placeholder="Why is this important to you?" className="game-input w-full text-sm" />
          <input value={form.resources} onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
            placeholder="Key resources (books, courses, etc.)" className="game-input w-full text-sm" />
          <input value={form.milestones} onChange={e => setForm(f => ({ ...f, milestones: e.target.value }))}
            placeholder="Key milestones to reach" className="game-input w-full text-sm" />
          <input value={form.currentProgress} onChange={e => setForm(f => ({ ...f, currentProgress: e.target.value }))}
            placeholder="Current progress / where you are now" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <select value={form.mastery} onChange={e => setForm(f => ({ ...f, mastery: e.target.value as MasteryLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(MASTERY_CONFIG) as [MasteryLevel, typeof MASTERY_CONFIG.beginner][]).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">{form.hoursPerWeek}h/week</p>
              <input type="range" min={1} max={40} value={form.hoursPerWeek}
                onChange={e => setForm(f => ({ ...f, hoursPerWeek: Number(e.target.value) }))}
                className="w-full h-1 accent-indigo-400" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Progress: {form.progressPct}%</p>
            <input type="range" min={0} max={100} value={form.progressPct}
              onChange={e => setForm(f => ({ ...f, progressPct: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Add Path</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {paths.map(p => {
          const d = DOMAIN_CONFIG[p.domain]
          const m = MASTERY_CONFIG[p.mastery]
          const fm = FORMAT_CONFIG[p.format]
          return (
            <div key={p.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: m.color + '20', color: m.color }}>{m.label}</span>
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs">{fm.emoji}</span>
                  <span className="text-xs text-indigo-400">⏱ {p.hoursPerWeek}h/wk</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{p.subject}</p>
                <div className="w-full bg-slate-700 rounded-full h-1 mt-1.5">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${p.progressPct}%`, background: d.color }} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.progressPct}% complete</p>
              </div>
              <button onClick={() => save(paths.filter(x => x.id !== p.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {paths.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">An investment in knowledge always pays the best interest.</p>
          </div>
        )}
      </div>
    </div>
  )
}
