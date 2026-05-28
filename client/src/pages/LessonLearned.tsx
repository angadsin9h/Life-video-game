import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Star, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type LessonDomain = 'career' | 'relationships' | 'money' | 'health' | 'mindset' | 'business' | 'leadership' | 'creativity' | 'life'

interface Lesson {
  id: string
  date: string
  domain: LessonDomain
  title: string
  context: string
  lesson: string
  action: string
  source: string
  tags: string[]
  starred: boolean
  createdAt: string
}

const DOMAIN_CONFIG: Record<LessonDomain, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships',emoji: '💜', color: '#ec4899' },
  money:         { label: 'Money',        emoji: '💵', color: '#22c55e' },
  health:        { label: 'Health',       emoji: '💪', color: '#f97316' },
  mindset:       { label: 'Mindset',      emoji: '🧠', color: '#a855f7' },
  business:      { label: 'Business',     emoji: '🚀', color: '#f59e0b' },
  leadership:    { label: 'Leadership',   emoji: '👑', color: '#eab308' },
  creativity:    { label: 'Creativity',   emoji: '🎨', color: '#6366f1' },
  life:          { label: 'Life',         emoji: '🌟', color: '#10b981' },
}

const STORAGE_KEY = 'lessons_learned'

export default function LessonLearned() {
  const { toastSuccess } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Omit<Lesson, 'id' | 'starred' | 'createdAt'> & { tagInput: string }>({
    date: new Date().toISOString().split('T')[0], domain: 'life', title: '', context: '',
    lesson: '', action: '', source: '', tags: [], tagInput: '',
  })

  useEffect(() => {
    try { setLessons(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Lesson[]) => { setLessons(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim() || !form.lesson.trim()) return
    const tags = form.tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const l: Lesson = { id: Date.now().toString(), ...form, tags, starred: false, createdAt: new Date().toISOString() }
    save([l, ...lessons])
    setForm({ date: new Date().toISOString().split('T')[0], domain: form.domain, title: '', context: '', lesson: '', action: '', source: '', tags: [], tagInput: '' })
    setShowForm(false)
    toastSuccess('Lesson captured! 📚')
  }

  const toggleStar = (id: string) => save(lessons.map(l => l.id === id ? { ...l, starred: !l.starred } : l))

  const filtered = lessons.filter(l => {
    if (filterDomain !== 'all' && l.domain !== filterDomain) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.lesson.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-teal-400" />
            Lessons Learned
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture insights and lessons from every experience.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{lessons.length}</div>
          <div className="text-xs text-slate-500">Lessons</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{lessons.filter(l => l.starred).length}</div>
          <div className="text-xs text-slate-500">Starred</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{new Set(lessons.map(l => l.domain)).size}</div>
          <div className="text-xs text-slate-500">Domains</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons..." className="game-input w-full pl-8 text-sm" />
        </div>
        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} className="game-input text-sm">
          <option value="all">All domains</option>
          {(Object.entries(DOMAIN_CONFIG) as [LessonDomain, typeof DOMAIN_CONFIG.life][]).map(([k, d]) => (
            <option key={k} value={k}>{d.emoji} {d.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Capture a Lesson</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.entries(DOMAIN_CONFIG) as [LessonDomain, typeof DOMAIN_CONFIG.life][]).map(([k, d]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, domain: k }))}
                className={`py-1.5 rounded-lg text-xs text-center ${form.domain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.domain === k ? { background: d.color + '30', color: d.color } : {}}>
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm" />
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Source (person, event, book)" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Lesson title / headline *" className="game-input w-full" autoFocus />
          <textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="What happened? (context)" className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="The lesson itself *" className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="What action will you take because of this?" className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
            placeholder="Tags (comma-separated)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save Lesson</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(l => {
          const d = DOMAIN_CONFIG[l.domain]
          const isExp = expanded === l.id
          return (
            <div key={l.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${d.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : l.id)}>
                <span className="text-xl">{d.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{l.title}</span>
                    {l.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                    <span style={{ color: d.color }}>{d.label}</span>
                    <span>{l.date}</span>
                    {l.source && <span>via {l.source}</span>}
                  </div>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {l.context && <p className="text-xs text-slate-500 italic">{l.context}</p>}
                  <p className="text-sm text-slate-300 leading-relaxed">{l.lesson}</p>
                  {l.action && <p className="text-sm text-teal-400">→ {l.action}</p>}
                  {l.tags.length > 0 && (
                    <div className="flex gap-1">{l.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{t}</span>)}</div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => toggleStar(l.id)} className={`flex items-center gap-1 text-xs ${l.starred ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`}>
                      <Star className={`w-3 h-3 ${l.starred ? 'fill-yellow-400' : ''}`} /> {l.starred ? 'Unstar' : 'Star'}
                    </button>
                    <button onClick={() => save(lessons.filter(x => x.id !== l.id))} className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No lessons yet. Every experience has something to teach.</p>
          </div>
        )}
      </div>
    </div>
  )
}
