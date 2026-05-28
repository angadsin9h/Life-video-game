import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ModelCategory = 'thinking' | 'decision-making' | 'psychology' | 'systems' | 'economics' | 'physics' | 'biology' | 'philosophy' | 'math' | 'other'

interface MentalModel {
  id: string
  name: string
  category: ModelCategory
  origin: string
  description: string
  howToUse: string
  example: string
  when: string
  mastery: number
  isFavorite: boolean
  createdAt: string
}

const CAT_CONFIG: Record<ModelCategory, { label: string; emoji: string; color: string }> = {
  thinking:        { label: 'Thinking',       emoji: '🧠', color: '#6366f1' },
  'decision-making':{ label: 'Decisions',     emoji: '⚖️', color: '#f59e0b' },
  psychology:      { label: 'Psychology',     emoji: '💭', color: '#ec4899' },
  systems:         { label: 'Systems',        emoji: '⚙️', color: '#22c55e' },
  economics:       { label: 'Economics',      emoji: '📊', color: '#84cc16' },
  physics:         { label: 'Physics',        emoji: '⚛️', color: '#3b82f6' },
  biology:         { label: 'Biology',        emoji: '🧬', color: '#a855f7' },
  philosophy:      { label: 'Philosophy',     emoji: '🤔', color: '#f97316' },
  math:            { label: 'Math',           emoji: '📐', color: '#0ea5e9' },
  other:           { label: 'Other',          emoji: '💡', color: '#94a3b8' },
}

const DEFAULT_MODELS = [
  { name: 'First Principles', category: 'thinking' as ModelCategory, origin: 'Aristotle / Elon Musk', description: 'Break down problems to their fundamental truths and reason up from there.', howToUse: 'Ask "What is fundamentally true here?" repeatedly until you reach base facts.', example: 'Instead of copying existing rockets, ask what rockets actually need and build from those parts.', when: 'When solving complex problems or when conventional thinking is holding you back.' },
  { name: 'Second-Order Thinking', category: 'thinking' as ModelCategory, origin: 'Howard Marks', description: 'Consider not just the immediate effects of a decision, but the effects of those effects.', howToUse: 'Ask "And then what?" to trace consequences further into the future.', example: 'Cutting prices boosts sales (1st order), but may trigger a price war (2nd order).', when: 'Making important strategic decisions with long-term consequences.' },
  { name: 'Occam\'s Razor', category: 'thinking' as ModelCategory, origin: 'William of Ockham', description: 'Among competing hypotheses, prefer the one with fewest assumptions.', howToUse: 'When multiple explanations fit, favor the simplest one.', example: 'Your friend didn\'t reply — they\'re probably busy, not angry with you.', when: 'Explaining events or choosing between theories.' },
]

const STORAGE_KEY = 'mental_models'

export default function MentalModels() {
  const { toastSuccess } = useToast()
  const [models, setModels] = useState<MentalModel[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<MentalModel, 'id' | 'createdAt'>>({
    name: '', category: 'thinking', origin: '', description: '',
    howToUse: '', example: '', when: '', mastery: 3, isFavorite: false,
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (stored.length === 0) {
        const defaults: MentalModel[] = DEFAULT_MODELS.map((m, i) => ({
          id: `default-${i}`, ...m, mastery: 4, isFavorite: true, createdAt: new Date().toISOString(),
        }))
        setModels(defaults)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      } else {
        setModels(stored)
      }
    } catch { /**/ }
  }, [])

  const save = (u: MentalModel[]) => { setModels(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim() || !form.description.trim()) return
    const m: MentalModel = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([m, ...models])
    setForm({ name: '', category: 'thinking', origin: '', description: '', howToUse: '', example: '', when: '', mastery: 3, isFavorite: false })
    setShowForm(false)
    toastSuccess('Mental model added 🧠')
  }

  const filtered = models.filter(m => filterCat === 'all' || m.category === filterCat)
  const mastered = models.filter(m => m.mastery >= 4).length
  const usedCats = [...new Set(models.map(m => m.category))]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-indigo-400" />
            Mental Models
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your thinking toolkit.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{models.length}</div>
          <div className="text-xs text-slate-500">Models</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{mastered}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{models.filter(m => m.isFavorite).length}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {usedCats.map(c => {
          const cfg = CAT_CONFIG[c as ModelCategory]
          return (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === c ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterCat === c ? { background: cfg.color + '30', color: cfg.color } : {}}>
              {cfg.emoji} {cfg.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Mental Model</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Model name *" className="game-input flex-1" autoFocus />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ModelCategory }))} className="game-input text-sm">
              {(Object.entries(CAT_CONFIG) as [ModelCategory, typeof CAT_CONFIG.thinking][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
            placeholder="Origin / source" className="game-input w-full text-sm" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this model? *" className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.howToUse} onChange={e => setForm(f => ({ ...f, howToUse: e.target.value }))}
            placeholder="How to apply it..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
            placeholder="Real-world example..." className="game-input w-full h-10 resize-none text-sm" />
          <input value={form.when} onChange={e => setForm(f => ({ ...f, when: e.target.value }))}
            placeholder="When to use it..." className="game-input w-full text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Mastery: {form.mastery}/5</span>
            <input type="range" min={1} max={5} value={form.mastery}
              onChange={e => setForm(f => ({ ...f, mastery: Number(e.target.value) }))}
              className="flex-1 h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(m => {
          const c = CAT_CONFIG[m.category]
          const isExp = expanded === m.id
          return (
            <div key={m.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : m.id)}>
                <span className="text-2xl">{m.isFavorite ? '⭐' : c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{m.name}</span>
                    <span className="text-xs text-slate-500">{'●'.repeat(m.mastery)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label}{m.origin && ` · ${m.origin}`}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-xs text-slate-300">{m.description}</p>
                  {m.howToUse && <p className="text-xs text-indigo-300">💡 {m.howToUse}</p>}
                  {m.example && <p className="text-xs text-yellow-300">📖 {m.example}</p>}
                  {m.when && <p className="text-xs text-slate-500">⏰ {m.when}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => save(models.map(x => x.id === m.id ? { ...x, isFavorite: !x.isFavorite } : x))}
                      className="text-xs text-indigo-600 hover:text-indigo-400">
                      {m.isFavorite ? '★ Unfavorite' : '☆ Favorite'}
                    </button>
                    <button onClick={() => save(models.filter(x => x.id !== m.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
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
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Collect mental models to upgrade your thinking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
