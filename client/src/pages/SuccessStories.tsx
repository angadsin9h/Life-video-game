import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type StoryDomain = 'career' | 'health' | 'relationships' | 'finance' | 'personal' | 'education' | 'creative' | 'sports' | 'family' | 'other'

interface SuccessStory {
  id: string
  domain: StoryDomain
  title: string
  situation: string
  actions: string
  result: string
  impact: string
  skills: string
  difficulty: number
  pride: number
  date: string
  isFeatured: boolean
  createdAt: string
}

const DOMAIN_CONFIG: Record<StoryDomain, { label: string; emoji: string; color: string }> = {
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#f59e0b' },
  personal:      { label: 'Personal',      emoji: '🌱', color: '#a855f7' },
  education:     { label: 'Education',     emoji: '🎓', color: '#6366f1' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f97316' },
  sports:        { label: 'Sports',        emoji: '🏅', color: '#0ea5e9' },
  family:        { label: 'Family',        emoji: '👨‍👩‍👧', color: '#84cc16' },
  other:         { label: 'Other',         emoji: '⭐', color: '#94a3b8' },
}

const STORAGE_KEY = 'success_stories'

export default function SuccessStories() {
  const { toastSuccess } = useToast()
  const [stories, setStories] = useState<SuccessStory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<SuccessStory, 'id' | 'createdAt'>>({
    domain: 'career', title: '', situation: '', actions: '', result: '',
    impact: '', skills: '', difficulty: 3, pride: 5, date: new Date().toISOString().split('T')[0], isFeatured: false,
  })

  useEffect(() => {
    try { setStories(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SuccessStory[]) => { setStories(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const s: SuccessStory = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...stories])
    setForm(f => ({ ...f, title: '', situation: '', actions: '', result: '', impact: '', skills: '' }))
    setShowForm(false)
    toastSuccess('Success story saved 🏆')
  }

  const filtered = stories.filter(s => filterDomain === 'all' || s.domain === filterDomain)
  const featured = stories.filter(s => s.isFeatured).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Success Stories
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your wins using the STAR method.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{stories.length}</div>
          <div className="text-xs text-slate-500">Stories</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{featured}</div>
          <div className="text-xs text-slate-500">Featured</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{[...new Set(stories.map(s => s.domain))].length}</div>
          <div className="text-xs text-slate-500">Domains</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [StoryDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: d.color + '30', color: d.color } : {}}>
            {d.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Story (STAR Method)</h3>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Story title *" className="game-input flex-1" autoFocus />
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as StoryDomain }))} className="game-input text-sm">
              {(Object.entries(DOMAIN_CONFIG) as [StoryDomain, typeof DOMAIN_CONFIG.career][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="Situation — What was the context?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.actions} onChange={e => setForm(f => ({ ...f, actions: e.target.value }))}
            placeholder="Actions — What did YOU do?" className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
            placeholder="Result — What happened? (quantify if possible)" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="Long-term impact..." className="game-input w-full text-sm" />
          <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Skills demonstrated..." className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Difficulty: {form.difficulty}/5</p>
              <input type="range" min={1} max={5} value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pride: {form.pride}/5</p>
              <input type="range" min={1} max={5} value={form.pride}
                onChange={e => setForm(f => ({ ...f, pride: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => {
          const d = DOMAIN_CONFIG[s.domain]
          const isExp = expanded === s.id
          return (
            <div key={s.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${d.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <span className="text-2xl">{s.isFeatured ? '⭐' : d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white text-sm">{s.title}</span>
                  <p className="text-xs text-slate-500">{d.label} · {s.date} · Pride {'★'.repeat(s.pride)}{'☆'.repeat(5 - s.pride)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {s.situation && <p className="text-xs text-slate-400"><span className="text-slate-500">S:</span> {s.situation}</p>}
                  {s.actions && <p className="text-xs text-blue-300"><span className="text-slate-500">A:</span> {s.actions}</p>}
                  {s.result && <p className="text-xs text-green-300"><span className="text-slate-500">R:</span> {s.result}</p>}
                  {s.impact && <p className="text-xs text-yellow-300">📈 {s.impact}</p>}
                  {s.skills && <p className="text-xs text-purple-300">🎯 Skills: {s.skills}</p>}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => save(stories.map(x => x.id === s.id ? { ...x, isFeatured: !x.isFeatured } : x))}
                      className="text-xs text-yellow-600 hover:text-yellow-400">
                      <Star className="w-3 h-3 inline mr-1" />{s.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => save(stories.filter(x => x.id !== s.id))} className="ml-auto text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every win deserves to be remembered. Start documenting your victories.</p>
          </div>
        )}
      </div>
    </div>
  )
}
